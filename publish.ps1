$ErrorActionPreference = 'Stop'
$RepositoryUrl = 'https://github.com/arjunrose/arjun-rose-portfolio.git'

Write-Host 'Arjun Rose Portfolio 2.0 - safe publisher' -ForegroundColor Cyan

foreach ($required in @('index.html', 'styles.css', 'app.js', '.github/workflows/deploy.yml')) {
    if (-not (Test-Path $required)) {
        throw "Required file '$required' was not found. Extract the portfolio ZIP and run this script from the extracted project folder."
    }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not installed or not on PATH. Install Git for Windows, reopen PowerShell, and run this script again.'
}

if (-not (Test-Path '.git')) {
    git init
    if ($LASTEXITCODE -ne 0) { throw 'git init failed.' }
}

git branch -M main
if ($LASTEXITCODE -ne 0) { throw 'Could not select the main branch.' }

$existingRemote = git remote get-url origin 2>$null
$remoteExit = $LASTEXITCODE
if ($remoteExit -eq 0 -and $existingRemote) {
    $normalized = $existingRemote.Trim().TrimEnd('/')
    if ($normalized -notin @($RepositoryUrl.TrimEnd('/'), 'git@github.com:arjunrose/arjun-rose-portfolio.git')) {
        throw "Safety stop: this folder's origin points to '$normalized', not the new portfolio repository. No push was attempted."
    }
} else {
    git remote add origin $RepositoryUrl
    if ($LASTEXITCODE -ne 0) { throw 'Could not add the new portfolio repository as origin.' }
}

git add --all
if ($LASTEXITCODE -ne 0) { throw 'git add failed.' }

$changes = git status --porcelain
if ($changes) {
    git commit -m 'Publish Arjun Rose interactive portfolio'
    if ($LASTEXITCODE -ne 0) { throw 'Commit failed. Configure your Git name/email, then run this script again.' }
} else {
    Write-Host 'No local changes to commit.' -ForegroundColor Yellow
}

# Deliberately no --force: this cannot overwrite remote history.
git push --set-upstream origin main
if ($LASTEXITCODE -ne 0) {
    throw 'Push failed. Complete GitHub sign-in when prompted and check that the new repository is empty and you have write access.'
}

Write-Host ''
Write-Host 'Portfolio source pushed successfully.' -ForegroundColor Green
Write-Host 'Next: open Settings > Pages in the NEW repository and select GitHub Actions as the source.' -ForegroundColor Yellow
Write-Host 'Deployment URL: https://arjunrose.github.io/arjun-rose-portfolio/' -ForegroundColor Cyan
