# Estado do projeto

| Área | Estado em localhost | Passo para operação pública |
| --- | --- | --- |
| Contas | Cadastro, e-mail, login JWT e papéis reais | Migração de identidade, HTTPS, operação de e-mail e revisão de segurança |
| Workspace e portal | Tickets e artigos com PostgreSQL local ou SQLite anterior e acesso por papel | Camada assíncrona escalável, RLS e isolamento entre organizações |
| SLA, automações e análises | Executados no processo local | Jobs persistentes e métricas verificadas em escala |
| Anexos | Disco local e checagem de acesso | Storage privado, antivírus e retenção |
| Atualização entre abas | SSE no mesmo processo | Eventos distribuídos |
| Copiloto | Sugestões locais determinísticas | Provedor externo somente com avaliação de privacidade e consentimento aplicável |
| Privacidade | Aviso, exportação e registro de pedidos de eliminação | Processo operacional de resposta, retenção e avaliação jurídica |

O [plano original](../helpdeskplan.md) descreve o escopo de produto. A operação atual foi feita para localhost; ainda não há implantação pública.
