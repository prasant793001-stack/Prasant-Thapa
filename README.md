# Prasant Kumar Thapa - the storytelling site, v2

Open `index.html`. No build step; it works from a double-click and on GitHub Pages.

## What is new in v2
- **No more narration.** The voiceover is gone. The page speaks through sound effects and chapter ambience only. **Play my story** is now a timed auto-scroll tour with those sounds.
- **Stills instead of video.** The cut-out scenes (Hello, The sky opens, Nine-plus years, The builder, Contact) are driven by a stack of still images of you. Scrolling cuts between poses with a different transition each time (iris, bar wipe, stamp, slide, drop), a colour burst in the chapter's accent colours, a slow camera push and a gentle idle float. Each cut has its own sound effect.
- **Gaming section re-laid out.** The type now lives in the right-hand column, so he is never covered.
- **Right now the poses are stand-ins** taken from the old video frames. Replace them with your 4K Gemini images (below) and the whole site upgrades.

## Add your 4K images
1. Open `tools/prompt-pack.html`. It has every prompt, a copy button for each, and a done checklist. (Same page online: the link Claude shared.)
2. Generate each image in Gemini with your photos as reference, on the **flat green background** the prompts ask for. Save as `<scene>_<number>.png`, for example `hello_01.png`.
3. Put them in `inbox/` and run:
   ```
   python tools/make_shots.py --in inbox --all
   ```
   (or attach them in the Claude chat and Claude runs it.) Needs `pip install numpy opencv-python pillow`.
   The tool removes the green (or, for any other background, runs an AI person matte), crops every pose of a scene to one shared frame, writes a 4K and a phone-size version of each, and updates the page's manifest. Nothing else to edit.
4. Reload the page.

Useful options: `--scene hello` (one scene only), `--sticker 14` (adds a white paper-cut outline), `--remove hello` (put a scene back to its old video frames).
Any number of poses per scene works, from one up. Scenes you do not replace keep what they have.

| File name | Scene | Kind |
|---|---|---|
| `hello_NN` | Opening studio | cut-out poses |
| `storm_NN` | Meghalaya rain and thunder | full-frame backdrops, no person |
| `anchor_NN` | The sky opens | cut-out poses |
| `office_NN` | Nine-plus years (boarding passes) | cut-out poses |
| `desk_NN` | The builder | cut-out poses |
| `home_NN` | Contact | cut-out poses |
| `cockpit_NN` | Gaming section (optional, it keeps its video until you send these) | full-frame backdrops |

## Everything from v1 still works
Chapters, the 3D showcase of 23 sites, the My Workspace ledger, both companies, the cats, the people. See `js/data.js` for every name, line, date and link. `PKT.me.catCount` is 17 (your message); your bio sheet says 14.

## Upload to GitHub (now, and every time you change something)
Double-click `push-to-github.bat`. It uploads in batches of 100 files (or 40 MB), one commit and push per batch, only what is new, changed or deleted. Safe to run again if interrupted. Never force-pushes. If GitHub says it has changes this folder does not have, the script handles it: this folder is the master copy, GitHub's history is kept, files that exist only on GitHub are copied down, and your upload goes on top. Your earlier local commits are kept on a local branch called `backup-before-sync-...`. Edit the site here, not on github.com (an edit made there is replaced by this folder's version on the next upload; it stays in GitHub's history). Options: `.\push-to-github.ps1 -Message "New chapter"`, `-BatchSize 50`, `-DryRun`. Git Bash: `./push-to-github.sh`.
Then repo, Settings, Pages, Deploy from a branch, `main`, `/ (root)`.

## Folder map
```
index.html
css/        base, chapters, showcase, fonts
js/         data, seqmeta, type, seq, shots-data (written by the tool), shots, fx, audio, showcase3d, showcase-ui, main
assets/seq/    old video frames (storm and cockpit still use them; the rest are fallbacks)
assets/shots/  your stills, written by tools/make_shots.py
inbox/         drop your generated PNGs here
tools/         make_shots.py, prompt-pack.html
```
