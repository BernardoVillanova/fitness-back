# 🏋️ Fitness Back - Backend API

API RESTful para gerenciamento de academias, fichas de treino, exercícios e acompanhamento de alunos.

## 🚀 Como Rodar

### Opção 1: Clone e Instalação Local

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd fitness-back

# Instale as dependências
npm install

# Configure as variáveis de ambiente (veja seção abaixo)
cp .env.example .env

# Execute o servidor
npm run dev
```

A API estará disponível em `http://localhost:3000`

### Opção 2: Docker

**Executar apenas o backend:**
```bash
docker build -t fitness-back .
docker run -p 3000:3000 fitness-back
```

A API estará disponível em `http://localhost:3000`

## ⚙️ Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto `fitness-back/`:

```bash
MONGODB_URI=mongodb://user:123456@localhost:27017/fitness?authSource=admin

JWT_SECRET=sua_chave_secreta_muito_segura

PORT=3000

API_BASE_URL=http://localhost:3000

CORS_ORIGIN=http://localhost:8080,http://localhost:8081,http://localhost
```

### Diferentes ambientes:

**Desenvolvimento Local:**
```bash
MONGODB_URI=mongodb://admin:123456@localhost:27017/fitness?authSource=admin
CORS_ORIGIN=http://localhost:8080,http://localhost:8081,http://localhost
```

**Produção:**
```bash
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/fitness
CORS_ORIGIN=https://seu-dominio.com
JWT_SECRET=chave_super_secreta_e_longa_aqui
```

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web minimalista
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT (jsonwebtoken)** - Autenticação baseada em tokens
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos (imagens)
- **Swagger** - Documentação automática da API
- **CORS** - Controle de acesso entre origens

## 📦 Estrutura do Projeto

```
fitness-back/
├── config/
│   └── db.js              # Configuração do MongoDB
├── controllers/           # Lógica de negócio
│   ├── equipmentController.js
│   ├── exerciseController.js
│   ├── gymController.js
│   ├── instructorController.js
│   ├── progressController.js
│   ├── studentController.js
│   ├── workoutPlanController.js
│   └── workoutSessionController.js
├── middleware/            # Middlewares
│   ├── authMiddleware.js  # Autenticação JWT
│   └── uploadMiddleware.js # Upload de imagens
├── models/                # Modelos do banco de dados
│   ├── equipment.js
│   ├── exercise.js
│   ├── gym.js
│   ├── instructor.js
│   ├── student.js
│   ├── user.js
│   ├── workoutPlan.js
│   └── workoutSession.js
├── routes/                # Rotas da API
│   ├── auth.js
│   ├── equipments.js
│   ├── exercises.js
│   ├── gyms.js
│   ├── instructors.js
│   ├── progress.js
│   ├── students.js
│   ├── workoutPlans.js
│   └── workoutSessions.js
├── uploads/               # Arquivos enviados
│   ├── avatars/
│   ├── equipments/
│   ├── exercises/
│   └── gyms/
├── docs/
│   └── swagger.js         # Configuração do Swagger
├── .env                   # Variáveis de ambiente
├── server.js              # Arquivo principal
└── package.json           # Dependências e scripts
```

## 🎯 Principais Funcionalidades

### 1. Autenticação
- Registro de usuários (instrutor/aluno)
- Login com JWT
- Rotas protegidas por autenticação

### 2. Gestão de Academias
- CRUD completo de academias
- Upload de logo
- Informações de contato e endereço

### 3. Gestão de Instrutores
- Cadastro com especializações
- Vinculação a academias
- Gerenciamento de alunos

### 4. Gestão de Alunos
- Perfil completo do aluno
- Histórico de progresso (peso, altura, medidas)
- Atribuição de fichas de treino

### 5. Exercícios e Equipamentos
- Catálogo de exercícios com imagens
- Categorias e grupos musculares
- Gestão de equipamentos

### 6. Fichas de Treino
- Criação independente de fichas
- Divisões de treino (A, B, C, etc.)
- Exercícios detalhados (séries, repetições, carga)
- Atribuição a alunos específicos

### 7. Sessões de Treino
- Registro de treinos executados
- Acompanhamento de progresso
- Feedback do aluno

## 📚 Documentação da API

Após iniciar o servidor, acesse a documentação Swagger em:

```
http://localhost:3000/api-docs
```

## 📝 Scripts Disponíveis

```bash
npm run dev                  # Inicia servidor de desenvolvimento
node server.js               # Inicia servidor
node sync-workout-plans.js   # Script de sincronização de fichas
node check-student-data.js   # Verifica dados de alunos
```

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header das requisições:

```bash
Authorization: Bearer seu_token_aqui
```

## 📊 Modelos de Dados

### User (Usuário)
```javascript
{
  username: String,
  email: String,
  password: String (hash),
  role: 'student' | 'instructor',
  profileId: ObjectId
}
```

### WorkoutPlan (Ficha de Treino)
```javascript
{
  name: String,
  description: String,
  instructorId: ObjectId,
  divisions: [{
    name: String,
    exercises: [{
      exerciseId: ObjectId,
      sets: Number,
      reps: String,
      weight: Number,
      rest: String,
      notes: String
    }]
  }]
}
```

### Student (Aluno)
```javascript
{
  userId: ObjectId,
  fullName: String,
  dateOfBirth: Date,
  phone: String,
  currentWorkoutPlan: ObjectId,
  gymId: ObjectId,
  instructorId: ObjectId,
  progressHistory: [{
    date: Date,
    weight: Number,
    height: Number,
    bodyMeasurements: Object
  }]
}
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request
   Execute o comando abaixo para instalar todas as dependências necessárias:
   ```bash
   npm install
   ```

   Configuração do Banco de Dados : 

    Certifique-se de ter o MongoDB instalado e rodando localmente ou use uma conexão remota.
    Configure a URI do MongoDB no arquivo .env:
    ```env
        MONGO_URI=mongodb://localhost:27017/fitness-tcc
        JWT_SECRET=seu_segredo_jwt
    ```
     
     

Iniciar o Servidor :
Execute o comando abaixo para iniciar o servidor: 

```bash
node server.js
```

O servidor estará disponível em http://localhost:3000. 

Documentação Swagger :
Acesse a documentação interativa da API em: 

    http://localhost:3000/api-docs
     
     
     

#### **3.2. Como Encontrar Determinadas Coisas**

    Modelos de Dados : 
        Todos os modelos estão na pasta models/. Por exemplo, o modelo de ficha de treino está em models/workoutPlan.js.
         

    Rotas da API : 
        As rotas estão definidas na pasta routes/. Por exemplo, as rotas de autenticação estão em routes/auth.js.
         

    Lógica de Negócios : 
        A lógica de negócios está implementada nos controladores, localizados na pasta controllers/. Por exemplo, a lógica para criar uma ficha de treino está em controllers/workoutPlanController.js.
         

    Autenticação : 
        O middleware de autenticação está em middleware/authMiddleware.js.
        O token JWT é gerado após o login e deve ser incluído no cabeçalho das requisições protegidas:
        json
         

        Authorization: Bearer <token>

    Documentação Swagger : 
        Os comentários para documentação Swagger estão diretamente nas rotas (routes/). Eles são processados pelo arquivo docs/swagger.js.
         
     

#### **4. Exemplo de Fluxo de Uso**
4.1. **Registro de Usuário**

Envie uma requisição POST para /api/auth/register com os seguintes dados: 
    
        {
        "name": "João",
        "email": "joao@example.com",
        "password": "senha123",
        "role": "aluno"
        }

Após o registro, faça login enviando uma requisição POST para /api/auth/login: 
json
 
 
{
  "email": "joao@example.com",
  "password": "senha123"
}
 
 

Receba o token JWT na resposta: 

    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
     
     
     

4.2. **Criação de Ficha de Treino**

Envie uma requisição POST para /api/workout-plans com os seguintes dados: 

        {
        "name": "Ficha de Hipertrofia",
        "divisions": [
            {
            "name": "Treino A",
            "exercises": [
                {
                "name": "Supino Reto",
                "description": "Execução com barra reta.",
                "image": "https://example.com/supino-reto.jpg",
                "sets": 4,
                "reps": 10,
                "idealWeight": 50
                }
            ]
            }
        ]
        }
 
 

Receba a confirmação da criação da ficha: 

    {
      "message": "Ficha de treino criada com sucesso!"
    }
     
     
     

4.3. **Atribuição de Ficha de Treino a Aluno**

Envie uma requisição PUT para /api/students/:studentId/assign-workout-plan com o ID da ficha de treino: 

    {
    "workoutPlanId": "650b8f2e4d8f2e4d8f2e4d8f"
    }
 
 

Receba a confirmação da atribuição: 

    {
      "message": "Ficha de treino atribuída com sucesso!"
    }
     
     
     

#### 5. **Considerações Finais**

Este backend foi projetado para ser modular, escalável e fácil de manter. Ele fornece uma base sólida para o desenvolvimento de funcionalidades adicionais, como gráficos de progresso, relatórios personalizados e integração com o frontend.

- Bernardo Villanova de Santana
- Rodrigo Carlos dos Santos Neto
