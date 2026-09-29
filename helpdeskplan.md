# PROJETO: HELPDESK / CENTRAL DE SUPORTE B2B SaaS DE NOVA GERAÇÃO

Atue como um engenheiro de software Full Stack sênior, arquiteto de software, Product Designer e especialista em UX para SaaS B2B.

Sua missão é projetar e implementar uma aplicação web completa de HelpDesk / Customer Support chamada provisoriamente de **NexaDesk**.

Não quero apenas um dashboard bonito.

Quero um produto SaaS funcional, coeso e tecnicamente convincente, desenvolvido como se pudesse evoluir para uma aplicação comercial real.

Este será o principal projeto de um portfólio de desenvolvimento Full Stack / Frontend avançado.

O produto deve demonstrar:

- arquitetura de software;
- frontend avançado;
- backend;
- modelagem de banco;
- autenticação;
- autorização;
- multi-tenancy;
- realtime;
- UX;
- acessibilidade;
- segurança;
- testes;
- automações;
- inteligência artificial;
- performance;
- observabilidade;
- responsividade;
- qualidade de código.

Evite qualquer aparência de projeto genérico criado por IA.

Não crie um simples conjunto de cards em um dashboard.

Não copie visualmente Zendesk, Intercom, Linear, Jira ou qualquer produto específico.

Use essas ferramentas apenas como referência de maturidade de produto.

---

# 1. VISÃO DO PRODUTO

O NexaDesk será uma plataforma B2B SaaS para empresas centralizarem atendimento ao cliente.

A plataforma deverá permitir que organizações:

- recebam tickets;
- classifiquem solicitações;
- acompanhem SLAs;
- conversem com clientes;
- adicionem notas internas;
- colaborem entre agentes;
- criem automações;
- mantenham uma base de conhecimento;
- acompanhem métricas;
- usem IA para produtividade;
- forneçam um portal self-service aos clientes.

A aplicação deverá possuir duas experiências claramente diferentes:

## Workspace do agente

Ambiente utilizado por:

- suporte;
- customer success;
- supervisores;
- administradores.

## Portal do cliente

Ambiente utilizado pelo cliente final para:

- pesquisar artigos;
- abrir tickets;
- acompanhar solicitações;
- responder conversas;
- consultar histórico.

Adicionar no ambiente de demonstração um alternador:

`Visualizar como Agente`

`Visualizar como Cliente`

Esse alternador existe apenas na versão demo/portfólio.

---

# 2. STACK PRINCIPAL

Utilize preferencialmente:

## Frontend

- Next.js com App Router
- React
- TypeScript estrito
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide Icons
- Framer Motion
- TanStack Query
- React Hook Form
- Zod

## Backend

Preferencialmente:

- Supabase

Utilizar:

- PostgreSQL
- Supabase Auth
- Supabase Realtime
- Row Level Security
- Storage

Caso exista uma justificativa arquitetural forte, uma camada Node.js poderá ser criada para determinadas rotas.

Não introduza tecnologias desnecessárias apenas para aumentar artificialmente a complexidade.

## Busca

- PostgreSQL Full Text Search para dados persistidos
- Fuse.js somente para conjuntos locais pequenos quando fizer sentido

## Drag-and-drop

Utilizar:

- dnd-kit

Evitar bibliotecas abandonadas.

## Editor

Utilizar:

- TipTap

Com:

- Markdown;
- links;
- listas;
- code blocks;
- anexos;
- atalhos.

## Charts

Utilizar uma biblioteca leve e compatível com React, como:

- Recharts

---

# 3. PRINCÍPIO DE ARQUITETURA

A aplicação deve ser construída pensando desde o início como um SaaS multi-tenant.

Nunca trate todos os dados como pertencentes a uma única empresa.

A entidade principal será:

`organization`

Todo dado corporativo deverá estar associado a uma organização.

Exemplos:

- tickets;
- agentes;
- clientes;
- artigos;
- automações;
- SLAs;
- tags;
- macros;
- auditoria.

Criar isolamento através de:

`organization_id`

Implementar Row Level Security quando possível.

---

# 4. SISTEMA DE PERMISSÕES

Implementar RBAC.

Papéis iniciais:

## Owner

Acesso completo.

## Admin

Gerencia:

- usuários;
- configurações;
- automações;
- SLAs;
- base de conhecimento.

## Supervisor

Pode:

- visualizar métricas;
- reatribuir tickets;
- acompanhar filas;
- gerenciar atendimento.

## Agent

Pode:

- visualizar tickets permitidos;
- responder;
- criar notas internas;
- alterar status;
- adicionar tags.

## Customer

Pode acessar apenas seus próprios tickets e conteúdos públicos.

A interface deve se adaptar às permissões.

Não apenas esconder botões.

As permissões também devem ser verificadas no backend.

---

# 5. IDENTIDADE VISUAL

Criar uma identidade própria.

Evite aparência genérica de dashboard SaaS.

## Dark mode principal

Background base aproximado:

`#090D16`

Mas não utilize preto absoluto em todas as superfícies.

Crie profundidade através de tons próximos:

- background;
- surface;
- surface elevated;
- border;
- hover.

## Accent

Utilizar gradiente discreto entre:

- violeta;
- azul elétrico.

Utilizar cores saturadas somente onde possuem função:

- CTA;
- foco;
- estados;
- indicadores importantes.

Não transformar toda a interface em neon.

---

# 6. DESIGN SYSTEM

Criar tokens de design.

Exemplo:

- background
- foreground
- muted
- surface
- surface-hover
- border
- primary
- success
- warning
- danger
- info

Utilizar CSS variables.

Criar suporte real para:

- dark mode;
- light mode;
- preferência do sistema.

A troca de tema deve possuir transição suave.

---

# 7. LAYOUT DO WORKSPACE

Criar layout inspirado em aplicações de produtividade modernas.

Estrutura principal:

## Sidebar

Itens:

- Overview
- Inbox
- Tickets
- Kanban
- Customers
- Knowledge Base
- Automations
- Analytics
- Team
- Settings

Sidebar deve poder ser reduzida.

Não utilizar uma sidebar exageradamente larga.

---

# 8. GLOBAL COMMAND PALETTE

Implementar Command Palette.

Atalho:

`Cmd + K`

ou:

`Ctrl + K`

Permitir:

- buscar ticket;
- buscar cliente;
- buscar artigo;
- abrir tela;
- criar ticket;
- executar ação rápida.

A experiência deverá lembrar launchers de aplicações modernas.

---

# 9. DASHBOARD DO AGENTE

O dashboard não deve ser apenas decorativo.

Mostrar dados úteis.

## KPIs

- Tickets abertos
- Tickets resolvidos
- Tempo médio da primeira resposta
- Tempo médio de resolução
- CSAT
- SLA Compliance

Cada métrica deve apresentar comparação com período anterior.

Exemplo:

`-12% comparado aos últimos 7 dias`

---

# 10. VISUALIZAÇÃO DE TICKETS

Permitir duas visualizações:

## Table / List

Tabela moderna e altamente legível.

Colunas:

- ID
- assunto
- cliente
- prioridade
- status
- responsável
- tags
- SLA
- última atualização

Suportar:

- sort;
- filtros;
- busca;
- seleção múltipla;
- ações em massa.

## Kanban

Colunas:

- Aberto
- Em andamento
- Aguardando cliente
- Resolvido

Utilizar drag-and-drop.

Ao mover o ticket:

- atualizar otimisticamente;
- persistir no banco;
- criar evento na auditoria;
- emitir atualização realtime.

---

# 11. FILTROS AVANÇADOS

Permitir filtros combináveis.

Exemplos:

Status = Open

AND

Priority = Urgent

AND

Tag = Billing

Filtros possíveis:

- status;
- prioridade;
- responsável;
- equipe;
- tags;
- sentimento;
- cliente;
- SLA;
- data.

Permitir salvar filtros como:

`Saved Views`

Exemplos:

- Meus tickets urgentes
- SLA em risco
- Billing
- Sem responsável

---

# 12. TELA DO TICKET

Essa deve ser uma das melhores telas da aplicação.

Utilizar layout de três áreas quando houver espaço.

## Área esquerda

Contexto e navegação entre tickets.

## Área central

Conversation timeline.

## Área direita

Painel de propriedades.

---

# 13. TIMELINE DO TICKET

Apresentar em ordem cronológica:

- mensagem do cliente;
- resposta do agente;
- nota interna;
- alteração de status;
- alteração de prioridade;
- mudança de responsável;
- evento de SLA;
- automação executada.

Diferenciar visualmente:

`Public reply`

e

`Internal note`

Notas internas jamais devem aparecer no portal do cliente.

---

# 14. COMPOSER DE RESPOSTA

Criar editor rico.

Suportar:

- Markdown;
- listas;
- código;
- links;
- uploads;
- imagens;
- atalhos;
- menções internas.

Possuir toggle:

`Reply to customer`

`Internal note`

Utilizar diferença visual clara entre ambos.

---

# 15. CANNED RESPONSES / MACROS

Permitir respostas rápidas através de slash commands.

Exemplo:

`/refund`

`/request-logs`

`/resolution`

Ao digitar `/`, abrir menu contextual.

Uma macro pode:

- inserir texto;
- adicionar tag;
- alterar status;
- alterar prioridade;
- atribuir responsável.

---

# 16. SISTEMA DE PRIORIDADE

Prioridades:

- Low
- Medium
- High
- Urgent

Não utilizar somente cor.

Adicionar:

- ícone;
- label;
- tooltip.

Garantir acessibilidade.

---

# 17. SLA ENGINE

Criar suporte a políticas de SLA.

Exemplo:

## Enterprise

Primeira resposta:

15 minutos

Resolução:

4 horas

## Business

Primeira resposta:

1 hora

Resolução:

8 horas

O SLA poderá depender de:

- plano;
- prioridade;
- tipo de cliente.

---

# 18. SLA COUNTDOWN

Exibir cronômetro do SLA nos tickets.

Estados:

Safe

At risk

Breached

Exemplo:

`38m restantes`

Quando estiver próximo de vencer:

- alterar indicador;
- gerar notificação;
- executar automação.

---

# 19. AUTOMATION ENGINE

Criar interface de automações no estilo:

WHEN

IF

THEN

Exemplo:

WHEN

Ticket created

IF

priority = urgent

THEN

assign to Tier 2

AND

notify supervisor

Outro exemplo:

WHEN

SLA < 15 minutes

THEN

priority = urgent

assign supervisor

Gerar histórico da execução.

Não precisa criar um motor extremamente complexo.

Mas sua arquitetura deve permitir expansão.

---

# 20. CUSTOMER PROFILE

Criar página do cliente.

Mostrar:

- nome;
- empresa;
- e-mail;
- plano;
- MRR fictício;
- tickets anteriores;
- satisfação;
- tags;
- último contato.

Exibir contexto útil para o agente.

---

# 21. COMPANY PROFILE

Como é B2B, clientes podem pertencer a empresas.

Criar entidade:

`company`

Exemplo:

Acme Inc.

Clientes:

- Alice
- Bruno
- Carlos

Mostrar:

- plano;
- account status;
- tickets;
- health score simulado;
- contatos.

---

# 22. COLABORAÇÃO REALTIME

Utilizar Supabase Realtime.

Funcionalidades:

- novas mensagens;
- atualização de status;
- mudança de responsável;
- presença.

Mostrar:

`Ana está visualizando este ticket`

ou avatares discretos no topo.

Evitar conflito entre agentes.

---

# 23. TYPING INDICATOR

No chat/ticket:

`Cliente está digitando…`

ou:

`Ana está escrevendo…`

Implementar de forma discreta.

---

# 24. SISTEMA DE NOTIFICAÇÕES

Criar notification center.

Eventos:

- novo ticket;
- ticket atribuído;
- menção;
- SLA em risco;
- resposta do cliente;
- automação.

Permitir:

- marcar como lida;
- marcar todas como lidas.

---

# 25. IA — PRINCÍPIO

A IA deve atuar como copiloto.

Nunca executar ações críticas silenciosamente.

Qualquer conteúdo gerado deve estar identificado.

Sempre permitir revisão humana.

Adicionar:

`AI generated`

quando apropriado.

---

# 26. SENTIMENT ANALYSIS

Ao receber um ticket, classificar sentimento como:

- Positive
- Neutral
- Negative
- Frustrated

Exibir discretamente no ticket.

Nunca basear decisões críticas exclusivamente nesse dado.

---

# 27. AUTO TAGGING

Sugerir tags.

Exemplo:

Mensagem:

"Meu cartão foi cobrado duas vezes"

Tags sugeridas:

- billing
- duplicate-charge

O agente pode:

Accept

Dismiss

---

# 28. AI RESPONSE SUGGESTION

Adicionar ação:

`Generate reply`

IA deverá utilizar:

- ticket;
- contexto;
- histórico;
- artigos da base.

A resposta deverá aparecer como rascunho.

Jamais enviar automaticamente.

---

# 29. AI THREAD SUMMARY

Para tickets longos:

Adicionar:

`Summarize`

Gerar no máximo 3 bullets:

- problema;
- ações realizadas;
- situação atual.

---

# 30. AI WRITING TOOLS

No composer:

- Make concise
- More formal
- More friendly
- Improve clarity
- Translate

---

# 31. AUDIT LOG

Criar auditoria completa.

Eventos:

- ticket created;
- assigned;
- reassigned;
- priority changed;
- status changed;
- automation triggered;
- SLA breached;
- agent replied.

Mostrar:

user

timestamp

event

old value

new value

---

# 32. BASE DE CONHECIMENTO

Criar área de Knowledge Base.

Categorias:

- Getting Started
- Account
- Billing
- Integrations
- Troubleshooting

Cada artigo terá:

- título;
- slug;
- conteúdo;
- categoria;
- autor;
- status;
- tempo de leitura;
- views;
- helpful votes.

---

# 33. SMART KNOWLEDGE SEARCH

No portal do cliente:

Busca estilo Spotlight.

Atalho:

`Cmd + K`

Enquanto o usuário digita:

mostrar resultados instantâneos.

Exibir:

- título;
- categoria;
- trecho;
- leitura estimada.

---

# 34. DEFLECTION SYSTEM

No formulário de criação de ticket:

Quando usuário digitar:

"Não consigo redefinir minha senha"

Mostrar:

`Talvez estes artigos resolvam seu problema`

Listar artigos relacionados.

Objetivo:

reduzir tickets duplicados.

---

# 35. PORTAL DO CLIENTE

Criar experiência separada.

Home:

- busca principal;
- artigos populares;
- categorias;
- botão "Open a request".

Área:

`My Requests`

Mostrar:

- assunto;
- status;
- data;
- última resposta.

---

# 36. FORMULÁRIO DE NOVO TICKET

Campos:

- subject;
- category;
- description;
- attachment;
- priority quando aplicável.

Adicionar sugestão de artigos durante a digitação.

Adicionar validação.

---

# 37. ANALYTICS

Criar dashboard analítico.

Gráficos:

- Tickets por dia
- First response time
- Resolution time
- SLA compliance
- CSAT trend
- Tickets por categoria
- Tickets por agente

Criar filtros:

7d

30d

90d

Custom

---

# 38. TEAM PERFORMANCE

Página de equipe.

Mostrar agentes.

Indicadores:

- tickets ativos;
- resolvidos;
- response time;
- CSAT;
- SLA compliance.

Não criar gamificação tóxica.

Use métricas como informação operacional.

---

# 39. INBOX

Criar uma Unified Inbox.

Na primeira versão:

- portal;
- web support.

Preparar arquitetura para futura expansão:

- email;
- WhatsApp;
- Slack;
- API.

Criar campo:

`channel`

na entidade ticket/message.

---

# 40. DATA MODEL

Criar schema adequado.

Entidades sugeridas:

organizations

organization_members

users

companies

customers

teams

tickets

ticket_messages

ticket_events

ticket_tags

tags

ticket_assignees

sla_policies

sla_events

automations

automation_runs

canned_responses

knowledge_categories

knowledge_articles

notifications

attachments

customer_feedback

ai_suggestions

audit_logs

---

# 41. TICKET

Campos sugeridos:

id

organization_id

number

subject

description

status

priority

channel

customer_id

company_id

assigned_agent_id

assigned_team_id

sla_policy_id

sentiment

created_at

updated_at

first_response_at

resolved_at

---

# 42. TICKET STATUS

Utilizar enum:

open

in_progress

waiting_customer

resolved

closed

---

# 43. REALTIME ARCHITECTURE

Utilizar realtime para:

- ticket updates;
- new messages;
- notifications;
- presence.

Evitar refetch desnecessário.

Usar TanStack Query.

Estratégia:

server render inicial

+

client realtime updates

+

optimistic updates quando apropriado.

---

# 44. AUTENTICAÇÃO

Implementar:

- login;
- logout;
- password reset.

Opcional:

- Google OAuth.

Implementar rotas protegidas.

---

# 45. ONBOARDING

Criar onboarding para nova organização.

Etapas:

1. Workspace name
2. Team size
3. Support goals
4. Invite agents
5. Configure SLA
6. Finish

Na versão demo, disponibilizar opção:

`Skip and explore demo`

---

# 46. SETTINGS

Criar páginas:

Workspace

Members

Teams

SLA

Automations

Tags

Canned Responses

Integrations

Appearance

Security

---

# 47. DEMO MODE

Criar seed data realista.

Exemplo de organizações:

CloudForge

Clientes fictícios.

Tickets:

"Webhook returns 401 after token rotation"

"Unable to invite new workspace member"

"Duplicate invoice charge"

"API latency increased after migration"

"SSO configuration failing"

Evitar Lorem Ipsum.

Criar textos coerentes.

---

# 48. EMPTY STATES

Criar empty states úteis.

Evitar apenas:

"No data"

Exemplo:

`No tickets in this queue`

`New conversations will appear here when customers contact your team.`

Botão relevante quando aplicável.

---

# 49. LOADING STATES

Criar:

- skeletons;
- optimistic UI;
- progressive loading.

Evitar spinners grandes.

---

# 50. ERROR STATES

Criar tratamento adequado de:

- network error;
- permission denied;
- not found;
- timeout;
- upload failure.

Adicionar retry onde fizer sentido.

---

# 51. TOASTS

Usar apenas para feedback transitório.

Exemplo:

`Ticket assigned to Ana`

Não utilizar toast para erros críticos que exigem ação.

---

# 52. RESPONSIVIDADE

Desktop:

experiência completa.

Tablet:

layout adaptado.

Mobile:

não simplesmente encolher desktop.

Criar navegação adequada.

Ticket view pode utilizar:

tabs ou drawers.

---

# 53. ACESSIBILIDADE

Meta:

WCAG AA.

Implementar:

- navegação por teclado;
- focus visible;
- labels;
- aria;
- contraste;
- reduced motion;
- screen reader friendly.

Drag-and-drop deve possuir alternativa por teclado.

---

# 54. KEYBOARD SHORTCUTS

Adicionar atalhos.

Exemplos:

`Cmd/Ctrl + K`

Command palette.

`C`

Create ticket.

`R`

Reply.

`N`

Internal note.

`E`

Assign to me.

`Esc`

Close modal.

Mostrar shortcuts em tooltips.

---

# 55. MICROINTERAÇÕES

Utilizar Framer Motion apenas quando melhorar UX.

Exemplos:

- abertura de drawers;
- movimentação Kanban;
- novas mensagens;
- hover cards;
- command palette;
- mudança de status.

Evitar animação excessiva.

---

# 56. PERFORMANCE

Objetivo:

Lighthouse alto.

Aplicar:

- code splitting;
- lazy loading;
- dynamic imports;
- optimized images;
- pagination;
- virtualização em listas grandes quando necessário.

Evitar enviar bibliotecas grandes para páginas que não utilizam.

---

# 57. SERVER COMPONENTS

Utilizar Server Components onde fizer sentido.

Não transformar toda aplicação em:

`"use client"`

Utilizar client components somente quando necessários.

---

# 58. CACHE

Definir estratégia explícita.

Dados dinâmicos:

tickets

notifications

presence

Dados menos dinâmicos:

knowledge base

settings

Utilizar corretamente:

React Query

Next.js cache

revalidation

---

# 59. SEGURANÇA

Implementar:

- validação Zod;
- sanitização de conteúdo;
- RBAC;
- RLS;
- upload validation;
- limite de tamanho;
- MIME validation;
- secure auth cookies quando aplicável.

Nunca confiar apenas no frontend.

---

# 60. RATE LIMIT

Preparar rate limiting para:

- login;
- ticket creation;
- AI actions;
- search APIs.

Mesmo que no modo demo utilize implementação simplificada.

---

# 61. IA — ABSTRAÇÃO

Não acoplar diretamente toda aplicação a um único provider.

Criar interface:

AIProvider

Métodos:

analyzeSentiment()

suggestTags()

generateReply()

summarizeThread()

rewriteText()

translateText()

Criar provider mock para modo gratuito/demo.

Dessa forma o projeto funciona sem API paga.

---

# 62. ZERO CUSTO PARA DEMO

O projeto deverá poder rodar gratuitamente.

Utilizar:

- Supabase free tier;
- Vercel free tier;
- dados simulados;
- AI mock provider.

Não exigir API paga para demonstrar o sistema.

Se uma integração de IA real for opcional:

utilizar environment variable.

Sem API key:

usar mock provider automaticamente.

---

# 63. OBSERVABILIDADE

Criar logging básico estruturado.

Registrar:

- erros;
- actions críticas;
- automations;
- AI actions;
- SLA changes.

Preparar integração futura com ferramentas externas.

---

# 64. TESTES

Criar testes relevantes.

Unit tests:

- SLA calculations;
- permissions;
- automation rules;
- utility functions.

Component tests:

- ticket filters;
- composer;
- ticket status.

Integration tests:

- create ticket;
- reply ticket;
- assign ticket.

E2E:

Utilizar Playwright.

Fluxos:

Cliente abre ticket.

Agente recebe ticket.

Agente responde.

Cliente visualiza resposta.

---

# 65. QUALIDADE

Configurar:

ESLint

Prettier

TypeScript strict

Husky opcional

lint-staged opcional

---

# 66. ORGANIZAÇÃO DO PROJETO

Criar uma arquitetura clara.

Exemplo:

src/

app/

components/

features/

lib/

hooks/

services/

types/

config/

utils/

features/tickets

features/customers

features/knowledge

features/automations

features/analytics

Evitar pasta gigantesca:

components/

com centenas de arquivos desconectados.

---

# 67. FEATURE-BASED ARCHITECTURE

Cada feature deverá agrupar:

components

queries

mutations

types

schemas

utils

Exemplo:

features/tickets/

components/

queries/

mutations/

schemas/

types/

---

# 68. COMPONENTIZAÇÃO

Criar componentes reutilizáveis.

Mas não abstrair tudo prematuramente.

Evitar componentes absurdamente genéricos.

Prefira clareza.

---

# 69. README

Criar README profissional.

Deve conter:

## Product overview

## Demo

## Screenshots

## Core features

## Architecture

## Tech stack

## Database model

## Realtime architecture

## AI architecture

## Security

## Running locally

## Environment variables

## Testing

## Design decisions

## Trade-offs

## Roadmap

---

# 70. ARCHITECTURE DOCUMENTATION

Criar:

`docs/architecture.md`

Explicar:

- frontend architecture;
- backend;
- auth;
- realtime;
- multi-tenancy;
- permissions;
- SLA engine;
- automation engine;
- AI provider.

---

# 71. DESIGN DECISIONS

Criar:

`docs/design-decisions.md`

Documentar decisões.

Exemplo:

Por que Supabase?

Por que PostgreSQL?

Por que TanStack Query?

Por que Server Components em determinadas telas?

Por que AIProvider?

---

# 72. DATABASE DOCUMENTATION

Criar:

`docs/database.md`

Adicionar:

- tabelas;
- relacionamentos;
- índices;
- RLS;
- principais queries.

---

# 73. ROADMAP

Criar:

`docs/roadmap.md`

Versões:

V1

Ticket management

Knowledge base

Realtime

SLA

V2

Automations

Analytics

AI

V3

Email ingestion

Integrations

Webhooks

API pública

---

# 74. PÁGINAS PRINCIPAIS

Criar rotas aproximadamente assim:

/app

/app/inbox

/app/tickets

/app/tickets/[id]

/app/kanban

/app/customers

/app/customers/[id]

/app/companies/[id]

/app/knowledge

/app/knowledge/[id]

/app/automations

/app/analytics

/app/team

/app/settings

/portal

/portal/articles

/portal/articles/[slug]

/portal/tickets

/portal/tickets/[id]

/portal/new-ticket

---

# 75. LANDING PAGE

Criar também uma landing page curta.

Objetivo:

apresentar o produto.

Não gastar mais esforço nela do que na aplicação.

Seções:

Hero

Features

Product preview

AI copililot

SLA/automation

CTA demo

---

# 76. UI NÃO GENÉRICA

Evitar:

- cards demais;
- gradiente em todos os lugares;
- números gigantes sem contexto;
- emojis;
- blobs;
- glow excessivo;
- gráficos decorativos;
- hero genérica;
- ícones dentro de quadrados coloridos em todos os cards.

O visual deve parecer uma ferramenta real de trabalho.

---

# 77. BENTO GRID

Utilizar Bento Grid somente onde fizer sentido:

Dashboard

Analytics overview

Landing page

Não aplicar Bento Grid a toda a aplicação.

Inbox e ticket view devem priorizar densidade e produtividade.

---

# 78. GLASSMORPHISM

Utilizar glassmorphism de maneira extremamente sutil.

Pode ser usado em:

- command palette;
- floating toolbar;
- modal;
- overlays.

Não transformar todas as superfícies em vidro transparente.

---

# 79. POLIMENTO

Adicionar:

- tooltips;
- context menus;
- right-click menu;
- keyboard navigation;
- breadcrumb;
- hover states;
- focus states;
- unsaved changes warning;
- confirm destructive actions.

---

# 80. UX DE PRODUTO

Sempre pensar:

Qual problema isso resolve?

Evite funcionalidade puramente visual.

Toda tela deve possuir:

- propósito;
- hierarquia;
- ação principal;
- contexto.

---

# 81. SEED DATA

Criar pelo menos:

1 organização

6 agentes

15 clientes

5 companies

40 tickets

10 knowledge articles

6 canned responses

5 automations

3 SLA policies

Diversificar:

priority

status

sentiment

assignee

SLA

---

# 82. DEMO ACCOUNT

Criar experiência fácil para recrutadores.

Landing:

`Explore live demo`

Entrar automaticamente em workspace demo quando possível.

Caso autenticação seja obrigatória:

criar login demo.

Mostrar:

Demo Agent

Demo Admin

Demo Customer

---

# 83. PERFIL DE DEMONSTRAÇÃO

Adicionar menu:

`Demo role`

Agent

Supervisor

Admin

Customer

Assim um recrutador pode explorar diferentes permissões.

---

# 84. COMMANDS DE DESENVOLVIMENTO

Projeto deverá funcionar com algo como:

npm install

npm run dev

npm run build

npm run lint

npm run test

npm run test:e2e

---

# 85. ENV

Criar:

`.env.example`

Nunca commitar secrets.

---

# 86. GIT

Criar `.gitignore` adequado.

Adicionar estrutura de commits sugerida no README.

Não gerar histórico falso.

---

# 87. PRIORIDADE DE IMPLEMENTAÇÃO

Não tente criar tudo simultaneamente.

Implementar por fases.

## Fase 1

Design system

layout

auth

database

multi-tenant architecture

seed

## Fase 2

tickets

ticket detail

messages

assignment

filters

## Fase 3

realtime

kanban

notifications

presence

## Fase 4

knowledge base

portal

self-service

## Fase 5

SLA

automations

analytics

## Fase 6

AI copililot

## Fase 7

tests

performance

accessibility

documentation

---

# 88. PRIMEIRA ENTREGA

Antes de implementar dezenas de telas:

Crie:

1. arquitetura;
2. schema do banco;
3. design tokens;
4. estrutura de pastas;
5. layout principal;
6. seed strategy.

Depois avance.

---

# 89. NÃO FAÇA

Não:

- crie apenas um frontend estático;
- deixe botões sem função;
- invente números aleatórios diretamente nos componentes;
- use mock data espalhado em arquivos;
- use `any`;
- duplique lógica;
- faça componentes de 1000 linhas;
- use gradiente exagerado;
- abuse de animações;
- use emojis como ícones;
- coloque IA em toda parte;
- gere comentários óbvios de código;
- crie textos dizendo "powered by AI" sem necessidade;
- implemente funcionalidades falsas.

Quando uma funcionalidade ainda não estiver pronta, prefira não mostrar a ação.

---

# 90. CRITÉRIO FINAL

O produto final deve causar a impressão de:

"Este desenvolvedor não apenas sabe montar interfaces. Ele entende como um SaaS real é estruturado."

O sistema deve demonstrar:

- engenharia;
- UX;
- arquitetura;
- domínio de React;
- domínio de Next.js;
- backend;
- SQL;
- realtime;
- segurança;
- IA aplicada;
- testes;
- atenção a detalhes.

---

# 91. PRIMEIRO PASSO DO CODEX

Comece analisando todo este documento.

Depois produza:

1. plano técnico do projeto;
2. arquitetura;
3. estrutura de diretórios;
4. modelo de banco;
5. relacionamento entre entidades;
6. estratégia de autenticação e autorização;
7. estratégia realtime;
8. estratégia de IA mock/real;
9. design system;
10. roadmap técnico.

Em seguida inicialize o projeto e implemente a **Fase 1**.

Não tente gerar o sistema inteiro em uma única resposta ou alteração gigantesca.

Implemente incrementalmente mantendo o projeto executável ao final de cada etapa.

Após cada fase:

- execute typecheck;
- execute lint;
- execute testes existentes;
- corrija erros;
- confirme que o build continua funcionando.

Nunca avance deixando erros conhecidos para trás.
