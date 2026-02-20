# HireLink Documentation Converter
# PowerShell script to convert Markdown to Word/PDF

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HireLink Documentation Converter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Pandoc is installed
$pandocPath = Get-Command pandoc -ErrorAction SilentlyContinue

if (-not $pandocPath) {
    Write-Host "Pandoc is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Pandoc, use one of these methods:" -ForegroundColor Yellow
    Write-Host "  1. winget install pandoc" -ForegroundColor Gray
    Write-Host "  2. choco install pandoc" -ForegroundColor Gray
    Write-Host "  3. Download from https://pandoc.org/installing.html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After installing, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Pandoc found at: $($pandocPath.Source)" -ForegroundColor Green
Write-Host ""

# Set paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$inputFile = Join-Path $scriptDir "HireLink_Academic_Project_Documentation.md"
$outputDocx = Join-Path $scriptDir "HireLink_Academic_Project_Documentation.docx"
$outputPdf = Join-Path $scriptDir "HireLink_Academic_Project_Documentation.pdf"

# Check if input file exists
if (-not (Test-Path $inputFile)) {
    Write-Host "Error: Input file not found at $inputFile" -ForegroundColor Red
    exit 1
}

Write-Host "Input file: $inputFile" -ForegroundColor Gray
Write-Host ""

# Convert to Word
Write-Host "Converting to Word (.docx)..." -ForegroundColor Yellow
try {
    & pandoc $inputFile -o $outputDocx --toc --toc-depth=3 -s --metadata title="HireLink - Academic Project Documentation"
    if (Test-Path $outputDocx) {
        Write-Host "Success! Created: $outputDocx" -ForegroundColor Green
    }
} catch {
    Write-Host "Error converting to Word: $_" -ForegroundColor Red
}

Write-Host ""

# Convert to PDF (optional - requires LaTeX)
Write-Host "Attempting to convert to PDF..." -ForegroundColor Yellow
Write-Host "(Note: This requires LaTeX to be installed)" -ForegroundColor Gray
try {
    & pandoc $inputFile -o $outputPdf --toc --toc-depth=3 -s --metadata title="HireLink - Academic Project Documentation" 2>$null
    if (Test-Path $outputPdf) {
        Write-Host "Success! Created: $outputPdf" -ForegroundColor Green
    } else {
        Write-Host "PDF conversion skipped (LaTeX not available)" -ForegroundColor Yellow
        Write-Host "To enable PDF output, install MiKTeX or TeX Live" -ForegroundColor Gray
    }
} catch {
    Write-Host "PDF conversion requires LaTeX. Install MiKTeX or TeX Live." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Conversion Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Output files are in the 'docs' folder." -ForegroundColor Gray
Write-Host "You can now open the .docx file in Microsoft Word" -ForegroundColor Gray
Write-Host "and further format it as needed." -ForegroundColor Gray
Write-Host ""
