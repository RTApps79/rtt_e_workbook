[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$SetId,
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$PatientAlias,
    [string]$Site = "",
    [string]$Diagnosis = "",
    [string]$Description = "",
    [string]$SourceLabel = "",
    [string[]]$SourceMetadata = @(),
    [string]$CommitMessage = "Add image set $SetId",
    [switch]$Replace,
    [switch]$Push
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$Importer = Join-Path $PSScriptRoot "import_image_set.py"
$Validator = Join-Path $PSScriptRoot "validate_image_library.py"

$Arguments = @(
    $Importer,
    "--repo-root", $RepoRoot,
    "--source", $Source,
    "--set-id", $SetId,
    "--title", $Title,
    "--patient-alias", $PatientAlias,
    "--site", $Site,
    "--diagnosis", $Diagnosis,
    "--description", $Description,
    "--source-label", $SourceLabel,
    "--confirm-deidentified"
)
if ($Replace) { $Arguments += "--replace" }
if ($SourceMetadata.Count -gt 0) {
    $Arguments += "--source-metadata"
    $Arguments += $SourceMetadata
}

Write-Host "Importing $SetId..." -ForegroundColor Cyan
& python @Arguments
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Validating image library..." -ForegroundColor Cyan
& python $Validator --repo-root $RepoRoot --hashes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Staging generated files..." -ForegroundColor Cyan
& git -C $RepoRoot add -- "patient_library/image_sets/$SetId" "patient_library/image_sets/catalog.json"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& git -C $RepoRoot status --short
& git -C $RepoRoot commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Git did not create a commit. There may be no changes, or Git may need configuration."
    exit $LASTEXITCODE
}

if ($Push) {
    Write-Host "Pushing commit..." -ForegroundColor Cyan
    & git -C $RepoRoot push
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Image set committed successfully." -ForegroundColor Green
