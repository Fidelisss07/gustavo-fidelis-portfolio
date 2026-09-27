$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
Write-Host "Configuração da Laís - ElevenLabs Agents + Gemini"
Write-Host "Somente a base revisada em lais/knowledge será enviada à ElevenLabs."
Write-Host "O agente poderá responder sobre essa base a visitantes do domínio permitido."
Write-Host "Não coloque informações confidenciais na base. Confirme sua licença de uso da voz."
Write-Host "O script exige cobrança excedente DESATIVADA na conta; não compra créditos."
$laisReview = Read-Host "Você revisou a base para divulgação e tem licença adequada para a voz? Digite SIM"
if ($laisReview -cne "SIM") { Write-Host "Nenhuma alteração realizada."; exit 0 }
$laisVoice = Read-Host "ID da voz escolhida"
$laisSecureKey = Read-Host "API key ElevenLabs (entrada oculta, não será salva)" -AsSecureString
$laisPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($laisSecureKey)
try {
  $laisPlainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($laisPointer)
  $laisPayload = @{apiKey=$laisPlainKey;voiceId=$laisVoice} | ConvertTo-Json -Compress
  $laisPayload | node scripts/configure-lais.mjs --apply --stdin --credits-only --public-knowledge-reviewed --license-reviewed
  if ($LASTEXITCODE -ne 0) { throw "Configuração não concluída. Veja o aviso acima." }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($laisPointer)
  $laisPlainKey = $null
  $laisPayload = $null
  $laisSecureKey.Dispose()
}

