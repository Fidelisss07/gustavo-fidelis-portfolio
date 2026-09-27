# Laís — ativação e operação

## Estado atual
Interface e integração prontas no código. O agente ainda não foi criado: faltam a chave da conta ElevenLabs, a voz escolhida e a base complementar do Gustavo. `dist/lais-config.json` permanece com `enabled: false`. Não há respostas simuladas nem chamadas de IA enquanto desativado.

## Arquitetura
O cliente oficial `@elevenlabs/client` é empacotado e carregado sob demanda. Voz usa WebRTC; texto usa WebSocket sem ativar o microfone. A ElevenLabs hospeda reconhecimento de fala, orquestração, Gemini e síntese de voz. Nenhum modelo da OpenAI é selecionado; fallback de LLM está desativado para não trocar de provedor implicitamente.

Não é preciso colocar uma chave Gemini no navegador: o Gemini é acessado pela infraestrutura e cobrança da ElevenLabs. Isso **não utiliza a faixa gratuita da API Gemini direta**.

A chave administrativa ElevenLabs só é usada pelo configurador local, via entrada oculta. Não é salva, embutida no site ou incluída em Git. O cliente recebe apenas o ID público do agente.

O agente é restrito por allowlist de domínio e Origin obrigatório. Isso é uma barreira contra uso acidental em outros sites, **não autenticação de usuários**: um cliente não-browser pode falsificar Origin. Portanto, somente informações aprovadas para divulgação pública entram na base. Para bases confidenciais, use agente privado, tokens assinados e backend autenticado antes de ativar. A publicação do portfólio continua com o acesso privado existente.

## Configuração
1. Revise `lais/system-prompt.md`, `lais/agent-settings.json` e os Markdown de `lais/knowledge`.
2. Adicione a base adicional em `lais/knowledge/complementar.md`. Para LinkedIn, use `linkedin.md`, com conteúdo exportado/revisado, URL e data.
3. Execute `npm run lais:knowledge` para atualizar as capturas de site, currículo e metadados GitHub. A extração de currículo usa Python + pypdf; se necessário, defina `LAIS_PYTHON`. Não há coleta de áreas privadas. O GitHub captura até 100 repositórios públicos; não analisa integralmente todos os códigos.
4. No painel ElevenLabs, escolha uma voz adequada para pt-BR e copie seu Voice ID. Confira a licença de uso: o plano gratuito não inclui licença comercial.
5. Garanta que usage-based billing esteja desativado (`max_credit_limit_extension: 0`). Confira também recargas automáticas e saldo/plano no painel. O configurador não compra créditos nem altera faturamento.
6. Crie uma chave de API com somente as permissões necessárias para ler voz e assinatura, gerenciar o agente e a base de conhecimento.
7. No PowerShell, na pasta do projeto, execute `./Configure-Lais.ps1`. Se a política da máquina bloquear scripts, não a altere silenciosamente; use um terminal autorizado ou solicite orientação.
8. O configurador mostra um resumo, pede confirmação da base/licença, solicita Voice ID e chave oculta, valida a trava de excedente, sincroniza os documentos, cria/atualiza somente a Laís e verifica os limites retornados. Só então ativa `dist/lais-config.json`.
9. Publique essa alteração e faça um teste curto real de texto e voz. Esse teste consome créditos; a qualidade, a latência e a compatibilidade do microfone só podem ser verificadas com a conta conectada.

O arquivo `.lais-state.json` guarda IDs e hashes locais para evitar duplicatas, sem chave. Preserve-o entre atualizações. Se uma criação remota ficar sem resposta, o configurador para na próxima execução até reconciliar o ID no painel. Não repita às cegas.

## Limites pré-configurados
- Gemini 2.5 Flash, sem fallback automático de outro provedor.
- 1 conversa simultânea, no máximo 5 novas conversas por dia.
- 180 segundos por sessão, fim após 30 segundos sem fala.
- Sem bursting; configuração interrompida se cobrança excedente não estiver confirmada como zero.
- Sem gravação de áudio; retenção solicitada de zero dias, sem promessa de Zero Retention Mode enterprise.
- Sem ferramentas de e-mail, agenda, compras, execução de código ou navegação arbitrária.

Esses limites não reservam créditos só para a Laís nem representam um teto monetário independente. Outros usos da mesma conta consomem a cota compartilhada. Se alguém mudar o faturamento no painel depois, a proteção depende dessa configuração da conta; confira-a periodicamente. Não foi criada automação de monitoramento.

## Conhecimento e atualização
O modelo consulta capturas versionadas por data, não “todo o LinkedIn/GitHub em tempo real”. Site e currículo são lidos localmente; GitHub vem da API pública. A base complementar nunca é carregada automaticamente de arquivos fora da pasta indicada. As capturas locais são ignoradas pelo Git e não são servidas em `dist`.

Após mudar o portfólio ou currículo: execute captura, revise e sincronize novamente. Não há cron nem crawler recorrente configurado. A base pequena entra no contexto completo; acima de 65 mil caracteres o configurador pede revisão ou RAG para evitar crescimento silencioso de custo.

## Testes
`npm test`: sessões de voz/texto com conector simulado, cancelamento durante conexão, bloqueio de sessão duplicada, erro de microfone, encerramento em erro, descarte de mensagens antigas e limites de configuração. Não equivalem a testes reais da API.

`npm run check`: integridade de projetos/certificados/assets. Testar no navegador: abrir/fechar Laís, Escape/foco, consentimento, modos e mensagens de indisponibilidade.

## Documentação oficial consultada
- https://elevenlabs.io/docs/eleven-agents/libraries/java-script
- https://elevenlabs.io/docs/eleven-agents/customization/authentication
- https://elevenlabs.io/docs/eleven-agents/customization/llm
- https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/manage-documents
- https://elevenlabs.io/docs/help-center/product/eleven-agents/how-much-does-eleven-agents-cost
- https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform
- https://api.elevenlabs.io/openapi.json

