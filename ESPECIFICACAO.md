# Especificação — api-financas-pessoais

Este documento descreve **o que cada rota deve fazer** — comportamento esperado, não sintaxe nem estrutura de código. A ideia é você desenhar a implementação sozinho a partir daqui; use isso como referência de consulta (o que aconteceria se a conversa com o Claude expirasse no meio do caminho).

## Referência rápida — métodos do Prisma Client

Cada operação de CRUD usa um método específico do `prisma.<model>.<método>(...)`:

| Método | Uso | Retorno se não achar nada |
|---|---|---|
| `create()` | Criar um registro novo | — (lança erro se violar constraint, ex: FK) |
| `findMany()` | Listar **vários** registros (pode filtrar com `where`) | array vazio `[]` (nunca `null`, nunca erro) |
| `findUnique()` | Buscar **um** registro por campo único (`id`, ou qualquer `@unique`) | `null` (não lança erro) |
| `update()` | Atualizar um registro existente, localizado por `where` | lança erro (`P2025`, "registro não encontrado") se o `where` não achar nada |
| `delete()` | Remover um registro existente, localizado por `where` | lança erro (`P2025`) se o `where` não achar nada |

Ponto importante que já vimos na prática: **`findUnique` não lança erro quando não acha nada — devolve `null`**. Já `update`/`delete` **lançam erro** nesse mesmo cenário (código `P2025`). É por isso que o tratamento de "não encontrado" é diferente dependendo do método: no `findUnique` você faz um `if` comparando com `null`; no `update`/`delete` você trata dentro do `catch`, verificando o código do erro (igual já fizemos com `P2003` no `create`).

Convenção adotada até aqui (mantenha):
- Chave de erro no JSON sempre `erro` (não `error`)
- Validação de entrada sempre com Zod, sempre antes de qualquer chamada ao Prisma
- Toda chamada ao Prisma dentro de `try/catch`
- Status 400 = dado do cliente é inválido; 404 = recurso não existe; 500 = falha inesperada do servidor

---

## Category — o que falta

### `PUT /categories/:id` (atualizar)
- **Entrada**: `id` vem do caminho (`req.params`); `name` (novo nome) vem do corpo (`req.body`)
- **Validação**: `id` precisa ser um número válido; `name` segue a mesma regra do `POST` (mínimo 3 caracteres)
- **Comportamento**:
  1. Valida o `id` do caminho
  2. Valida o `name` do corpo
  3. Tenta atualizar — pense em qual método de "atualizar um registro" existe no Prisma
  4. Se o `id` não existir, o Prisma lança um erro específico (não é o mesmo `P2003` do FK — pesquise qual código de erro do Prisma representa "registro não encontrado para atualizar", é outro código na mesma família `P2xxx`)
- **Respostas esperadas**:
  - `200` com a categoria atualizada, se tudo certo
  - `400` se `id` ou `name` forem inválidos
  - `404` se o `id` não existir
  - `500` para qualquer outro erro

### `DELETE /categories/:id` (remover)
- **Entrada**: só o `id`, do caminho
- **Validação**: `id` precisa ser um número válido
- **Comportamento**:
  1. Valida o `id`
  2. Tenta remover
  3. Mesmo raciocínio do `PUT`: se o `id` não existir, o Prisma lança um erro específico de "não encontrado" — mesmo código que você vai descobrir no item acima
  4. **Atenção a um cenário de regra de negócio**: essa categoria pode ter `Transaction` vinculada (lembra da FK `Transaction.categoryId`). O que a constraint `ON DELETE RESTRICT` que vimos no SQL gerado faz nesse caso? Pense em como isso deveria aparecer pro cliente da API (qual status faz sentido pra "não posso apagar isso porque tem coisa dependendo dele")
- **Respostas esperadas**:
  - `200` (ou `204`, sem corpo — pesquise a diferença entre os dois pra decidir) se removeu
  - `404` se o `id` não existir
  - Um status apropriado se houver `Transaction` vinculada impedindo a remoção
  - `500` para qualquer outro erro

---

## Transaction — CRUD completo (nada implementado ainda)

Mesmo padrão do `Category`, adaptado aos campos: `valor` (Decimal), `tipo` (`TransactionType`: `INCOME`/`EXPENSE`), `data` (DateTime), `userId`, `categoryId`.

### `POST /transactions` (criar)
- **Entrada**: `valor`, `tipo`, `data`, `userId`, `categoryId` — todos no corpo
- **Validação**:
  - `valor`: número positivo (pensa se zero ou negativo fazem sentido pro domínio)
  - `tipo`: só pode ser um dos dois valores do enum — o Zod tem uma forma específica de validar "só esse conjunto fechado de valores" (pesquise `z.enum`)
  - `data`: precisa ser uma data válida
  - `userId`, `categoryId`: números
- **Comportamento**: criar a transação. Repare que agora existem **duas** foreign keys (`userId` e `categoryId`) que podem violar constraint — não é mais só uma
- **Respostas esperadas**:
  - `201` com a transação criada
  - `400` se a validação falhar
  - `400`/`404` se `userId` **ou** `categoryId` não existirem (mesmo código de erro `P2003` que já usamos, só que agora precisa identificar **qual dos dois** campos causou o problema — o erro do Prisma tem uma informação adicional pra isso, pesquise a propriedade `meta` do erro)
  - `500` para outros erros

### `GET /transactions` (listar)
- **Entrada**: `userId` via query string (mesmo padrão do `Category`)
- Pense também se faz sentido já aceitar filtro por `categoryId` e por período (`data` início/fim) — não é obrigatório fazer agora, mas deixe pensado pra quando chegarmos nas agregações

### `GET /transactions/:id` (buscar uma)
- Mesmo padrão do `Category`: `findUnique`, checar `null`, `404` se não achar

### `PUT /transactions/:id` (atualizar)
- Mesmo padrão do `Category`, com os campos de `Transaction`

### `DELETE /transactions/:id` (remover)
- Mesmo padrão do `Category`. Note que aqui **não** há a mesma trava de "tem algo dependendo disso" que existia em `Category` — nada referencia uma `Transaction` como FK. Reflita se isso muda algo na resposta esperada.

---

## Regra de negócio: consistência de saldo (ainda a decidir juntos)

O domínio pede "consistência de saldo", mas note que **não existe um campo de saldo no schema** — ele não é armazenado, é **calculado** a partir da soma das transações (`INCOME` soma, `EXPENSE` subtrai).

Isso é uma decisão de arquitetura pra discutirmos antes de implementar (não decida sozinho, me chame quando chegar aqui): a ideia mais provável é um endpoint tipo `GET /users/:id/balance` que usa um método de **agregação** do Prisma (pesquise `aggregate` ou `groupBy`) pra somar os valores direto no banco, em vez de trazer todas as transações e somar no código.

## Regra de negócio: agregações (soma por categoria/período)

Endpoint ainda a desenhar juntos — provavelmente algo como `GET /transactions/summary?userId=X&categoryId=Y&de=DATA&ate=DATA`, usando `groupBy` do Prisma pra somar por categoria. Mesma recomendação: discutir antes de implementar, é decisão de formato de resposta que vale alinhar.

---

## Autenticação JWT (depois do CRUD de Transaction)

Alto nível, sem entrar em código:

### `POST /auth/register`
- Recebe `email` e `password` no corpo
- Valida formato do email e um tamanho mínimo de senha
- **Nunca** guarda a senha em texto puro — precisa de hash (pesquise `bcrypt` ou `argon2`, veja qual se encaixa melhor)
- Cria o `User`, responde sem devolver a senha (nem o hash) no JSON de resposta

### `POST /auth/login`
- Recebe `email` e `password`
- Busca o usuário pelo email, compara a senha enviada com o hash salvo
- Se bater, gera um **token JWT** (pesquise a lib `jsonwebtoken`) e devolve pro cliente
- Se não bater (email não existe OU senha errada), responde o **mesmo erro genérico** pros dois casos — pesquise por que não é boa prática diferenciar "email não existe" de "senha errada" nessa resposta

### Depois disso: proteger as rotas existentes
- Todas as rotas de `Category`/`Transaction` deixam de receber `userId` no corpo/query — passam a ler de um **middleware de autenticação** que decodifica o token JWT do header da requisição e descobre quem é o usuário logado
- Esse é o momento de voltar e **remover** o `userId` manual que colocamos como solução temporária em todas as rotas — é o ponto que avisei lá no início do CRUD de categorias

---

## Como usar este documento

Cada seção descreve o "contrato" — o que a rota recebe e o que ela deve devolver em cada cenário. A sintaxe, os nomes de método do Prisma, e a estrutura do código são decisão sua. Quando travar numa dúvida técnica específica (não sabe o nome do método, não entende um conceito novo), me chama — continuo funcionando como consulta, só que agora você tem o roteiro completo do que falta, sem depender de eu estar "no ar" pra saber qual é o próximo passo.
