param (
    [string]$SourcePath,
    [string]$OutputDir
)

Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$Path,
        [string]$Destination,
        [int]$Width,
        [int]$Height
    )

    $src = [System.Drawing.Image]::FromFile($Path)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)

    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graph.DrawImage($src, 0, 0, $Width, $Height)

    $bmp.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)

    $graph.Dispose()
    $bmp.Dispose()
    $src.Dispose()
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir
}

$sizes = @(
    @{W=1024; H=1024; Name="logo-1024.png"},
    @{W=512; H=512; Name="logo-512.png"},
    @{W=256; H=256; Name="logo-256.png"},
    @{W=128; H=128; Name="logo-128.png"},
    @{W=32; H=32; Name="favicon-32.png"}
)

foreach ($size in $sizes) {
    $dest = Join-Path $OutputDir $size.Name
    Write-Host "Resizing to $($size.W)x$($size.H) -> $dest"
    Resize-Image -Path $SourcePath -Destination $dest -Width $size.W -Height $size.H
}
