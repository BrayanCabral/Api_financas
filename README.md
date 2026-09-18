# API de Finanças Pessoais

API REST para controle de finanças pessoais — gerenciamento de categorias e
transações (receitas e despesas) com validação de entrada e tratamento de erros.

Projeto de portfólio, construído do zero para praticar TypeScript, Prisma e
validação com Zod — tecnologias novas para mim em relação a projetos anteriores,
onde eu usava JavaScript e SQL cru.

## Stack

- **Node.js** + **Express 5**
- **TypeScript**
- **PostgreSQL** + **Prisma 7** (com driver adapter `@prisma/adapter-pg`)
- **Zod 4** para validação de entrada
- **tsx** para desenvolvimento

## Como rodar

**Pré-requisitos:** Node.js 20+ e um PostgreSQL acessível.

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o banco
cp .env.example .env
# edite o .env com a sua DATABASE_URL

# 3. Criar as tabelas
npx prisma migrate dev

# 4. Subir o servidor
npm run dev
```

A API sobe em `http://localhost:4001`. Confira com `GET /health`.

## Endpoints

### Categorias

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/categories` | Cria categoria |
| `GET` | `/categories?userId=1` | Lista categorias do usuário |
| `GET` | `/categories/:id` | Busca por id |
| `PUT` | `/categories/:id` | Atualiza o nome |
| `DELETE` | `/categories/:id` | Remove |

### Transações

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/transactions` | Cria transação |
| `GET` | `/transactions?userId=1` | Lista transações do usuário |
| `GET` | `/transactions/:id` | Busca por id |
| `PUT` | `/transactions/:id` | Atualiza |
| `DELETE` | `/transactions/:id` | Remove |

**Exemplo — criar transação:**

```json
POST /transactions
{
  "userId": 1,
  "valor": "1234.56",
  "type": "INCOME",
  "date": "2026-09-17",
  "categoryId": 2
}
```

## Decisões técnicas

### Valor monetário trafega como string, não number

O campo `valor` é enviado e retornado como string (`"1234.56"`), não como número.

O motivo é precisão: `number` em JavaScript é ponto flutuante binário, e valores
decimais como `99.9` não têm representação exata. Numa versão anterior, enviar
`99.9` gravava `99.90000000000001` no banco — erro que se acumula em somas e
quebra a consistência de saldo.

A coluna é `Decimal` no PostgreSQL, mas a perda acontecia **antes** do banco:
ainda no parse do JSON. Recebendo como string e validando o formato com regex,
o valor chega ao Prisma sem nunca passar por float.

### Validação nas bordas, com Zod

Toda entrada (`body`, `params`, `query`) é validada antes de tocar o banco.
`params` e `query` usam `z.coerce` porque chegam sempre como string; o `body`
usa os tipos diretos, já que o JSON preserva number e boolean.

Requisição inválida é rejeitada com `400` sem nenhuma consulta ao banco.

### Erros do Prisma traduzidos para HTTP

Códigos do Prisma são mapeados para respostas semânticas:

| Código | Significado | Resposta |
|---|---|---|
| `P2025` | Registro não encontrado no update/delete | `404` |
| `P2003` | Chave estrangeira inválida | `400` |
| outros | Erro inesperado | `500` |

A distinção importa: `404` significa "o recurso da URL não existe", enquanto
`400` significa "o dado que você enviou aponta para algo inexistente".

### Organização por domínio

Cada domínio tem seu próprio arquivo de rotas usando `express.Router()`, e o
`index.ts` apenas monta os routers. O arquivo principal tem 18 linhas e serve
como mapa da API.

```
src/
├── index.ts               # monta os routers e sobe o servidor
├── prisma.ts              # cliente do Prisma
├── validacao.ts           # schemas Zod
└── routes/
    ├── categories.ts
    └── transactions.ts
```

## Status

MVP em construção. Implementado:

- [x] CRUD de categorias
- [x] CRUD de transações
- [x] Validação de entrada com Zod
- [x] Tratamento de erros do Prisma
- [ ] Autenticação JWT
- [ ] Testes automatizados (Vitest + Supertest)
- [ ] Cálculo de saldo e agregações
- [ ] CI com GitHub Actions

**Aviso:** a API ainda não tem autenticação — o `userId` é informado
manualmente na requisição. Não use com dados reais até o JWT estar implementado.
