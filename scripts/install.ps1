<#
.SYNOPSIS
  Vendor the kit into a project as plain files (Windows).

.DESCRIPTION
  Use this when you do not want the marketplace mechanism - the copied files
  are committed to the target repo, so the whole team gets them with a pull
  and can edit them in place. Existing files are skipped unless -Force.

.EXAMPLE
  .\scripts\install.ps1 -Target C:\src\my-repo -Templates

.EXAMPLE
  .\scripts\install.ps1 -Target C:\src\my-repo -Tool codex -DryRun
#>

[CmdletBinding()]
param(
  [string]$Target = ".",
  [ValidateSet("claude", "codex")]
  [string]$Tool = "claude",
  [switch]$Templates,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$KitDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$AdapterDir = Join-Path $KitDir "adapters\$Tool"
if (-not (Test-Path $AdapterDir)) { throw "adapters\$Tool is missing - run: node scripts/build.mjs" }
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
Write-Host "tool:   $Tool"
if ($DryRun) { Write-Host "(dry run)" }
Write-Host ""
Write-Host "plugins:"

foreach ($plugin in @("sdlc", "tracker")) {
  $p = Join-Path $AdapterDir $plugin
  if (-not (Test-Path $p)) { continue }

  if ($Tool -eq "claude") {
    Copy-KitTree (Join-Path $p "agents")  (Join-Path $TargetDir ".claude\agents")
    Copy-KitTree (Join-Path $p "skills")  (Join-Path $TargetDir ".claude\skills")
    Copy-KitTree (Join-Path $p "hooks")   (Join-Path $TargetDir ".claude\hooks")
    Copy-KitTree (Join-Path $p "scripts") (Join-Path $TargetDir ".claude\plugins\$plugin\scripts")
    # Project commands are namespaced by directory: .claude\commands\sdlc\spec.md -> /sdlc:spec
    Copy-KitTree (Join-Path $p "commands") (Join-Path $TargetDir ".claude\commands\$plugin")
  }
  else {
    Copy-KitTree (Join-Path $p "skills")     (Join-Path $TargetDir ".codex\plugins\$plugin\skills")
    Copy-KitTree (Join-Path $p "references") (Join-Path $TargetDir ".codex\plugins\$plugin\references")
    Copy-KitTree (Join-Path $p "scripts")    (Join-Path $TargetDir ".codex\plugins\$plugin\scripts")
  }
}

if ($Templates) {
  Write-Host ""
  Write-Host "templates:"
  $pairs = @(
    @{ s = "templates\AGENTS.md"; d = "AGENTS.md" },
    @{ s = "templates\CLAUDE.md"; d = "CLAUDE.md" },
    @{ s = "templates\git-hooks\pre-commit"; d = ".githooks\pre-commit" },
    @{ s = "templates\.github\pull_request_template.md"; d = ".github\pull_request_template.md" },
    @{ s = "templates\.github\workflows\quality-gates.yml"; d = ".github\workflows\quality-gates.yml" },
    @{ s = "templates\docs\specs\README.md"; d = "docs\specs\README.md" },
    @{ s = "templates\docs\adr\README.md"; d = "docs\adr\README.md" },
    @{ s = "templates\docs\tracker\README.md"; d = "docs\tracker\README.md" },
    @{ s = "src\skills\spec-writing\references\spec-template.md"; d = "docs\specs\SPEC-template.md" },
    @{ s = "src\skills\adr-writing\references\adr-template.md"; d = "docs\adr\ADR-template.md" }
  )
  if ($Tool -eq "claude") {
    $pairs += @{ s = "templates\settings.json"; d = ".claude\settings.json" }
  }
  foreach ($pair in $pairs) {
    Copy-KitFile -Src (Join-Path $KitDir $pair.s) -Dest (Join-Path $TargetDir $pair.d)
  }
}

Write-Host ""
Write-Host "$($script:Copied) file(s) installed, $($script:Skipped) skipped."
Write-Host ""
Write-Host "Next:"
if ($Tool -eq "claude") {
  Write-Host "  1. Run /sdlc:onboard - it writes an AGENTS.md whose commands it actually ran."
  Write-Host "  2. Run /tracker:setup local to start tracking work items."
  Write-Host "  3. Review .claude\settings.json before committing: the allow list should match this project's real commands."
  Write-Host "  4. Install the git guard too - it binds humans as well as agents:"
  Write-Host "       git config core.hooksPath .githooks"
}
else {
  Write-Host "  1. Ask Codex to follow the sdlc-onboard skill - it writes an AGENTS.md whose commands it actually ran."
  Write-Host "  2. Use the tracker-setup skill to start tracking work items."
  Write-Host "  3. Codex has no per-tool-call hook, so the git guard is the guardrail:"
  Write-Host "       git config core.hooksPath .githooks"
  Write-Host ""
  Write-Host "  NOTE: the project-local .codex\plugins path is NOT verified against a live Codex install."
  Write-Host "  If your build does not pick it up, add this repo as a marketplace instead, or copy"
  Write-Host "  adapters\codex\<plugin>\skills\* into ~\.codex\skills\."
}
