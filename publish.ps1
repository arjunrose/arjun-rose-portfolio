$ErrorActionPreference = 'Stop'
$RepoUrl = 'https://github.com/arjunrose/arjun-rose-portfolio.git'
$Expected = 'https://github.com/arjunrose/arjun-rose-portfolio.git'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git is not installed or is not on PATH. Install Git for Windows, reopen PowerShell, then run this script again.'
}

$Current = (Get-Location).Path
if (-not (Test-Path (Join-Path $Current 'index.html'))) {
  throw 'Run this script from the extracted portfolio folder. index.html was not found here.'
}

if (-not (Test-Path (Join-Path $Current '.git'))) {
  git init
  if ($LASTEXITCODE -ne 0) { throw 'Could not initialise the local Git repository.' }
}

git branch -M main
if ($LASTEXITCODE -ne 0) { throw 'Could not set the local branch to main.' }

$Remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0 -and $Remote) {
  $Normalised = $Remote.Trim().TrimEnd('/')
  if ($Normalised -ne $Expected) {
    throw "Safety stop: origin is '$Remote', not the intended new repository '$Expected'. No push was made."
  }
} else {
  git remote add origin $RepoUrl
  if ($LASTEXITCODE -ne 0) { throw 'Could not add the origin remote.' }
}

git add -A
if ($LASTEXITCODE -ne 0) { throw 'Could not stage the portfolio files.' }

$Staged = git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host 'No new local changes to commit.' -ForegroundColor Yellow
} else {
  git commit -m 'Build immersive Arjun Rose engineering portfolio'
  if ($LASTEXITCODE -ne 0) { throw 'Git commit failed. Check git user.name and user.email.' }
}

# Integrate an existing README or initial commit without force-pushing.
git fetch origin main 2>$null
if ($LASTEXITCODE -eq 0) {
  git merge-base HEAD origin/main *> $null
  if ($LASTEXITCODE -ne 0) {
    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) { throw 'Could not safely rebase onto the remote main branch. No force push was attempted.' }
  } else {
    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) { throw 'Could not safely update from the remote main branch. No force push was attempted.' }
  }
}

git push -u origin main
if ($LASTEXITCODE -ne 0) {
  throw 'Push failed. Confirm GitHub authentication and that the connected account can write to arjunrose/arjun-rose-portfolio. No force push was attempted.'
}

Write-Host ''
Write-Host 'Portfolio pushed to the new repository.' -ForegroundColor Green
Write-Host 'https://github.com/arjunrose/arjun-rose-portfolio' -ForegroundColor Cyan
Write-Host 'After GitHub Pages completes its workflow, check:' -ForegroundColor Green
Write-Host 'https://arjunrose.github.io/arjun-rose-portfolio/' -ForegroundColor Cyan
Write-Host 'The existing Arjun_Rose_J_S repository was not accessed by this script.' -ForegroundColor Green
