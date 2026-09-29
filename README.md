# NexaDesk

Central de atendimento para execução em um único computador. Os dados ficam no PostgreSQL local, na base `nexadesk`; anexos ficam em disco local. A instalação inicia sem dados de demonstração.

## Preparar e iniciar

Requer Node.js 22.16+ e npm. O servidor escuta apenas em `127.0.0.1`.

```bash
npm install
npm run setup:local
```

O script cria `.env.local` com um segredo JWT aleatório. Abra esse arquivo no seu computador e preencha `EMAIL_USER` e `EMAIL_USER_TOKEN` com o e-mail remetente e o token SMTP. O padrão é Gmail (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`); para outro provedor, ajuste host e porta. Preencha `PRIVACY_CONTROLLER_NAME` e `PRIVACY_CONTACT_EMAIL` com o responsável pelos dados e o canal para pedidos de privacidade. Não compartilhe o token por chat nem inclua `.env.local` em backups públicos.

Configure `DATABASE_URL` e crie o esquema antes de iniciar o servidor. Sem essa variável, a aplicação falha de forma segura. O SQLite só é usado pelo teste integrado em uma base temporária.

Crie a base `nexadesk` e um usuário com acesso a ela. Preencha `DATABASE_URL` em `.env.local` com `postgresql://usuario:senha@127.0.0.1:5432/nexadesk` (codifique caracteres especiais da senha na URL). Pare o servidor, execute `npm run db:migrate:postgres` e então inicie novamente. O comando cria o esquema `nexadesk` no PostgreSQL e, se houver um SQLite anterior, importa seus dados e guarda uma cópia local. Ele interrompe a migração se o esquema de destino já contiver dados.

```bash
npm run db:migrate:postgres
npm run db:harden
npm run build
npm start
```

Neste computador, o serviço de usuário `nexadesk-local` mantém o servidor ativo entre sessões do terminal e o reinicia em caso de falha. Após cada novo build, reinicie-o para carregar o código atualizado:

```bash
systemctl --user restart nexadesk-local
systemctl --user status nexadesk-local
```

Para instalar o serviço em outra sessão deste mesmo computador, execute `systemctl --user link "$PWD/scripts/nexadesk-local.service"` e `systemctl --user enable --now nexadesk-local`. A unidade contém os caminhos absolutos deste projeto e da versão atual do Node.js; ajuste-os se mover a pasta ou trocar o Node. Não inicie `npm start` em paralelo com o serviço, pois ambos usam a porta 3000.

`db:harden` deve ser executado uma única vez, após criar as tabelas, usando uma conexão administrativa. Ele cria `nexadesk_runtime` com permissões apenas sobre os dados do esquema e troca a `DATABASE_URL` da aplicação por uma senha aleatória. Guarde a conta administrativa para futuras migrações de esquema; não a use para executar o servidor. Troque também a senha da conta administrativa no PostgreSQL e atualize a conexão salva no pgAdmin, especialmente se essa senha já foi compartilhada.

Para desenvolvimento, use `npm run dev` depois de criar o esquema. Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Cadastre a primeira conta em `/register`: ela será a proprietária do workspace. Confirme o link enviado por e-mail e faça login. As contas seguintes se cadastram como clientes com o código mostrado em **Configurações → Workspace**; precisam confirmar o próprio e-mail. O cadastro fica desabilitado até o SMTP e os dados do responsável pela privacidade estarem configurados.

Com `DATABASE_URL`, as operações usam somente o PostgreSQL; não há troca silenciosa de banco se a conexão falhar.

## Papéis e estados

O terminal local administra papéis `owner`, `admin`, `supervisor`, `agent` e `customer`, e estados `active`, `suspended` e `pending_email`. O script exige uma conta já cadastrada, não ativa contas cujo e-mail ainda não foi confirmado, protege o último owner ativo e revoga as sessões após alterações.

```bash
npm run account:list
npm run account:set -- --email pessoa@dominio.com --role agent
npm run account:set -- --email pessoa@dominio.com --status suspended
```

Para substituir a única conta owner de um workspace ainda vazio, use `npm run account:replace-owner -- --email pessoa@dominio.com --name Nome`. O comando pede a senha sem exibi-la no terminal, remove a conta anterior, envia o link de confirmação e só conclui a substituição se o envio SMTP funcionar. A nova conta fica pendente até confirmar o e-mail.

## Verificações locais

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:integration
npm run test:postgres
```

O teste integrado cria 20 contas fictícias (13 clientes, 4 admins e 3 supervisores) em um SQLite temporário fora da base real. Somente as contas de teste são marcadas como verificadas sem envio de e-mail. Ele exercita login, tickets, conversas, solução, avaliação, anexos e limites de acesso, e apaga o banco temporário ao terminar. `test:postgres` repete os fluxos principais em uma organização temporária no PostgreSQL local e remove essa organização ao final. A confirmação por e-mail permanece obrigatória na aplicação normal.

## Dados e privacidade

Após a migração, os dados operacionais ficam no PostgreSQL. Se ainda existir um arquivo SQLite anterior em `.data`, trate-o como cópia dos dados pessoais até removê-lo conforme sua política de retenção. Os anexos continuam em `.data/attachments`. A pasta `.data` e `.env.local` são ignorados pelo Git. Faça backup privado do PostgreSQL, dos anexos e do segredo JWT, defina um prazo de retenção e proteja o acesso ao computador. Na página **Minha conta**, cada usuário pode corrigir o nome, exportar seus dados e registrar um pedido de eliminação para análise do responsável. O aviso em `/privacy` descreve o tratamento atual.

O e-mail usa um provedor SMTP externo: ele recebe o endereço destinatário e a mensagem de confirmação ou recuperação. O copiloto atual gera apenas sugestões locais determinísticas. A aplicação não envia tickets a um serviço externo de IA.

## Funções locais

- Tickets, filas, Kanban, SLA, respostas, notas internas, anexos, filtros e histórico.
- Portal do cliente com artigos, solicitações, respostas e avaliação; acesso limitado aos próprios tickets.
- Base de conhecimento, macros, tags, automações, análises, notificações e atualização entre abas.
- Senhas com scrypt, sessões JWT revogáveis, confirmação por e-mail, recuperação de senha e controle de acesso por papel.

Anexos aceitos: PNG, JPEG, WebP, PDF e TXT de até 10 MB.

## Evolução futura

O adaptador PostgreSQL atual atende uma única instância Next.js em localhost e permite várias sessões no mesmo computador. O bloqueio transacional protege a criação simultânea de números de tickets. A interface ainda limita listas de tickets a 200 itens e o acesso por outros computadores está desabilitado. Para uma empresa usar várias máquinas, ainda são necessários domínio interno, HTTPS, configuração de host, paginação, testes de carga e infraestrutura de eventos. A migração em `supabase/migrations/0001_initial.sql` é uma proposta separada para um serviço público com Auth/RLS; ela não é aplicada à base local `nexadesk`. Uma publicação pública exige HTTPS, armazenamento privado, infraestrutura de e-mail e eventos distribuídos, revisão de segurança, política de retenção e avaliação jurídica/operacional da LGPD. Consulte [arquitetura](docs/architecture.md) e [estado do projeto](docs/roadmap.md).
