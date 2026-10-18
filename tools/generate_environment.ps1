Add-Type -AssemblyName System.Drawing

$generatorSource = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public static class EnvironmentPanoramaGenerator
{
    public static void Create(string path)
    {
        const int width = 1024;
        const int height = 512;
        using (var bitmap = new Bitmap(width, height, PixelFormat.Format24bppRgb))
        {
            for (int y = 0; y < height; y++)
            {
                double ny = (double)y / height;
                double t = ny < 0.52 ? Math.Pow(ny / 0.52, 0.8) : (ny - 0.52) / 0.48;
                double red = ny < 0.52 ? 5 + 58 * t : 63 - 39 * t;
                double green = ny < 0.52 ? 10 + 77 * t : 87 - 57 * t;
                double blue = ny < 0.52 ? 22 + 103 * t : 125 - 82 * t;
                double haze = 15 * Math.Exp(-0.5 * Math.Pow((ny - 0.52) / 0.12, 2));

                for (int x = 0; x < width; x++)
                {
                    double glow = 0;
                    foreach (int center in new[] { 140, 512, 884 })
                    {
                        double dx = (x - center) / 48.0;
                        double dy = (y - 105) / 92.0;
                        glow += 94 * Math.Exp(-0.5 * (dx * dx + dy * dy));
                    }

                    int r = (int)Math.Max(0, Math.Min(255, red + glow + haze));
                    int g = (int)Math.Max(0, Math.Min(255, green + glow + haze));
                    int b = (int)Math.Max(0, Math.Min(255, blue + glow + haze));
                    bitmap.SetPixel(x, y, Color.FromArgb(r, g, b));
                }
            }
            bitmap.Save(path, ImageFormat.Jpeg);
        }
    }
}
"@

Add-Type -TypeDefinition $generatorSource -ReferencedAssemblies System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectRoot 'public\environment\environment.jpg'
New-Item -ItemType Directory -Path (Split-Path -Parent $outputPath) -Force | Out-Null
[EnvironmentPanoramaGenerator]::Create([System.IO.Path]::GetFullPath($outputPath))
Write-Output "Generated $outputPath"
