# Pushes this project to https://github.com/nortonnort81-arch/task_manager.git
# Requires Git: https://git-scm.com/download/win (reopen terminal after install)
# Run:  cd "path\to\my_app"   then:   .\scripts\push-to-github.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $RepoRoot

$gitExe = $null
foreach ($p in @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
  )) {
  if (Test-Path $p) { $gitExe = $p; break }
}
if (-not $gitExe) {
  $cmd = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($cmd) { $gitExe = $cmd.Source }
}

if (-not $gitExe) {
  Write-Error "Git not found. Install Git for Windows and reopen PowerShell, then run this script again."
  exit 1
}

function G { & $gitExe @args; if ($LASTEXITCODE -ne 0) { throw "git $args failed (exit $LASTEXITCODE)" } }

$RemoteUrl = "https://github.com/nortonnort81-arch/task_manager.git"

if (-not (Test-Path ".git")) {
  G init
}

G add .
$dirty = & $gitExe status --porcelain
if ($dirty) {
  G commit -m "Initial commit: Expo task manager with Supabase"
}

G branch -M main

$null = & $gitExe remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  G remote add origin $RemoteUrl
} else {
  G remote set-url origin $RemoteUrl
}

& $gitExe fetch origin main 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Merging remote main (e.g. README) with local history..."
  & $gitExe pull origin main --allow-unrelated-histories --no-edit
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Merge or pull failed. Resolve conflicts, then: git push -u origin main"
    exit 1
  }
}

Write-Host "Pushing to origin main..."
G push -u origin main

Write-Host "Push finished."
