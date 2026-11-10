# Prasant Kumar Thapa - the storytelling site, v2

Open `index.html`. No build step; it works from a double-click and on GitHub Pages.

## What is new in v2
- **No more narration.** The voiceover is gone. The page speaks through sound effects and chapter ambience only. **Play my story** is now a timed auto-scroll tour with those sounds.
- **Stills instead of video.** The cut-out scenes (Hello, The sky opens, Nine-plus years, The builder, Contact) are driven by a stack of still images of you. Scrolling cuts between poses with a different transition each time (iris, bar wipe, stamp, slide, drop), a colour burst in the chapter's accent colours, a slow camera push and a gentle idle float. Each cut has its own sound effect.
- **Gaming section re-laid out.** The type now lives in the right-hand column, so he is never covered.
- **Right now the poses are stand-ins** taken from the old video frames. Replace them with your 4K Gemini images (below) and the whole site upgrades.

## Add your 4K images (one image, several angles)
1. Open `tools/PROMPTS-4K-multi-angle.txt`. Every prompt is complete, so you can paste it as it is. None of them describe the character: you upload your own AI character and the prompts only ask for angles, poses and the green background. (The older `prompt-pack.html` is superseded by this file.)
2. In Gemini: attach your character image, paste STEP 0, then paste one **SHEET PROMPT** per scene. Each returns **one image with four camera angles** of the same character, like a 3D turntable. Save it as `hello_sheet.png`, `anchor_sheet.png`, `office_sheet.png`, `desk_sheet.png`, `home_sheet.png`. Backgrounds with no character: `storm_01..03.png`. Optional: `cockpit_01..03.png`.
3. Put them in `inbox/` and run:
   ```
   python tools/make_shots.py --in inbox --all --upscale
   ```
   (or attach them in the Claude chat and Claude runs it.) It splits every sheet into poses, removes the green (or runs an AI person matte), lines the poses up on one baseline, upscales to 4K when the source is smaller, writes a 4K and a phone-size copy of each, and updates the page's manifest. Nothing else to edit. Reload the page.

Options: `--scene hello` (one scene), `--grid 3x2` (a sheet with another layout), `--sticker 14` (white paper-cut outline), `--remove hello` (put a scene back to its old video frames). One image per pose also works: name them `hello_01.png`, `hello_02.png` ...
`python tools/upscale.py in.png out.png --height 2160` upscales any single image or a whole folder (Real-ESRGAN, runs on the CPU or a GPU). Needs `pip install numpy opencv-python pillow onnx onnxruntime`.

**What is in this version (your own renders).** 28 poses plus 3 storm backdrops, cut out, upscaled and wired in: hello 8, anchor 4, office 4, desk 8, home 4, storm 3. Only the numbered files were used; the `*_sheet*` files repeat the same poses smaller, so they were left out. Poses of one scene may have different sizes: the tool matches them to the largest one (the 1024 px renders were AI-upscaled to 2048 px *before* the green was removed, which keeps hair edges clean). In `hello` the order was changed to 01-05, then 08, 06, 07, so the opening ends on the turn-and-wave that leads into the storm: to get the same order from the original files, rename 08 to 06, 06 to 07 and 07 to 08 before running the tool.

| File name | Scene | Kind |
|---|---|---|
| `hello_sheet` / `hello_NN` | Opening studio | cut-out poses |
| `storm_NN` | Meghalaya rain and thunder | full-frame backdrops, no person |
| `anchor_sheet` / `anchor_NN` | The sky opens | cut-out poses |
| `office_sheet` / `office_NN` | Nine-plus years (boarding passes) | cut-out poses |
| `desk_sheet` / `desk_NN` | The builder | cut-out poses |
| `home_sheet` / `home_NN` | Contact | cut-out poses |
| `cockpit_NN` | Gaming section (optional, it keeps its video until you send these) | full-frame backdrops |

## Phones and tablets
Touch devices get a lighter build of the same site automatically ("lite" mode): no full-screen grain or blend layers, a lighter 3D showcase (no anti-aliasing, 30 frames a second, islands built only when you reach them), every second video frame, a smaller rain canvas, and heights that follow the real visible screen so nothing hides under the browser toolbar. The 3D bundle is only fetched when you scroll near it. Add `?lite=1` or `?lite=0` to the address to force it on or off.

## Everything from v1 still works
Chapters, the 3D showcase of 23 sites, the My Workspace ledger, both companies, the cats, the people. See `js/data.js` for every name, line, date and link. `PKT.me.catCount` is 17 (your message); your bio sheet says 14.

## Upload to GitHub (now, and every time you change something)
Double-click `push-to-github.bat`. It uploads in batches of 100 files (or 40 MB), one commit and push per batch, only what is new, changed or deleted. Safe to run again if interrupted. Never force-pushes. If GitHub says it has changes this folder does not have, the script handles it: this folder is the master copy, GitHub's history is kept, files that exist only on GitHub are copied down, and your upload goes on top. Your earlier local commits are kept on a local branch called `backup-before-sync-...`. Edit the site here, not on github.com (an edit made there is replaced by this folder's version on the next upload; it stays in GitHub's history). Options: `.\push-to-github.ps1 -Message "New chapter"`, `-BatchSize 50`, `-DryRun`. Git Bash: `./push-to-github.sh`.
Then repo, Settings, Pages, Deploy from a branch, `main`, `/ (root)`.

## Folder map
```
index.html
css/        base, chapters, showcase, fonts
js/         data, seqmeta, type, seq, shots-data (written by the tool), shots, fx, audio, showcase-ui, main  (showcase3d.js loads on demand)
assets/seq/    old video frames (storm and cockpit still use them; the rest are fallbacks)
assets/shots/  your stills, written by tools/make_shots.py
inbox/         drop your generated PNGs here
tools/         make_shots.py, upscale.py, PROMPTS-4K-multi-angle.txt
```
