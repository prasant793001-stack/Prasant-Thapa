#!/usr/bin/env bash
# ------------------------------------------------------------------
# Push this folder to GitHub in small batches. Safe to run again and
# again: it only uploads what is new / changed / deleted since last time.
#
#   ./push-to-github.sh                       first upload or any later update
#   ./push-to-github.sh -m "New chapter"      with your own commit message
#   ./push-to-github.sh --batch-size 50       smaller batches (slow connection)
#   ./push-to-github.sh --dry-run             show the batches, change nothing
#
# Never force-pushes. If it is interrupted, just run it again: finished
# batches stay committed and are pushed first.
# ------------------------------------------------------------------
set -u
cd "$(dirname "$0")" || exit 1

REPO_URL="https://github.com/prasant793001-stack/Prasant-Thapa.git"; REPO_GIVEN=0
BRANCH="main"; BATCH=100; MAXMB=40; MSG="Update site"; DRY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)        REPO_URL="$2"; REPO_GIVEN=1; shift 2;;
    --branch)      BRANCH="$2"; shift 2;;
    --batch-size)  BATCH="$2"; shift 2;;
    --max-mb)      MAXMB="$2"; shift 2;;
    -m|--message)  MSG="$2"; shift 2;;
    --dry-run)     DRY=1; shift;;
    -h|--help)     sed -n '2,13p' "$0"; exit 0;;
    *) echo "Unknown option: $1 (try --help)"; exit 1;;
  esac
done

die() { echo; echo "STOPPED: $*"; exit 1; }
git --version >/dev/null 2>&1 || die "git is not installed. Get it from https://git-scm.com"

# ---- one-time setup ------------------------------------------------
if [ ! -d .git ]; then
  git init -q || die "git init failed"
fi
git config core.autocrlf false
if ! git rev-parse --verify -q HEAD >/dev/null; then git symbolic-ref HEAD "refs/heads/$BRANCH"; fi
# an older repo in this folder may be on "master": GitHub's branch is "main", so rename it
CUR=$(git symbolic-ref --short -q HEAD || true)
if [ -n "$CUR" ] && [ "$CUR" != "$BRANCH" ] && git rev-parse --verify -q HEAD >/dev/null; then
  git branch -M "$BRANCH" && echo "Renamed this folder's branch '$CUR' to '$BRANCH' to match GitHub."
fi

if ! git remote | grep -qx origin; then
  git remote add origin "$REPO_URL"
elif [ "$REPO_GIVEN" = 1 ] && [ "$(git remote get-url origin)" != "$REPO_URL" ]; then
  git remote set-url origin "$REPO_URL"
fi

if [ -z "$(git config user.email)" ]; then
  read -r -p "Your name for commits: " N;  git config user.name "$N"
  read -r -p "Your email for commits (GitHub email or noreply address): " E; git config user.email "$E"
fi

# ---- sync with what is already on GitHub -----------------------------
echo "Checking GitHub ..."
git fetch -q origin || die "Could not reach $(git remote get-url origin). Check the address, your internet, and that you are signed in to GitHub."
REMOTE_HAS=0; git rev-parse --verify -q "refs/remotes/origin/$BRANCH" >/dev/null && REMOTE_HAS=1
LOCAL_HAS=0;  git rev-parse --verify -q HEAD >/dev/null && LOCAL_HAS=1

# copy files that exist only on GitHub (LICENSE, a README made there ...) down into this folder.
# $1 (optional) = a ref holding this folder's earlier commit: files you deleted from here on purpose
# stay deleted, so the next upload removes them from GitHub too.
copy_down() {
  local keep="${1:-}" tmp f; tmp=$(mktemp)
  git ls-files -z -d | while IFS= read -r -d '' f; do
    if [ -n "$keep" ] && git cat-file -e "$keep:$f" 2>/dev/null; then continue; fi
    printf '%s\0' "$f"
  done > "$tmp"
  if [ -s "$tmp" ]; then
    echo "GitHub has files that are not in this folder - copying them down so nothing is lost."
    xargs -0 git checkout -- < "$tmp" || { rm -f "$tmp"; die "could not restore the existing GitHub files"; }
  fi
  rm -f "$tmp"
}

if [ $REMOTE_HAS = 1 ] && [ $LOCAL_HAS = 0 ]; then
  # repo already has files (README etc.): build on top of them, keep our files as the new/changed ones
  git reset -q "origin/$BRANCH" || die "could not attach to origin/$BRANCH"
  LOCAL_HAS=1
  copy_down
elif [ $REMOTE_HAS = 1 ] && ! git merge-base --is-ancestor "origin/$BRANCH" HEAD; then
  # GitHub has commits this folder lacks (an older repo made by hand in this folder, a README edited on
  # github.com ...). This folder is the master copy, so: keep GitHub's history, keep every file here
  # exactly as it is, copy down the files only GitHub has, and push the rest on top. No force-push,
  # no history is lost, and the earlier local commits stay on a backup branch.
  BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH")
  echo "GitHub has $BEHIND commit(s) this folder does not have. Syncing: this folder's files win,"
  echo "files only on GitHub are copied down, nothing is force-pushed."
  BK="backup-before-sync-$(date +%Y%m%d-%H%M%S)"
  git branch "$BK" HEAD && echo "  (your earlier local commits are kept on the local branch $BK)"
  git reset -q "origin/$BRANCH" || die "could not attach to origin/$BRANCH"
  copy_down "$BK"
fi

push_now() {
  local t
  for t in 1 2 3; do
    git push -q -u origin "$BRANCH" && return 0
    echo "  push failed (try $t of 3) - waiting 5 s ..."; sleep 5
  done
  return 1
}

# commits from an interrupted run go first
if [ $LOCAL_HAS = 1 ]; then
  AHEAD=1
  [ $REMOTE_HAS = 1 ] && AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD")
  if [ "$AHEAD" != 0 ] && [ $DRY = 0 ]; then
    echo "Pushing earlier commits that were not uploaded yet ..."
    push_now || die "push failed. Check your connection and sign-in, then run this again."
  fi
fi

# ---- work out the batches --------------------------------------------
LIST=$(git -c core.quotepath=false ls-files -m -o --exclude-standard | sort -u)
if [ -z "$LIST" ]; then echo "Nothing new to upload. GitHub is up to date."; exit 0; fi

FILES=(); NOS=(); n=1; cnt=0; bytes=0; limit=$((MAXMB*1024*1024)); skipped=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  size=0; [ -f "$f" ] && size=$(wc -c < "$f" | tr -d ' ')
  if [ "$size" -gt $((95*1024*1024)) ]; then echo "SKIPPED (over GitHub's 100 MB limit): $f"; skipped=$((skipped+1)); continue; fi
  if [ $cnt -gt 0 ] && { [ $cnt -ge "$BATCH" ] || [ $((bytes+size)) -gt $limit ]; }; then n=$((n+1)); cnt=0; bytes=0; fi
  FILES+=("$f"); NOS+=("$n"); cnt=$((cnt+1)); bytes=$((bytes+size))
done <<< "$LIST"
TOTAL_BATCHES=$n
[ ${#FILES[@]} -eq 0 ] && { echo "Nothing uploadable."; exit 0; }
echo "${#FILES[@]} file(s) in $TOTAL_BATCHES batch(es) of up to $BATCH files / $MAXMB MB."

# ---- commit + push, one batch at a time -----------------------------------
for ((b=1; b<=TOTAL_BATCHES; b++)); do
  paths=(); for i in "${!FILES[@]}"; do [ "${NOS[$i]}" = "$b" ] && paths+=("${FILES[$i]}"); done
  echo "Batch $b/$TOTAL_BATCHES: ${#paths[@]} file(s)"
  if [ $DRY = 1 ]; then printf '   %s\n' "${paths[@]:0:3}"; [ ${#paths[@]} -gt 3 ] && echo "   ..."; continue; fi
  git add -A -- "${paths[@]}" || die "git add failed"
  git commit -q -m "$MSG (batch $b/$TOTAL_BATCHES)" || die "git commit failed"
  push_now || die "push failed after batch $((b-1)). Everything before it is safe. Run this script again to continue."
done

[ $DRY = 1 ] && { echo "Dry run only - nothing was changed."; exit 0; }
SLUG=$(git remote get-url origin | sed -E 's#^.*github\.com[:/]([^/]+)/([^/.]+)(\.git)?$#\1.github.io/\2#')
echo; echo "DONE - uploaded ${#FILES[@]} file(s)."
[ $skipped -gt 0 ] && echo "($skipped file(s) were skipped for size - see above.)"
echo "Once GitHub Pages is on (Settings > Pages > Deploy from branch > $BRANCH, / root):"
echo "  https://$SLUG/"
