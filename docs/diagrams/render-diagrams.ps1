# Render Mermaid Diagrams to PNG
# Requires: npm install -g @mermaid-js/mermaid-cli

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mermaid Diagram Renderer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if mmdc (mermaid-cli) is installed
$mmdcPath = Get-Command mmdc -ErrorAction SilentlyContinue

if (-not $mmdcPath) {
    Write-Host "Mermaid CLI (mmdc) is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install, run:" -ForegroundColor Yellow
    Write-Host "  npm install -g @mermaid-js/mermaid-cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use the online renderer:" -ForegroundColor Yellow
    Write-Host "  https://mermaid.live/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copy each .mmd file content, paste at mermaid.live," -ForegroundColor Gray
    Write-Host "then download as PNG/SVG." -ForegroundColor Gray
    exit 1
}

Write-Host "Mermaid CLI found. Rendering diagrams..." -ForegroundColor Green
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $scriptDir "images"

# Create output directory
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Gray
}

# Get all .mmd files
$mmdFiles = Get-ChildItem -Path $scriptDir -Filter "*.mmd"

foreach ($file in $mmdFiles) {
    $outputFile = Join-Path $outputDir ($file.BaseName + ".png")
    Write-Host "Rendering: $($file.Name)..." -ForegroundColor Yellow
    
    try {
        & mmdc -i $file.FullName -o $outputFile -t neutral -b white -w 1200
        if (Test-Path $outputFile) {
            Write-Host "  Created: $outputFile" -ForegroundColor Green
        }
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rendering Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Images saved to: $outputDir" -ForegroundColor Gray
Write-Host "Insert these images into your Word document." -ForegroundColor Gray
