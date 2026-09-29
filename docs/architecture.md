# Arquitetura atual

O NexaDesk usa Next.js App Router, React e TypeScript. Server Components leem repositórios em `src/lib/local/`; Server Actions em `src/features/` e `src/app/actions.ts` validam e gravam alterações. Com `DATABASE_URL`, as consultas usam PostgreSQL na base `nexadesk` e no esquema `nexadesk`. Antes da migração, o SQLite permanece disponível para preservar os dados existentes. Os anexos ficam em `.data/attachments` e passam por uma rota que verifica o ticket e a visibilidade do arquivo.

Não há seed nem seleção de papéis na interface. O cadastro cria uma conta pendente e envia um token de confirmação de uso único por SMTP. Senhas usam scrypt. Sessões JWT têm identificador persistido no banco, expiração e revogação. Toda operação privada consulta a conta ativa e o papel atual. Clientes veem seus tickets e somente mensagens e anexos públicos.

Eventos por organização são distribuídos por Server-Sent Events em `/api/local-events` entre abas da mesma instância. O stream verifica a sessão ativa e filtra eventos por ticket para clientes. O contrato `AIProvider` em `src/features/ai/provider.ts` tem implementação local determinística e só produz sugestões revisáveis.

## Futuro fora de localhost

A migração PostgreSQL e RLS em `supabase/migrations/0001_initial.sql` é uma base planejada para um serviço público e não faz parte do esquema local `nexadesk`. O adaptador local usa uma conexão PostgreSQL em um worker para manter as operações existentes síncronas; ele se destina a uma única instância em localhost. O ambiente público exige uma camada de dados assíncrona e escalável, HTTPS, armazenamento privado de anexos, eventos distribuídos, revisão das políticas de acesso, retenção, backups e resposta a incidentes.
