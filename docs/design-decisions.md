# Decisões de implementação

## Operação local

PostgreSQL é o banco operacional quando `DATABASE_URL` aponta para a base local `nexadesk`. O SQLite continua disponível para importar os dados anteriores e como alternativa local sem conexão configurada. A migração cria o esquema próprio `nexadesk`, preserva um backup do SQLite e recusa sobrescrever dados no destino. O servidor fica restrito a `127.0.0.1`.

## Identidade e e-mail

Contas reais exigem senha, verificação de e-mail e sessão JWT revogável. Os papéis são alterados com um script local que registra a mudança e encerra as sessões da conta. O token de e-mail configurado em `.env.local` é usado apenas pelo servidor. Zod valida os campos de cadastro e login.

## Evolução do backend

A migração Supabase/PostgreSQL e as políticas RLS permanecem no projeto como base futura. O esquema PostgreSQL local é separado da proposta Supabase; credenciais Supabase não ativam parcialmente as telas.

## Atualizações e IA

Server-Sent Events notificam abas conectadas à mesma instância. O provider de IA local retorna sugestões determinísticas para revisão humana e não chama serviços externos.

## Interface

O workspace usa cores semânticas e temas claro, escuro e sistema. A preferência visual fica no navegador.
