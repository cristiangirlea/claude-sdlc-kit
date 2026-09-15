[CmdletBinding()]
param(
  [string]$Target = ".",
  [ValidateSet("claude", "codex")][string]$Tool = "claude",
  [switch]$Templates,
  [switch]$Force,
  [switch]$Upgrade,
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"
$installArgs = @((Join-Path $PSScriptRoot "install.mjs"), $Target, "--tool", $Tool)
if ($Templates) { $installArgs += "--templates" }
if ($Force) { $installArgs += "--force" }
if ($Upgrade) { $installArgs += "--upgrade" }
if ($DryRun) { $installArgs += "--dry-run" }
& node @installArgs
exit $LASTEXITCODE
