param(
  [int]$Port = 5173
)

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrok) {
  Write-Error "ngrok is not installed or not available in PATH. Install ngrok, sign in, then run npm run tunnel again."
  exit 1
}

Write-Host "Starting ngrok HTTPS tunnel for http://localhost:$Port"
& $ngrok.Source http "http://localhost:$Port"
