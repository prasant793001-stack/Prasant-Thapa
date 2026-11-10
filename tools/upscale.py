#!/usr/bin/env python3
"""
upscale.py - AI upscaling for your generated images (Real-ESRGAN "general x4 v3"), no PyTorch needed.

  python tools/upscale.py pose.png pose_4k.png --height 2160
  python tools/upscale.py inbox inbox_4k --height 2160          (a whole folder)
  python tools/upscale.py pose.png out.png --scale 2            (exactly 2x)

How it works
  - runs the model at 4x, then shrinks to the size you asked for (sharper than upscaling straight to it)
  - transparent PNGs keep their cut-out edge: colours are bled into the transparent area first, so no halo
  - an image that is already tall enough is only copied (use --force to run it anyway)
  - uses your GPU when one is available (CUDA or DirectML), otherwise the CPU
    (CPU: roughly 20-60 seconds for a 1000 px image)

Needs:  pip install numpy opencv-python pillow onnx onnxruntime        (GPU: onnxruntime-directml or onnxruntime-gpu)
The 5 MB model is downloaded once from the official Real-ESRGAN release to  ~/.cache/realesrgan/
"""
import argparse, collections, glob, os, pickle, sys, time, urllib.request, zipfile
import numpy as np
import cv2
from PIL import Image

URL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth'
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'realesrgan')
PTH = os.path.join(CACHE, 'realesr-general-x4v3.pth')


# ------------------------------------------------------------ weights (read the .pth without PyTorch)
def load_weights(path):
    z = zipfile.ZipFile(path)
    pk = [n for n in z.namelist() if n.endswith('data.pkl')][0]
    root = pk[:-len('data.pkl')]
    kinds = {'FloatStorage': np.float32, 'HalfStorage': np.float16, 'DoubleStorage': np.float64}

    class Kind:
        def __init__(self, dt): self.dt = dt

    def rebuild(st, off, size, stride, *rest):
        n = 1 + sum((s - 1) * t for s, t in zip(size, stride)) if len(size) else 1
        flat = st[off:off + n]
        return np.lib.stride_tricks.as_strided(flat, shape=tuple(size), strides=tuple(t * flat.itemsize for t in stride)).astype(np.float32)

    class U(pickle.Unpickler):
        def find_class(self, mod, name):
            if name == '_rebuild_tensor_v2': return rebuild
            if name in kinds: return Kind(kinds[name])
            if (mod, name) == ('collections', 'OrderedDict'): return collections.OrderedDict
            return super().find_class(mod, name)

        def persistent_load(self, pid):
            return np.frombuffer(z.read(root + 'data/' + pid[2]), dtype=pid[1].dt)

    sd = U(z.open(pk)).load()
    return sd.get('params', sd)


def build_onnx(sd):
    import onnx
    from onnx import helper, numpy_helper, TensorProto
    nodes, inits = [], []
    cur = 'x'
    nconv = len([k for k in sd if k.endswith('.weight') and sd[k].ndim == 4])
    for i in range(nconv):
        w, b = 'body.%d.weight' % (2 * i), 'body.%d.bias' % (2 * i)
        inits += [numpy_helper.from_array(sd[w], w), numpy_helper.from_array(sd[b], b)]
        out = 'c%d' % i
        nodes.append(helper.make_node('Conv', [cur, w, b], [out], kernel_shape=[3, 3], pads=[1, 1, 1, 1]))
        cur = out
        if i < nconv - 1:
            s = 'body.%d.weight' % (2 * i + 1)
            inits.append(numpy_helper.from_array(sd[s].reshape(-1, 1, 1), s))
            nodes.append(helper.make_node('PRelu', [cur, s], ['p%d' % i]))
            cur = 'p%d' % i
    nodes.append(helper.make_node('DepthToSpace', [cur], ['shuf'], blocksize=4, mode='CRD'))
    inits.append(numpy_helper.from_array(np.array([1, 1, 4, 4], np.float32), 'scales'))
    inits.append(numpy_helper.from_array(np.array([], np.float32), 'roi'))
    nodes.append(helper.make_node('Resize', ['x', 'roi', 'scales'], ['base'], mode='nearest', coordinate_transformation_mode='asymmetric', nearest_mode='floor'))
    nodes.append(helper.make_node('Add', ['shuf', 'base'], ['y']))
    g = helper.make_graph(nodes, 'srvgg', [helper.make_tensor_value_info('x', TensorProto.FLOAT, ['n', 3, 'h', 'w'])],
                          [helper.make_tensor_value_info('y', TensorProto.FLOAT, ['n', 3, 'H', 'W'])], inits)
    m = helper.make_model(g, opset_imports=[helper.make_opsetid('', 13)])
    m.ir_version = 8
    return m.SerializeToString()


_sess = None


def session():
    global _sess
    if _sess is not None:
        return _sess
    import onnxruntime as ort
    if not os.path.exists(PTH):
        os.makedirs(CACHE, exist_ok=True)
        print('downloading the Real-ESRGAN model (5 MB) ...')
        urllib.request.urlretrieve(URL, PTH)
    prov = [p for p in ('CUDAExecutionProvider', 'DmlExecutionProvider', 'CPUExecutionProvider') if p in ort.get_available_providers()]
    print('upscaler running on:', prov[0].replace('ExecutionProvider', ''))
    _sess = ort.InferenceSession(build_onnx(load_weights(PTH)), providers=prov)
    return _sess


# ------------------------------------------------------------ upscaling
def sr4(rgb, tile=360, pad=16):
    """rgb uint8 HxWx3  ->  uint8 (4H)x(4W)x3"""
    s = session()
    H, W = rgb.shape[:2]
    x = np.pad(rgb, ((pad, pad), (pad, pad), (0, 0)), mode='reflect').astype(np.float32) / 255.0
    out = np.zeros((H * 4, W * 4, 3), np.float32)
    for y in range(0, H, tile):
        for xx in range(0, W, tile):
            y1, x1 = min(H, y + tile), min(W, xx + tile)
            t = x[y:y1 + 2 * pad, xx:x1 + 2 * pad]
            r = s.run(None, {'x': np.ascontiguousarray(t.transpose(2, 0, 1)[None])})[0][0].transpose(1, 2, 0)
            out[y * 4:y1 * 4, xx * 4:x1 * 4] = r[pad * 4:pad * 4 + (y1 - y) * 4, pad * 4:pad * 4 + (x1 - xx) * 4]
    return (np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)


def bleed(rgb, alpha):
    """fill transparent pixels with the colours next to them, so the model never sees a hard coloured edge"""
    a = (alpha.astype(np.float32) / 255.0)[..., None]
    f = rgb.astype(np.float32) * a
    k = max(9, (min(rgb.shape[:2]) // 40) | 1)
    num = cv2.GaussianBlur(f, (k, k), 0)
    den = cv2.GaussianBlur(a, (k, k), 0)[..., None] + 1e-4
    fill = num / den
    return np.clip(np.where(a > .98, rgb, a * rgb + (1 - a) * fill), 0, 255).astype(np.uint8)


def upscale(arr, height=None, scale=None, force=False):
    """arr: uint8 HxWx3 or HxWx4. returns an array of the same kind."""
    h, w = arr.shape[:2]
    th = round(h * scale) if scale else height
    if not force and th <= h * 1.05:
        return arr
    rgb = arr[..., :3]
    alpha = arr[..., 3] if arr.shape[2] == 4 else None
    if alpha is not None:
        rgb = bleed(rgb, alpha)
    big = sr4(rgb)
    tw = round(w * th / h)
    big = cv2.resize(big, (tw, th), interpolation=cv2.INTER_AREA if th < big.shape[0] else cv2.INTER_CUBIC)
    if alpha is None:
        return big
    a = cv2.resize(alpha, (tw, th), interpolation=cv2.INTER_CUBIC)
    return np.dstack([big, a])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', help='an image, or a folder of images')
    ap.add_argument('dst', help='output file, or output folder')
    g = ap.add_mutually_exclusive_group()
    g.add_argument('--height', type=int, default=2160, help='target height in px (default 2160 = 4K tall)')
    g.add_argument('--scale', type=float, help='scale factor instead of a target height')
    ap.add_argument('--force', action='store_true', help='run even when the image is already tall enough')
    a = ap.parse_args()
    if os.path.isdir(a.src):
        files = sorted(f for e in ('png', 'jpg', 'jpeg', 'webp') for f in glob.glob(os.path.join(a.src, '*.' + e)))
        os.makedirs(a.dst, exist_ok=True)
        pairs = [(f, os.path.join(a.dst, os.path.splitext(os.path.basename(f))[0] + '.png')) for f in files]
    else:
        pairs = [(a.src, a.dst)]
    if not pairs:
        sys.exit('no images found in ' + a.src)
    for i, (f, o) in enumerate(pairs, 1):
        t = time.time()
        im = Image.open(f)
        arr = np.array(im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') and 'transparency' in im.info or im.mode == 'RGBA' else 'RGB'))
        out = upscale(arr, height=None if a.scale else a.height, scale=a.scale, force=a.force)
        Image.fromarray(out).save(o)
        print('[%d/%d] %s  %dx%d -> %dx%d  (%.0fs)' % (i, len(pairs), os.path.basename(f), arr.shape[1], arr.shape[0], out.shape[1], out.shape[0], time.time() - t))


if __name__ == '__main__':
    main()
