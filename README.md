# Gustavo Fidelis — Portfólio

Portfólio autoral, estático e responsivo, com escultura 3D procedural em WebGL, coreografia de entrada e efeitos ligados à rolagem. HTML, CSS e JavaScript nativo, sem bibliotecas de interface ou dependências de execução.

## Executar

Requer Node.js 20 ou superior.

```sh
npm run dev
```

Abra http://127.0.0.1:4173. A pasta `dist` também pode ser servida por qualquer hospedagem estática. Não há etapa de compilação necessária.

## Conteúdo e estrutura

- `dist/index.html`: página e conteúdo principal; os seis projetos e nove certificados já constam no HTML.
- `dist/style.css`: identidade visual, layouts responsivos e preferências de movimento reduzido.
- `dist/app.js`: estudos de caso, certificados, navegação, checkout demonstrativo e envio do formulário.
- `dist/sculpture.js`: malha de nó toroidal, shaders de reflexo de estúdio e ciclo de renderização WebGL.
- `dist/content.js`: projetos, decisões técnicas, situação de cada entrega e links de validação dos certificados.
- `dist/assets`: foto, marcas, certificados e currículo originais.
- `render-content.mjs`: gera a apresentação estática de projetos e certificados; execute `npm run build` após editar seus dados.
- `source-assets/SOURCES.md`: procedência das imagens dos projetos.
- `verify.mjs`: verifica conteúdo, âncoras e arquivos locais.

As informações foram extraídas do repositório público `Fidelisss07/Portifolio` em 26/09/2026. A situação dos projetos é declarada conforme essa fonte, sem reclassificar prévias como entregas comerciais. O repositório original não foi alterado.

`import-content.mjs` é um utilitário de migração que usa a cópia original em `../Portifolio`. Ele não é necessário para executar ou publicar este projeto.

## Interações e acessibilidade

Modais nativos com fechamento por Escape, contenção de foco e devolução de foco ao acionador. Navegação por âncoras, link para pular conteúdo, controles com rótulos e respeito a `prefers-reduced-motion`. Imagens têm dimensões reservadas e carregamento adiado quando fora da abertura.

O objeto 3D responde ao ponteiro e à rolagem. A renderização é limitada a aproximadamente 30 quadros por segundo e a densidade de pixels a 1,5; para quando o objeto sai da tela, a aba fica oculta ou o movimento é pausado. Há fallback tipográfico quando WebGL não está disponível. O botão na abertura permite pausar os efeitos, e a preferência de movimento reduzido do dispositivo é respeitada automaticamente.

As capas de DebugArena e AMXWatch usam imagens dos próprios projetos. A imagem da AMXWatch é entregue em WebP otimizado. A foto pessoal foi preservada e recebe tratamento monocromático apenas por CSS.

O checkout é uma simulação local: quantidade limitada a 1–10, desconto PIX de 5% e valores calculados em centavos. Não recebe dados bancários nem processa pagamentos.

O formulário preserva o endpoint Formspree do site original. Possui validação, limite de espera, retorno de sucesso e alternativa de contato por e-mail. Nenhuma mensagem real foi enviada durante a verificação.

## Verificar

```sh
npm run check
```

Fontes: Manrope e IBM Plex Mono, servidas pelo Google Fonts, com alternativas do sistema. A publicação em Sites permanece privada; a configuração está em `.openai/hosting.json`.
