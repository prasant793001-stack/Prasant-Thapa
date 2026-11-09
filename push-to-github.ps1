<#
  Push this folder to GitHub in small batches.
  Safe to run again and again: it only uploads what is new / changed / deleted since last time.

  Easiest: double-click  push-to-github.bat

  Or from PowerShell, inside this folder:
    .\push-to-github.ps1                              first upload, or any later update
    .\push-to-github.ps1 -Message "New chapter"       your own commit message
    .\push-to-github.ps1 -BatchSize 50                smaller batches (slow connection)
    .\push-to-github.ps1 -MaxBatchMB 20               cap each batch by size as well
    .\push-to-github.ps1 -DryRun                      show the batches, commit and upload nothing

  Needs Git for Windows (https://git-scm.com). The first push opens a GitHub sign-in window.
  Never force-pushes. If it is interrupted, just run it again: finished batches stay committed
  and are pushed first.
#>
[CmdletBinding()]
param(
    [string]$RepoUrl = 'https://github.com/prasant793001-stack/Prasant-Thapa.git',
    [string]$Branch = 'main',
    [int]$BatchSize = 100,
    [int]$MaxBatchMB = 40,
    [string]$Message = 'Update site',
    [switch]$DryRun
)

$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath $PSScriptRoot
$script:rc = 0

function Die([string]$m) {
    Write-Host ''
    Write-Host "STOPPED: $m" -ForegroundColor Red
    exit 1
}
function Run([string[]]$GitArgs) {
    & git @GitArgs | Out-Host
    $script:rc = $LASTEXITCODE
}
function Capture([string[]]$GitArgs) {
    $out = @(& git @GitArgs 2>$null)
    $script:rc = $LASTEXITCODE
    $out
}
function PushNow {
    for ($t = 1; $t -le 3; $t++) {
        Run @('push', '-q', '-u', 'origin', $Branch)
        if ($script:rc -eq 0) { return $true }
        Write-Host "  push failed (try $t of 3) - waiting 5 s ..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    return $false
}
# Copy files that exist only on GitHub (LICENSE, a README made there ...) down into this folder.
# $Keep (optional) = a ref holding this folder's earlier commit: files you deleted from here on
# purpose stay deleted, so the next upload removes them from GitHub too.
function CopyDown([string]$Keep) {
    $gone = @(Capture @('-c', 'core.quotepath=false', 'ls-files', '-d') | Where-Object { $_ })
    if ($Keep) {
        $gone = @($gone | Where-Object { Capture @('cat-file', '-e', "${Keep}:$_") | Out-Null; $script:rc -ne 0 })
    }
    if ($gone.Count -gt 0) {
        Write-Host 'GitHub has files that are not in this folder - copying them down so nothing is lost.'
        for ($i = 0; $i -lt $gone.Count; $i += 100) {
            $last = [Math]::Min($i + 99, $gone.Count - 1)
            Run (@('checkout', '--') + $gone[$i..$last])
            if ($script:rc -ne 0) { Die 'could not restore the existing GitHub files' }
        }
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Die 'git is not installed. Get Git for Windows from https://git-scm.com and run this again.' }

# ---- one-time setup ------------------------------------------------
if (-not (Test-Path -LiteralPath '.git')) {
    Run @('init', '-q')
    if ($script:rc -ne 0) { Die 'git init failed' }
}
Run @('config', 'core.autocrlf', 'false')
Capture @('rev-parse', '--verify', '-q', 'HEAD') | Out-Null
if ($script:rc -ne 0) { Run @('symbolic-ref', 'HEAD', "refs/heads/$Branch") }
# an older repo in this folder may be on 'master': GitHub's branch is 'main', so rename it
$curBranch = @(Capture @('symbolic-ref', '--short', '-q', 'HEAD'))
$curBranchOk = ($script:rc -eq 0)
Capture @('rev-parse', '--verify', '-q', 'HEAD') | Out-Null
if ($curBranchOk -and $script:rc -eq 0 -and $curBranch.Count -gt 0 -and $curBranch[0] -ne $Branch) {
    Run @('branch', '-M', $Branch)
    if ($script:rc -eq 0) { Write-Host "Renamed this folder's branch '$($curBranch[0])' to '$Branch' to match GitHub." }
}

$remotes = @(Capture @('remote'))
if ($remotes -notcontains 'origin') {
    Run @('remote', 'add', 'origin', $RepoUrl)
}
elseif ($PSBoundParameters.ContainsKey('RepoUrl')) {
    Run @('remote', 'set-url', 'origin', $RepoUrl)
}

$email = @(Capture @('config', 'user.email'))
if ($email.Count -eq 0 -or -not $email[0]) {
    $n = Read-Host 'Your name for commits'
    $e = Read-Host 'Your email for commits (GitHub email or noreply address)'
    Run @('config', 'user.name', $n)
    Run @('config', 'user.email', $e)
}

# ---- sync with what is already on GitHub -----------------------------
Write-Host 'Checking GitHub ...'
Run @('fetch', '-q', 'origin')
if ($script:rc -ne 0) { Die 'Could not reach GitHub. Check the repo address, your internet, and that you are signed in.' }

Capture @('rev-parse', '--verify', '-q', "refs/remotes/origin/${Branch}") | Out-Null
$remoteHas = ($script:rc -eq 0)
Capture @('rev-parse', '--verify', '-q', 'HEAD') | Out-Null
$localHas = ($script:rc -eq 0)

if ($remoteHas -and -not $localHas) {
    # the repo already has files (README etc.): build on top of them
    Run @('reset', '-q', "origin/${Branch}")
    if ($script:rc -ne 0) { Die "could not attach to origin/${Branch}" }
    $localHas = $true
    CopyDown ''
}
elseif ($remoteHas) {
    Capture @('merge-base', '--is-ancestor', "origin/${Branch}", 'HEAD') | Out-Null
    if ($script:rc -ne 0) {
        # GitHub has commits this folder lacks (an older repo made by hand in this folder, a README
        # edited on github.com ...). This folder is the master copy, so: keep GitHub's history, keep
        # every file here exactly as it is, copy down the files only GitHub has, and push the rest on
        # top. No force-push, no history is lost, and earlier local commits stay on a backup branch.
        $behind = (@(Capture @('rev-list', '--count', "HEAD..origin/${Branch}")))[0]
        Write-Host "GitHub has $behind commit(s) this folder does not have. Syncing: this folder's files win,"
        Write-Host 'files only on GitHub are copied down, nothing is force-pushed.'
        $backupRef = 'backup-before-sync-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Run @('branch', $backupRef, 'HEAD')
        if ($script:rc -eq 0) { Write-Host "  (your earlier local commits are kept on the local branch $backupRef)" }
        Run @('reset', '-q', "origin/${Branch}")
        if ($script:rc -ne 0) { Die "could not attach to origin/${Branch}" }
        CopyDown $backupRef
    }
}

# commits from an interrupted run go first
if ($localHas -and -not $DryRun) {
    $ahead = 1
    if ($remoteHas) { $ahead = [int](@(Capture @('rev-list', '--count', "origin/${Branch}..HEAD"))[0]) }
    if ($ahead -gt 0) {
        Write-Host 'Pushing earlier commits that were not uploaded yet ...'
        if (-not (PushNow)) { Die 'push failed. Check your connection and sign-in, then run this again.' }
    }
}

# ---- work out the batches --------------------------------------------
$list = @(Capture @('-c', 'core.quotepath=false', 'ls-files', '-m', '-o', '--exclude-standard') | Where-Object { $_ } | Sort-Object -Unique)
if ($list.Count -eq 0) { Write-Host 'Nothing new to upload. GitHub is up to date.'; exit 0 }

$batches = New-Object System.Collections.ArrayList
$cur = New-Object System.Collections.ArrayList
$curBytes = 0
$limit = [int64]$MaxBatchMB * 1MB
$skipped = 0
$total = 0
foreach ($f in $list) {
    $len = 0
    $item = Get-Item -LiteralPath $f -ErrorAction SilentlyContinue
    if ($item -and -not $item.PSIsContainer) { $len = $item.Length }
    if ($len -gt 95MB) {
        Write-Host "SKIPPED (over GitHub's 100 MB limit): $f" -ForegroundColor Yellow
        $skipped++
        continue
    }
    if ($cur.Count -gt 0 -and ($cur.Count -ge $BatchSize -or ($curBytes + $len) -gt $limit)) {
        [void]$batches.Add($cur.ToArray())
        $cur = New-Object System.Collections.ArrayList
        $curBytes = 0
    }
    [void]$cur.Add($f)
    $curBytes += $len
    $total++
}
if ($cur.Count -gt 0) { [void]$batches.Add($cur.ToArray()) }
if ($batches.Count -eq 0) { Write-Host 'Nothing uploadable.'; exit 0 }
Write-Host "$total file(s) in $($batches.Count) batch(es) of up to $BatchSize files / $MaxBatchMB MB."

# ---- commit + push, one batch at a time -----------------------------------
$b = 0
foreach ($paths in $batches) {
    $b++
    Write-Host "Batch ${b}/$($batches.Count): $($paths.Count) file(s)"
    if ($DryRun) {
        $paths | Select-Object -First 3 | ForEach-Object { Write-Host "   $_" }
        if ($paths.Count -gt 3) { Write-Host '   ...' }
        continue
    }
    Run (@('add', '-A', '--') + $paths)
    if ($script:rc -ne 0) { Die 'git add failed' }
    Run @('commit', '-q', '-m', "$Message (batch ${b}/$($batches.Count))")
    if ($script:rc -ne 0) { Die 'git commit failed' }
    if (-not (PushNow)) { Die "push failed after batch $($b - 1). Everything before it is safe. Run this script again to continue." }
}

if ($DryRun) { Write-Host 'Dry run only - nothing was committed or uploaded.'; exit 0 }

$url = (@(Capture @('remote', 'get-url', 'origin')))[0]
$slug = $url
if ($url -match 'github\.com[:/]([^/]+)/([^/]+?)(\.git)?$') { $slug = "$($Matches[1]).github.io/$($Matches[2])" }
Write-Host ''
Write-Host "DONE - uploaded $total file(s)." -ForegroundColor Green
if ($skipped -gt 0) { Write-Host "($skipped file(s) were skipped for size - see above.)" }
Write-Host "Once GitHub Pages is on (Settings > Pages > Deploy from branch > $Branch, / root):"
Write-Host "  https://$slug/"
