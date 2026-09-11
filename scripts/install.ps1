<#
.SYNOPSIS
  Install the SDLC kit into a project as plain .claude/ files (Windows).

.DESCRIPTION
  Use this when you do not want the plugin/marketplace mechanism - the copied
  files are committed to the target repo, so the whole team gets them with a
  pull and can edit them in place. Existing files are skipped unless -Force.

.EXAMPLE
  .\scripts\install.ps1 -Target C:\src\my-repo -Templates

.EXAMPLE
  .\scripts\install.ps1 -DryRun
#>

[CmdletBinding()]
param(
  [string]$Target = ".",
  [switch]$Templates,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$KitDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not (Test-Path $Target)) { throw "no such directory: $Target" }
$TargetDir = (Resolve-Path $Target).Path

if ($TargetDir -eq $KitDir) { throw "refusing to install the kit into itself" }

$script:Copied = 0
$script:Skipped = 0

function Copy-KitFile {
  param([string]$Src, [string]$Dest)

  $shown = $Dest.Substring($TargetDir.Length).TrimStart('\', '/')

  if ((Test-Path $Dest) -and (-not $Force)) {
    Write-Host "  skip    $shown (exists)"
    $script:Skipped++
    return
  }
  if ($DryRun) {
    Write-Host "  would   $shown"
  }
  else {
    $parent = Split-Path -Parent $Dest
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -Path $Src -Destination $Dest -Force
    Write-Host "  install $shown"
  }
  $script:Copied++
}

function Copy-KitTree {
  param([string]$SrcDir, [string]$DestDir)

  if (-not (Test-Path $SrcDir)) { return }
  $srcFull = (Resolve-Path $SrcDir).Path
  Get-ChildItem -Path $srcFull -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($srcFull.Length).TrimStart('\', '/')
    Copy-KitFile -Src $_.FullName -Dest (Join-Path $DestDir $relative)
  }
}

Write-Host "kit:    $KitDir"
Write-Host "target: $TargetDir"
if ($DryRun) { Write-Host "(dry run)" }
Write-Host ""
Write-Host "agents, skills, hooks:"

foreach ($plugin in @("sdlc", "tracker")) {
  $p = Join-Path $KitDir "plugins\$plugin"
  Copy-KitTree (Join-Path $p "agents")  (Join-Path $TargetDir ".claude\agents")
  Copy-KitTree (Join-Path $p "skills")  (Join-Path $TargetDir ".claude\skills")
  Copy-KitTree (Join-Path $p "hooks")   (Join-Path $TargetDir ".claude\hooks")
  Copy-KitTree (Join-Path $p "scripts") (Join-Path $TargetDir ".claude\plugins\$plugin\scripts")
  # Project commands are namespaced by directory: .claude\commands\sdlc\spec.md -> /sdlc:spec
  Copy-KitTree (Join-Path $p "commands") (Join-Path $TargetDir ".claude\commands\$plugin")
}

if ($Templates) {
  Write-Host ""
  Write-Host "templates:"
  $pairs = @(
    @{ s = "templates\CLAUDE.md"; d = "CLAUDE.md" },
    @{ s = "templates\settings.json"; d = ".claude\settings.json" },
    @{ s = "templates\.github\pull_request_template.md"; d = ".github\pull_request_template.md" },
    @{ s = "templates\.github\workflows\quality-gates.yml"; d = ".github\workflows\quality-gates.yml" },
    @{ s = "templates\docs\specs\README.md"; d = "docs\specs\README.md" },
    @{ s = "templates\docs\adr\README.md"; d = "docs\adr\README.md" },
    @{ s = "templates\docs\tracker\README.md"; d = "docs\tracker\README.md" },
    @{ s = "plugins\sdlc\skills\spec-writing\references\spec-template.md"; d = "docs\specs\SPEC-template.md" },
    @{ s = "plugins\sdlc\skills\adr-writing\references\adr-template.md"; d = "docs\adr\ADR-template.md" }
  )
  foreach ($pair in $pairs) {
    Copy-KitFile -Src (Join-Path $KitDir $pair.s) -Dest (Join-Path $TargetDir $pair.d)
  }
}

Write-Host ""
Write-Host "$($script:Copied) file(s) installed, $($script:Skipped) skipped."
Write-Host ""
Write-Host "Next:"
Write-Host "  1. Run /sdlc:onboard in the target repo - it writes a CLAUDE.md whose commands it has actually run."
Write-Host "  2. Run /tracker:setup local to start tracking work items."
Write-Host "  3. Review .claude\settings.json before committing it: the allow list should match this project's real commands."
Write-Host ""
Write-Host "The hooks in .claude\hooks\ are only wired up if .claude\settings.json references them."
