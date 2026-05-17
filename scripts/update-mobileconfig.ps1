param(
  [Parameter(Mandatory = $true)]
  [string]$AppUrl,

  [string]$IconPath = "public/icon.png",
  [string]$ConfigPath = "public/hyper-regedit-webclip.mobileconfig"
)

$resolvedIcon = Resolve-Path -LiteralPath $IconPath
$resolvedConfig = Resolve-Path -LiteralPath $ConfigPath
$iconBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($resolvedIcon))
$text = [IO.File]::ReadAllText($resolvedConfig)

$text = [Regex]::Replace(
  $text,
  "(?s)<key>Icon</key>\s*<data>.*?</data>",
  "<key>Icon</key>`n      <data>$iconBase64</data>"
)

$text = [Regex]::Replace(
  $text,
  "(?s)<key>URL</key>\s*<string>.*?</string>",
  "<key>URL</key>`n      <string>$AppUrl</string>"
)

[IO.File]::WriteAllText($resolvedConfig, $text, [Text.UTF8Encoding]::new($false))
Write-Host "Updated Web Clip profile: $resolvedConfig"
