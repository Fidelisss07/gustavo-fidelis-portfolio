export function portfolioSessionContext(content) {
  const certificates = content?.certificates || [];
  const projects = content?.projects || [];
  return [
    'Contexto público da versão atual do portfólio de Gustavo Fidelis. Estas informações complementam a base anterior.',
    'O INCLUB agora tem uma seção própria neste portfólio. Endereço: https://inclubs.com.br. Gustavo desenvolve o projeto com seus sócios. Proposta: vida noturna de São Paulo, listas VIP, camarotes e promoters. Next.js e Supabase. O lançamento comercial não foi confirmado; a existência do site não comprova lançamento. A informação antiga de que INCLUB não aparece no portfólio está desatualizada.',
    `Certificados disponíveis nesta página: ${certificates.length}.`,
    ...certificates.map(c => `${c.name} — ${c.meta}`),
    'Projetos apresentados:',
    ...projects.map(p => `${p.name}: ${p.description} ${p.status || ''}`),
  ].join('\n');
}
