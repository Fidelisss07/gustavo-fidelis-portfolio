window.portfolioContent = {
  projects: [
    {
      id: "balu",
      name: "BaLu 3D",
      description:
        "E-commerce de impressão 3D com catálogo, checkout duplo (PIX + cartão), painel admin e e-mails transacionais. Projeto freelance entregue para cliente real.",
      image: "balu3d-logo.webp",
      url: "https://balu3d.com.br",
      repo: "",
      tags: ["Next.js", "TypeScript", "Firebase", "Stripe", "Cloudinary"],
      blocks: [
        {
          title: "O contexto",
          text: "Primeiro projeto freelance pago: uma loja virtual de impressão 3D encomendada por uma cliente externa, construída do zero até o ar.",
        },
        {
          title: "O que construí",
          text: "Catálogo de produtos, checkout com dois meios de pagamento, painel administrativo para gerir produtos e pedidos, upload com otimização de imagens e disparo de e-mails de confirmação.",
        },
        {
          title: "Por que essa stack",
          text: "Firebase para não manter servidor próprio — Firestore, Auth e Storage num só lugar, adequado ao orçamento de um projeto pequeno. Stripe para cartão, Cloudinary para servir imagem leve, já que loja de produto vive de foto.",
        },
        {
          title: "O desafio",
          text: "Checkout duplo: PIX e cartão têm fluxos de confirmação diferentes. O cartão retorna na hora; o PIX depende de conciliação. Os dois precisam terminar no mesmo estado de pedido.",
        },
      ],
      status:
        "Entregue e no ar. O catálogo nunca foi populado pela cliente e o projeto está sem manutenção ativa.",
    },
    {
      id: "amx",
      name: "AMXWatch",
      description:
        "E-commerce premium de relógios com frete via Melhor Envio, painel admin, conformidade LGPD, avaliações, favoritos, cupons e SEO avançado.",
      image: "amxwatch-logo.webp",
      url: "https://amxwatch.com.br",
      repo: "",
      tags: ["Next.js", "TypeScript", "Supabase", "GSAP", "Melhor Envio"],
      blocks: [
        {
          title: "O contexto",
          text: "E-commerce completo para uma loja de relógios em fase de abertura, com necessidade de vender e enviar para todo o Brasil desde o primeiro dia.",
        },
        {
          title: "O que construí",
          text: "Catálogo, checkout, painel administrativo com produtos, pedidos e cupons, sistema de avaliações e favoritos, fluxos de consentimento exigidos pela LGPD e otimização de SEO técnico.",
        },
        {
          title: "Por que essa stack",
          text: "Supabase por dar PostgreSQL de verdade com autenticação embutida — diferente do BaLu 3D, aqui as consultas de catálogo e pedido pediam relação entre tabelas. GSAP para as animações de interface sem pesar o carregamento.",
        },
        {
          title: "O desafio",
          text: "Frete em tempo real: a API do Melhor Envio precisa responder dentro do checkout, sem travar a compra se demorar ou falhar. Foram quatro serviços externos conversando no mesmo fluxo.",
        },
      ],
      status: "Em produção. A loja está em fase de abertura.",
    },
    {
      id: "debugarena",
      name: "DebugArena",
      description:
        "Plataforma para aprender programação investigando bugs: 24 casos de Front-end a DevOps, com pistas progressivas e correção conferida no servidor.",
      image: "debugarena-logo.webp",
      url: "https://debugarena-omega.vercel.app",
      repo: "https://github.com/Fidelisss07/DebugArena",
      tags: ["React", "TypeScript", "Tailwind", "Supabase", "Canvas"],
      blocks: [
        {
          title: "O contexto",
          text: "Curso ensina a escrever código; ninguém ensina a ler código quebrado. Mas na vaga real o dia começa com um bug que já está no ar, e é essa a habilidade que falta em quem está entrando.",
        },
        {
          title: "O que construí",
          text: "24 investigações em dois níveis. Cada uma entrega o código, a evidência do erro e o que era esperado; quem investiga pode abrir pistas aos poucos antes de responder. A correção acontece no servidor — o gabarito nunca é enviado ao navegador, senão bastava abrir o DevTools para vencer.",
        },
        {
          title: "Por que essa stack",
          text: "React com TypeScript e Tailwind pela velocidade de montar interface. Supabase porque a avaliação precisa de Postgres: gabarito e tentativa ficam em tabelas privadas, com a conferência dentro do banco. As fontes são servidas do próprio domínio, sem depender do Google.",
        },
        {
          title: "O desafio",
          text: "A home monta o mascote em 240 quadros conforme você rola. Baixar 240 imagens seria inviável, então elas vêm num pacote só, com no máximo quatro decodificando por vez e 32 quadros vivos na memória. Quem pede movimento reduzido ou economia de dados recebe uma imagem estática no lugar.",
        },
      ],
      status:
        "Em construção. As investigações já funcionam sem cadastro; login e progresso salvo estão prontos no código, esperando o banco ser ligado.",
    },
    {
      id: "acf",
      name: "ACF Performance",
      description:
        "Redesign do site de uma preparadora automotiva: 11 páginas, catálogo filtrável e orçamento pelo WhatsApp. Estático puro, sem nenhuma dependência de JavaScript.",
      image: "acf-logo.webp",
      url: "https://acf-reebranding-sage.vercel.app",
      repo: "https://github.com/Fidelisss07/ACF-Reebranding",
      tags: ["HTML", "CSS", "JavaScript", "Python", "Schema.org"],
      blocks: [
        {
          title: "O contexto",
          text: "Preparadora de motores em São Paulo que vende pacotes de performance, reprogramação de ECU e cursos. Três frentes de negócio muito diferentes tendo que caber no mesmo site sem virar confusão.",
        },
        {
          title: "O que construí",
          text: "Onze páginas, catálogo com filtros e formulário que monta a mensagem do WhatsApp sem guardar dado nenhum. SEO com títulos, descrições e dados estruturados de oficina e de curso, para os dois tipos de conteúdo aparecerem certo na busca.",
        },
        {
          title: "Por que essa stack",
          text: "Escrevi um gerador em Python que monta o HTML a partir dos templates. O que vai para o ar é estático puro: sem framework, sem dependência de JavaScript e sem build no servidor. Carrega rápido e não quebra porque uma biblioteca mudou.",
        },
        {
          title: "O desafio",
          text: "O catálogo vem do sistema que a oficina já usa. Em vez de consultar a API em tempo real, coletei uma vez e versionei o JSON — assim a página não fica refém de um serviço que não controlo, e cada atualização passa por revisão antes de ir ao ar.",
        },
      ],
      status:
        "Prévia no ar com noindex. Ainda há conteúdo comercial a aprovar antes de publicar no domínio final.",
    },
    {
      id: "milecar",
      name: "Milé Car Motors",
      description:
        "Redesign do site de uma revenda de veículos: oito páginas com estoque filtrável, financiamento e formulários. Módulos nativos do navegador, sem etapa de build.",
      image: "milecar-logo.webp",
      url: "https://milecar.vercel.app",
      repo: "https://github.com/Fidelisss07/milecar",
      tags: ["HTML", "CSS", "JavaScript", "ES Modules"],
      blocks: [
        {
          title: "O contexto",
          text: "Revenda de carros 0 km e seminovos em São Paulo. A direção de arte pedia preto com dourado e o carro como protagonista — o oposto do template genérico de concessionária.",
        },
        {
          title: "O que construí",
          text: "Home, estoque, 0 km, seminovos, venda seu carro, financiamento, sobre e contato. Busca e filtros no estoque, formulários validados e imagens em WebP para as fotos não pesarem, já que revenda vive de foto.",
        },
        {
          title: "Por que essa stack",
          text: "Módulos ES nativos, sem etapa de build: o que está no repositório é exatamente o que o navegador recebe. Roda em qualquer hospedagem estática, na raiz do domínio ou numa subpasta, e não exige que ninguém instale nada para dar manutenção.",
        },
        {
          title: "O desafio",
          text: "Os mockups traziam preços, anos e versões só para ilustrar. Mantive o layout fiel, mas isolei os dados numa camada separada, para que preço e estoque venham da fonte real em vez de ficarem escritos no HTML — informação comercial muda toda semana.",
        },
      ],
      status:
        "Redesign no ar como prévia. O site oficial da Milé Car continua sendo o milecarmotors.com.br.",
    },
    {
      id: "tcar",
      name: "T-CAR Imports",
      description:
        "Redesign do site de uma importadora de veículos premium. O cliente React fala o mesmo contrato de API do site atual, que descobri lendo o JavaScript público dele.",
      image: "tcar-logo.webp",
      url: "https://tcar-rho.vercel.app",
      repo: "https://github.com/Fidelisss07/T-CAR",
      tags: ["React", "TypeScript", "Vite", "TanStack Query", "Zod"],
      blocks: [
        {
          title: "O contexto",
          text: "Importadora de carros premium com site já em produção. Redesign completo, com a condição de que a versão nova conseguisse conversar com o back-end que já existe — refazer só a aparência não resolveria nada.",
        },
        {
          title: "O que construí",
          text: "Front-end em React com as rotas carregadas sob demanda, TanStack Query cuidando de cache, carregamento e erro, e validação com Zod usando o mesmo esquema no cliente e no servidor. Testes cobrindo filtros, formatação e validação.",
        },
        {
          title: "Por que essa stack",
          text: "CSS puro com tokens em vez de framework de interface, e as fontes servidas do próprio domínio. O visual é autoral e a página não carrega o peso de uma biblioteca de componentes que eu usaria em dez por cento.",
        },
        {
          title: "O desafio",
          text: "Descobrir como falar com a API existente sem ter acesso a ela. Li o JavaScript público do site atual até entender o contrato e escrevi um servidor local que o reproduz. O front roda hoje contra esse servidor e aponta para a API real trocando uma variável de ambiente.",
        },
      ],
      status:
        "Front-end no ar. Os campos ainda precisam ser confirmados com o back-end, e a newsletter do rodapé depende de um endpoint que a API atual não tem.",
    },
  ],
  certificates: [
    {
      name: "Formação Social e Sustentabilidade",
      meta: "FIAP · 80 HORAS · 2026",
      image: "cert-fiap-sustentabilidade.webp",
      verify: "https://on.fiap.com.br/validar-certificado/",
    },
    {
      name: "React",
      meta: "DEV CLUB · 2026",
      image: "cert-react.webp",
      verify:
        "https://devclub.curseduca.pro/verify/f954790203e46d922e851ae19a5c29b7d6c9ffee",
    },
    {
      name: "Node.js",
      meta: "DEV CLUB · 2026",
      image: "cert-node.webp",
      verify:
        "https://devclub.curseduca.pro/verify/797e2e9a3a3089a539aa12b7ec6700676c49e787",
    },
    {
      name: "TypeScript — Back-end",
      meta: "DEV CLUB · 2026",
      image: "cert-typescript.webp",
      verify:
        "https://devclub.curseduca.pro/verify/decd93bc96204611c3fc85acc12aede6399d094e",
    },
    {
      name: "JavaScript pt. VI — Async/Await",
      meta: "DEV CLUB · 2026",
      image: "cert-js-async.webp",
      verify:
        "https://devclub.curseduca.pro/verify/81e50f21c311d3439e3a75546a50d6d3f7751396",
    },
    {
      name: "CSS — Display Grid",
      meta: "DEV CLUB · 2026",
      image: "cert-css-grid.webp",
      verify:
        "https://devclub.curseduca.pro/verify/0adb5e43de52bc32e9c9383515a56d2cadbd6471",
    },
    {
      name: "JavaScript pt. V — A Nova Ordem de Dados",
      meta: "DEV CLUB · 2026",
      image: "cert-javascript.webp",
      verify: "",
    },
    {
      name: "CSS Intermediário",
      meta: "DEV CLUB · 2025",
      image: "cert-css.webp",
      verify: "",
    },
    {
      name: "Git & GitHub",
      meta: "DEV CLUB · 2025",
      image: "cert-git.webp",
      verify: "",
    },
    {
      name: "Talk Itaú — Inteligência Artificial: construindo o futuro do mercado financeiro com GenAI",
      meta: "TALENT SUMMIT · FIAP · 1 HORA · 30/09/2026",
      image: "cert-talent-summit-itau.jpg",
      verify: "",
      featured: true,
    },
    {
      name: "Talk TOTVS — Agentes inteligentes: como IA está redesenhando a eficiência operacional",
      meta: "TALENT SUMMIT · FIAP · 1 HORA · 30/09/2026",
      image: "cert-talent-summit-totvs.jpg",
      verify: "",
      featured: true,
    },
  ],
};
