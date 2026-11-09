Drop your generated images here (PNG, full size), named  <scene>_<number>.png

  hello_01.png ... hello_05.png     opening studio poses
  storm_01.png ... storm_03.png     Meghalaya backdrops (no person)
  anchor_01.png ... anchor_04.png   "the sky opens" poses
  office_01.png ... office_04.png   boarding-pass stops
  desk_01.png ... desk_05.png       the builder
  home_01.png ... home_04.png       finale

Then run, from the folder above this one:

  python tools/make_shots.py --in inbox --all

(or send the files to Claude in the chat and it does this for you.)
This folder is ignored by git, so your big originals are never uploaded.
