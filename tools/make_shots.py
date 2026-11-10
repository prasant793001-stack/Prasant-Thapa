#!/usr/bin/env python3
"""
make_shots.py - turn your generated images into site-ready "shots".

  python tools/make_shots.py --in inbox --all
  python tools/make_shots.py --in inbox --scene hello
  python tools/make_shots.py --in inbox --scene hello --sticker 14     (white paper-cut outline)
  python tools/make_shots.py --in inbox --scene storm --kind plate      (full-frame background stills)

ONE IMAGE, SEVERAL ANGLES (a "sheet")
  python tools/make_shots.py --in inbox --all                 (sheets are picked up automatically)
  Name the file  <scene>_sheet.png  (or _sheetA, _sheetB ...). It holds a grid of the same character from different
  angles on one flat green background (default 2 columns x 2 rows; use --grid 3x2 for another layout).
  The tool cuts every view out, lines them up on one baseline and treats each as a pose.
  Add --upscale to enlarge the poses to 4K with the AI upscaler (tools/upscale.py) when the sheet is not big enough.
  Poses of one scene may differ in size: smaller ones are matched to the largest (AI-upscaled before keying when --upscale is on).

Name your files  <scene>_<anything>.png   e.g.  hello_01.png, hello_02.png, desk_typing.png ...
Scenes: hello, anchor, office, desk, home (cut-out poses of you)   storm, cockpit (full-frame plates)

What it does for each scene
  1. Removes the background of every pose
       - green-screen backgrounds are keyed + de-spilled (best quality)
       - anything else goes through an AI person matte (needs onnxruntime + the u2net_human_seg model)
       - images that already have transparency are used as they are
  2. Crops all poses of a scene to ONE shared box (so framing never jumps between poses)
  3. Writes  assets/shots/<scene>/hi/NN.webp  (up to 2160 px tall, for big screens)
              assets/shots/<scene>/lo/NN.webp  (1280 px tall, for phones / small laptops)
  4. Updates assets/shots/manifest.json and js/shots-data.js, which the page reads. Nothing else to edit.

Needs: pip install numpy opencv-python pillow     (optional, for non-green backgrounds: onnxruntime pymatting)
"""
import argparse, glob, json, os, re, sys
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'assets', 'shots')
CUTOUT_SCENES = ['hello', 'anchor', 'office', 'desk', 'home']
PLATE_SCENES = ['storm', 'cockpit']
HI_H, LO_H = 2160, 1280


# ---------------------------------------------------------------- io
def load_rgba(path):
    return np.array(Image.open(path).convert('RGBA'))


def has_alpha(a):
    return (a[..., 3] < 10).mean() > 0.02


def is_green_bg(a):
    h, w = a.shape[:2]
    r = max(6, min(h, w) // 100)
    ring = np.concatenate([a[:r, :, :3].reshape(-1, 3), a[-r:, :, :3].reshape(-1, 3),
                           a[:, :r, :3].reshape(-1, 3), a[:, -r:, :3].reshape(-1, 3)])
    R, G, B = np.median(ring[:, 0]), np.median(ring[:, 1]), np.median(ring[:, 2])
    return G > R + 40 and G > B + 40


# ---------------------------------------------------------------- background removal
def clean_alpha(alpha, min_frac=0.01):
    """drop stray islands, soften the edge a touch"""
    m = (alpha > 0.5).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        keep = np.zeros(n, bool)
        keep[1:] = areas >= areas.max() * min_frac
        near = cv2.dilate(keep[lab].astype(np.uint8), np.ones((7, 7), np.uint8))
        alpha = alpha * near
    return alpha


def key_green(a):
    rgb = a[..., :3].astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dom = g - np.maximum(r, b)                       # how "green" a pixel is
    alpha = 1.0 - np.clip((dom - 22.0) / 70.0, 0, 1)
    alpha = np.clip((alpha - 0.04) / 0.92, 0, 1)
    spill = np.clip(dom, 0, None)
    g2 = g - spill * 0.9                             # de-spill: pull green back to the neighbours
    rgb[..., 1] = np.clip(g2, 0, 255)
    alpha = clean_alpha(alpha)
    k = max(1, int(round(min(a.shape[:2]) / 1500)))
    alpha = cv2.erode(alpha, np.ones((2 * k - 1 or 1, 2 * k - 1 or 1), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.6 * k)
    return np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])


_sess = None


def _model_path():
    for p in [os.environ.get('U2NET_MODEL', ''), os.path.expanduser('~/.u2net/u2net_human_seg.onnx'),
              '/tmp/models/u2net_human_seg.onnx', os.path.join(os.path.dirname(__file__), 'u2net_human_seg.onnx')]:
        if p and os.path.exists(p):
            return p
    return None


def matte_ai(a):
    global _sess
    import onnxruntime as ort
    mp = _model_path()
    if not mp:
        sys.exit('No person-matting model found. Either generate on a GREEN background, or put u2net_human_seg.onnx\n'
                 'in ~/.u2net/ (rembg downloads it there) or set U2NET_MODEL=path')
    if _sess is None:
        _sess = ort.InferenceSession(mp, providers=['CPUExecutionProvider'])
    bgr = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2BGR)
    h, w = bgr.shape[:2]
    s = 1600.0 / max(h, w)
    work = cv2.resize(bgr, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA) if s < 1 else bgr
    im = cv2.cvtColor(cv2.resize(work, (320, 320), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    im = (im - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    x = im.transpose(2, 0, 1)[None].astype(np.float32)
    out = _sess.run(None, {_sess.get_inputs()[0].name: x})[0][0, 0]
    out = (out - out.min()) / (out.max() - out.min() + 1e-8)
    m = cv2.resize(out, (work.shape[1], work.shape[0]), interpolation=cv2.INTER_CUBIC)
    m = np.clip(m.astype(np.float32), 0, 1)
    try:                                    # proper alpha matting around the mask's edge (sharp hair, no halo)
        from pymatting import estimate_alpha_cf
        k = max(3, int(max(work.shape[:2]) / 160))
        fg = cv2.erode((m > 0.85).astype(np.uint8), np.ones((k, k), np.uint8))
        near = cv2.dilate((m > 0.08).astype(np.uint8), np.ones((2 * k, 2 * k), np.uint8))
        tri = np.full(m.shape, 0.5, np.float64)
        tri[fg > 0] = 1.0
        tri[near == 0] = 0.0
        rgbf = cv2.cvtColor(work, cv2.COLOR_BGR2RGB).astype(np.float64) / 255
        m = np.clip(estimate_alpha_cf(rgbf, tri), 0, 1).astype(np.float32)
    except Exception as e:
        print('  (pymatting unavailable or failed: %s - using the simpler edge filter)' % str(e)[:60])
        try:
            m = cv2.ximgproc.guidedFilter(guide=work, src=m, radius=8, eps=1e-3)
        except Exception:
            m = cv2.GaussianBlur(m, (0, 0), 1.5)
        m = np.clip((m - 0.30) / 0.45, 0, 1)
        m = m * m * (3 - 2 * m)
    m = cv2.resize(m, (w, h), interpolation=cv2.INTER_CUBIC)
    m = clean_alpha(np.clip(m, 0, 1))
    return np.dstack([a[..., :3], (m * 255).astype(np.uint8)])


def cut_out(a, name):
    if has_alpha(a):
        print('  %s: already transparent' % name)
        return a
    if is_green_bg(a):
        print('  %s: green screen keyed' % name)
        return key_green(a)
    print('  %s: AI matte (no green screen detected)' % name)
    return matte_ai(a)


# ---------------------------------------------------------------- geometry / export
def bbox(alpha, thr=12):
    ys, xs = np.where(alpha > thr)
    if len(ys) == 0:
        return 0, 0, alpha.shape[1], alpha.shape[0]
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def sticker(img, px):
    """white paper-cut outline + a soft shadow, baked in"""
    pad = int(px * 2.2)
    img = np.pad(img, ((pad, pad), (pad, pad), (0, 0)))
    a = img[..., 3]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * px + 1, 2 * px + 1))
    outline = cv2.dilate(a, k)
    outline = cv2.GaussianBlur(outline, (0, 0), 1.2)
    out = np.zeros_like(img)
    out[..., :3] = 255
    out[..., 3] = outline
    # composite the person on top
    fa = img[..., 3:4].astype(np.float32) / 255
    out[..., :3] = (img[..., :3] * fa + out[..., :3] * (1 - fa)).astype(np.uint8)
    out[..., 3] = np.maximum(img[..., 3], outline)
    return out


def save_webp(arr, path, q, alpha=True):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = Image.fromarray(arr, 'RGBA' if alpha else 'RGB')
    im.save(path, 'WEBP', quality=q, alpha_quality=96, method=5)


def resize_h(arr, h):
    if arr.shape[0] == h:
        return arr
    s = h / arr.shape[0]
    return cv2.resize(arr, (max(1, round(arr.shape[1] * s)), h), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)


# ---------------------------------------------------------------- scenes
def files_for(inbox, scene):
    out = []
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        out += glob.glob(os.path.join(inbox, '%s_*.%s' % (scene, ext)))
        out += glob.glob(os.path.join(inbox, '%s.%s' % (scene, ext)))
    return sorted(f for f in set(out) if '_sheet' not in os.path.basename(f).lower())


def sheets_for(inbox, scene):
    out = []
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        out += glob.glob(os.path.join(inbox, '%s_sheet*.%s' % (scene, ext)))
    return sorted(set(out))


def split_sheet(path, grid, outdir):
    """one image with a grid of views -> separate transparent PNGs, lined up on a shared baseline"""
    cols, rows = grid
    name = os.path.basename(path)
    cut = cut_out(load_rgba(path), name)
    al = cut[..., 3]
    H, W = al.shape
    k = max(3, int(min(H, W) * 0.012)) | 1
    m = (al > 40).astype(np.uint8)
    n, lab, st, cen = cv2.connectedComponentsWithStats(cv2.dilate(m, np.ones((k, k), np.uint8)), connectivity=8)
    comps = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 0.004 * H * W]
    cells = {}
    for i in comps:
        c = min(cols - 1, int(cen[i][0] / W * cols)); r = min(rows - 1, int(cen[i][1] / H * rows))
        cells.setdefault((r, c), []).append(i)
    exact = len(comps) == cols * rows and len(cells) == cols * rows
    views = []
    for r in range(rows):
        for c in range(cols):
            if exact:
                a2 = np.where(np.isin(lab, cells[(r, c)]), al, 0).astype(np.uint8)
            else:                                           # fall back to plain equal cells
                a2 = np.zeros_like(al)
                y0, y1, x0, x1 = r * H // rows, (r + 1) * H // rows, c * W // cols, (c + 1) * W // cols
                a2[y0:y1, x0:x1] = al[y0:y1, x0:x1]
            ys, xs = np.where(a2 > 12)
            if len(xs) == 0:
                continue
            views.append(((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1), np.dstack([cut[..., :3], a2])))
    if not exact:
        print('  note: found %d separate figures in %s but expected %d (%dx%d). Used equal cells instead; if a view looks cut, ask for more green space between views.' % (len(comps), name, cols * rows, cols, rows))
    if not views:
        sys.exit('no figures found in ' + name)
    bw = max(b[2] - b[0] for b, _ in views); bh = max(b[3] - b[1] for b, _ in views)
    pad = int(bh * 0.02)
    CW, CH = bw + 2 * pad, bh + 2 * pad
    os.makedirs(outdir, exist_ok=True)
    stem = os.path.splitext(name)[0]
    outs = []
    for i, ((x0, y0, x1, y1), rgba) in enumerate(views, 1):
        canvas = np.zeros((CH, CW, 4), np.uint8)
        crop = rgba[y0:y1, x0:x1]
        ox = (CW - (x1 - x0)) // 2; oy = CH - pad - (y1 - y0)       # bottom-aligned, centred
        canvas[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = crop
        fp = os.path.join(outdir, '%s_%02d.png' % (stem, i))
        Image.fromarray(canvas, 'RGBA').save(fp)
        outs.append(fp)
    print('  %s -> %d views (%dx%d each)' % (name, len(outs), CW, CH))
    return outs


def do_cutouts(scene, files, stk, up=False):
    print('[%s] %d pose(s)' % (scene, len(files)))
    imgs = [load_rgba(f) for f in files]
    # poses of one scene must share a size. Match the LARGEST one, never the first: smaller renders are enlarged
    # (AI upscaler when --upscale is on, plain cubic otherwise) so the big ones keep every pixel they have.
    h0, w0 = max((im.shape[:2] for im in imgs), key=lambda s: s[0] * s[1])
    for i, im in enumerate(imgs):
        if im.shape[:2] != (h0, w0):
            small = im.shape[0] < h0 * 0.8 and im.shape[1] <= w0
            how = 'AI upscale' if (up and small) else 'resize'
            print('  note: %s is %dx%d, %s to %dx%d to match the largest pose' % (os.path.basename(files[i]), im.shape[1], im.shape[0], how, w0, h0))
            if up and small and abs(im.shape[1] / im.shape[0] - w0 / h0) < 0.01:
                import upscale as U
                rgb = U.upscale(np.ascontiguousarray(im[..., :3]), height=h0, force=True)
                imgs[i] = np.dstack([rgb, np.full(rgb.shape[:2], 255, np.uint8)]) if im.shape[2] == 4 else rgb
            else:
                imgs[i] = cv2.resize(im, (w0, h0), interpolation=cv2.INTER_AREA if im.shape[0] > h0 else cv2.INTER_CUBIC)
    cut = [cut_out(im, os.path.basename(f)) for im, f in zip(imgs, files)]
    boxes = [bbox(c[..., 3]) for c in cut]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    H = y1 - y0
    m = int(H * 0.02)                                   # small safety margin
    x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(cut[0].shape[1], x1 + m), min(cut[0].shape[0], y1 + m)
    cut = [c[y0:y1, x0:x1] for c in cut]
    if up and cut[0].shape[0] < HI_H * 0.8:          # already near 4K tall -> no AI pass needed
        import upscale as U
        print('  upscaling %d pose(s) %d px -> %d px tall (AI) ...' % (len(cut), cut[0].shape[0], HI_H))
        cut = [U.upscale(c, height=HI_H) for c in cut]
    src_h = cut[0].shape[0]
    has_hi = src_h >= 1500
    d = os.path.join(SHOTS, scene)
    for sub in ('hi', 'lo'):
        for f in glob.glob(os.path.join(d, sub, '*.webp')):
            os.remove(f)
    ar = None
    for i, c in enumerate(cut, 1):
        for sub, th in (('hi', min(HI_H, src_h)), ('lo', min(LO_H, src_h))):
            if sub == 'hi' and not has_hi:
                continue
            img = resize_h(c, th)
            if stk:
                img = sticker(img, max(2, round(stk * th / 2160)))
            ar = ar or img.shape[1] / img.shape[0]
            save_webp(img, os.path.join(d, sub, '%02d.webp' % i), 88 if sub == 'hi' else 82)
    # aspect ratio of what the page will display
    probe = np.array(Image.open(os.path.join(d, 'lo', '01.webp')))
    return {'kind': 'cutout', 'n': len(cut), 'ar': round(probe.shape[1] / probe.shape[0], 4), 'hi': bool(has_hi), 'ext': 'webp'}


def do_plates(scene, files):
    print('[%s] %d plate(s)' % (scene, len(files)))
    d = os.path.join(SHOTS, scene)
    for sub in ('hi', 'lo'):
        for f in glob.glob(os.path.join(d, sub, '*.webp')):
            os.remove(f)
    ar = None
    src_w = 0
    for i, f in enumerate(files, 1):
        a = np.array(Image.open(f).convert('RGB'))
        ar = ar or a.shape[1] / a.shape[0]
        src_w = max(src_w, a.shape[1])
        for sub, tw in (('hi', min(3840, a.shape[1])), ('lo', min(1920, a.shape[1]))):
            if sub == 'hi' and a.shape[1] < 2600:
                continue
            s = tw / a.shape[1]
            r = cv2.resize(a, (tw, round(a.shape[0] * s)), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
            save_webp(r, os.path.join(d, sub, '%02d.webp' % i), 84 if sub == 'hi' else 80, alpha=False)
    return {'kind': 'plate', 'n': len(files), 'ar': round(ar, 4), 'hi': bool(src_w >= 2600), 'ext': 'webp'}


def write_manifest(update):
    mp = os.path.join(SHOTS, 'manifest.json')
    man = json.load(open(mp)) if os.path.exists(mp) else {}
    for k, v in update.items():
        v['base'] = 'assets/shots/' + k
        man[k] = v
    os.makedirs(SHOTS, exist_ok=True)
    json.dump(man, open(mp, 'w'), indent=1)
    js = os.path.join(ROOT, 'js', 'shots-data.js')
    with open(js, 'w') as f:
        f.write('/* written by tools/make_shots.py - do not edit by hand */\nwindow.PKT=window.PKT||{};PKT.shots=%s;\n' % json.dumps(man))
    print('manifest updated: %s' % ', '.join(sorted(man)))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--in', dest='inbox', required=True, help='folder with your generated images')
    ap.add_argument('--scene', help='one scene name')
    ap.add_argument('--all', action='store_true', help='every scene found in the folder')
    ap.add_argument('--kind', choices=['cutout', 'plate'], help='override (storm/cockpit default to plate)')
    ap.add_argument('--sticker', type=int, default=0, help='white outline width in px at 4K scale, e.g. 14')
    ap.add_argument('--grid', default='2x2', help='layout of a multi-angle sheet, columns x rows (default 2x2)')
    ap.add_argument('--upscale', action='store_true', help='AI-upscale cut-out poses to 4K when the source is smaller (needs onnx + onnxruntime)')
    ap.add_argument('--remove', help='take a scene out of the manifest (page falls back to the video frames)')
    a = ap.parse_args()
    if a.remove:
        mp = os.path.join(SHOTS, 'manifest.json')
        man = json.load(open(mp)) if os.path.exists(mp) else {}
        man.pop(a.remove, None)
        os.makedirs(SHOTS, exist_ok=True)
        json.dump(man, open(mp, 'w'), indent=1)
        write_manifest({})
        return
    scenes = CUTOUT_SCENES + PLATE_SCENES if a.all else [a.scene]
    if not a.all and not a.scene:
        ap.error('give --scene NAME or --all')
    try:
        grid = tuple(int(v) for v in a.grid.lower().split('x'))
        assert len(grid) == 2 and min(grid) >= 1
    except Exception:
        ap.error('--grid must look like 2x2 or 3x2')
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    done = {}
    for sc in scenes:
        fs = files_for(a.inbox, sc)
        kind0 = a.kind or ('plate' if sc in PLATE_SCENES else 'cutout')
        if kind0 == 'cutout':
            for sh in sheets_for(a.inbox, sc):
                fs = split_sheet(sh, grid, os.path.join(a.inbox, '_slices')) + fs
        if not fs:
            if not a.all:
                sys.exit('no files named %s_*.png in %s' % (sc, a.inbox))
            continue
        kind = a.kind or ('plate' if sc in PLATE_SCENES else 'cutout')
        done[sc] = do_plates(sc, fs) if kind == 'plate' else do_cutouts(sc, fs, a.sticker, a.upscale)
    if not done:
        sys.exit('nothing to do - no <scene>_*.png files found in %s' % a.inbox)
    write_manifest(done)


if __name__ == '__main__':
    main()
