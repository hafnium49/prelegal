$container = "prelegal"

docker rm -f $container *> $null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Stopped $container"
} else {
  Write-Host "$container is not running"
}
