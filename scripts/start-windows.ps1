$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

$image = "prelegal:latest"
$container = "prelegal"

Write-Host "Building image..."
docker build -t $image .

Write-Host "Removing any existing container..."
docker rm -f $container *> $null

Write-Host "Starting container..."
docker run -d --name $container -p 8000:8000 $image | Out-Null

Write-Host "Prelegal running at http://localhost:8000"
