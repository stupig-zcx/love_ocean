param(
  [Parameter(Mandatory = $true)]
  [string]$ServerHost,

  [Parameter(Mandatory = $true)]
  [string]$User,

  [int]$Port = 22,

  [string]$RemotePath = "/var/www/love-ocean"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistPath = Join-Path $ProjectRoot "dist"
$PackagePath = Join-Path $ProjectRoot "dist-deploy.zip"

Push-Location $ProjectRoot
try {
  npm run build

  if (Test-Path $PackagePath) {
    Remove-Item -LiteralPath $PackagePath -Force
  }

  Compress-Archive -Path (Join-Path $DistPath "*") -DestinationPath $PackagePath -Force

  $Target = "${User}@${ServerHost}"
  ssh -p $Port $Target "mkdir -p '$RemotePath'"
  scp -P $Port $PackagePath "${Target}:/tmp/love-ocean-dist.zip"
  ssh -p $Port $Target "rm -rf '$RemotePath'/* && unzip -oq /tmp/love-ocean-dist.zip -d '$RemotePath' && rm -f /tmp/love-ocean-dist.zip"

  Write-Host "Deploy files uploaded to ${Target}:$RemotePath"
  Write-Host "Configure Nginx root to $RemotePath, then visit http://$ServerHost/"
}
finally {
  Pop-Location
}
