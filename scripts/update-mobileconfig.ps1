param(
  [Parameter(Mandatory = $true)]
  [string]$AppUrl,

  [string]$IconPath = "public/icon.png",
  [string]$ConfigPath = "public/hyper-regedit-webclip.mobileconfig",
  [string]$Owner = "@hyperregedit",
  [string]$TelegramName = "HYPER REGEDIT OFFICIAL",
  [string]$TelegramUrl = "https://t.me/hyperregedit",
  [string]$Organization = "HYPER TEAM"
)

$resolvedIcon = Resolve-Path -LiteralPath $IconPath
$resolvedConfig = Resolve-Path -LiteralPath $ConfigPath
$iconBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($resolvedIcon))
$profileUuid = [guid]::NewGuid().ToString().ToUpperInvariant()
$webClipUuid = [guid]::NewGuid().ToString().ToUpperInvariant()

function Escape-Xml([string]$Value) {
  return [Security.SecurityElement]::Escape($Value)
}

$escapedAppUrl = Escape-Xml $AppUrl
$escapedOwner = Escape-Xml $Owner
$escapedTelegramName = Escape-Xml $TelegramName
$escapedTelegramUrl = Escape-Xml $TelegramUrl
$escapedOrganization = Escape-Xml $Organization
$consentText = "OWNER : $escapedOwner`nTELEGRAM`n$escapedTelegramName`n$escapedTelegramUrl"

$profile = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ConsentText</key>
  <dict>
    <key>default</key>
    <string>$consentText</string>
  </dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>Icon</key>
      <data>$iconBase64</data>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>Hyper Access</string>
      <key>PayloadDescription</key>
      <string>Add Hyper Regedit Access to the iPhone Home Screen.</string>
      <key>PayloadDisplayName</key>
      <string>Hyper Access Web Clip</string>
      <key>PayloadIdentifier</key>
      <string>com.hyperregedit.access.webclip</string>
      <key>PayloadOrganization</key>
      <string>$escapedOrganization</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>$webClipUuid</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>Precomposed</key>
      <true/>
      <key>URL</key>
      <string>$escapedAppUrl</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Message from Hyper Team. Installs the Hyper Regedit Access Web Clip.</string>
  <key>PayloadDisplayName</key>
  <string>Hyper Regedit Official</string>
  <key>PayloadIdentifier</key>
  <string>com.hyperregedit.access.profile</string>
  <key>PayloadOrganization</key>
  <string>$escapedOrganization</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>$profileUuid</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
"@

[IO.File]::WriteAllText($resolvedConfig, $profile, [Text.UTF8Encoding]::new($false))
Write-Host "Updated Web Clip profile: $resolvedConfig"
