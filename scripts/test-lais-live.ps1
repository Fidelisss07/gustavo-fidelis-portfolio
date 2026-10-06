$ErrorActionPreference = 'Stop'
$origin = 'https://gustavo-fidelis-portfolio.vercel.app'
$credential = Invoke-RestMethod -Uri "$origin/api/lais-session?mode=text" -Method Post -ContentType 'application/json' -Headers @{ Origin = $origin }
$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$socket.Options.SetRequestHeader('Origin', $origin)
$socket.Options.AddSubProtocol('convai')
$deadline = [System.Threading.CancellationTokenSource]::new(45000)
function Send-Event($payload) {
  $bytes = [Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Depth 8 -Compress))
  $null = $socket.SendAsync([ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $deadline.Token).GetAwaiter().GetResult()
}
try {
  $null = $socket.ConnectAsync([Uri]$credential.signedUrl, $deadline.Token).GetAwaiter().GetResult()
  $credential = $null
  Send-Event @{ type = 'conversation_initiation_client_data' }
  $audioBytes = 0
  $responses = 0
  while ($socket.State -eq 'Open') {
    $message = [IO.MemoryStream]::new()
    do {
      $buffer = [byte[]]::new(65536)
      $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), $deadline.Token).GetAwaiter().GetResult()
      if ($received.MessageType -eq 'Close') { throw "Server closed: $($received.CloseStatus) $($received.CloseStatusDescription)" }
      $message.Write($buffer, 0, $received.Count)
    } until ($received.EndOfMessage)
    $eventData = [Text.Encoding]::UTF8.GetString($message.ToArray()) | ConvertFrom-Json
    $message.Dispose()
    switch ($eventData.type) {
      'ping' { Send-Event @{type='pong'; event_id=$eventData.ping_event.event_id} }
      'conversation_initiation_metadata' {
        Write-Output 'Session connected; requesting spoken response.'
        Send-Event @{type='contextual_update'; text='Atualização do portfólio em outubro de 2026: o INCLUB agora tem uma seção própria no portfólio, link https://inclubs.com.br, desenvolvido por Gustavo com seus sócios. Há 11 certificados: 3 FIAP, incluindo Talent Summit Itaú e TOTVS, ambos de 1h em 30/09/2026, e 8 Dev Club. A descrição antiga que diz que INCLUB não consta no portfólio está desatualizada. O lançamento comercial não foi confirmado.'}
        Send-Event @{type='user_message'; text='O INCLUB aparece no portfólio? Quantos certificados há? Responda brevemente.'}
      }
      'agent_response' { $responses++; Write-Output ('Agent: ' + $eventData.agent_response_event.agent_response) }
      'audio' { $audioBytes += [Convert]::FromBase64String($eventData.audio_event.audio_base_64).Length }
    }
    if ($audioBytes -gt 16000 -and $responses -ge 1) { Write-Output "PASS: $responses responses and $audioBytes audio bytes received."; break }
  }
} finally {
  Write-Output "Received $responses responses and $audioBytes audio bytes."
  $socket.Abort()
  $socket.Dispose()
  $deadline.Dispose()
}
