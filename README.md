# Assistente de Percepção Ambiental com Retenção Zero de Dados

> **Trabalho de Conclusão de Curso (TCC)**  
> **Tema:** ASSISTENTE DE PERCEPÇÃO AMBIENTAL BASEADO EM INTELIGÊNCIA ARTIFICIAL PARA PESSOAS COM DEFICIÊNCIA VISUAL: UMA ARQUITETURA WEB DE RETENÇÃO ZERO DE DADOS

---

## 📌 Visão Geral
Este repositório contém a arquitetura de referência e a implementação do assistente de percepção ambiental voltado a pessoas com deficiência visual. O sistema é composto por:

1. **Cliente Progressive Web App (PWA)**: Interface web acessível em conformidade com as diretrizes **WCAG 2.1 (AA/AAA)**, suporte a leitores de tela (VoiceOver, TalkBack, NVDA), regiões ativas `aria-live`, reconhecimento de voz (STT) e resposta audível por síntese de voz (TTS).
2. **Middleware Node.js de Retenção Zero de Dados**: Servidor intermediário que manipula mídias (imagens e áudios) **exclusivamente em memória RAM volátil** (`multer.memoryStorage()`), descartando imediatamente os buffers após o envio para inferência de Inteligência Artificial.
3. **Padrão de Projeto Factory (`AIServiceFactory`)**: Padrão de projeto responsável pela instanciação desacoplada de provedores de Visão e Linguagem (VLM) e modelos de percepção (Mock, Gemini VLM, etc.).

---

## 🏛️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                 1. Cliente (PWA Acessível)                   │
│  - Captura de Câmera / Áudio (MediaDevices API)             │
│  - Síntese de Voz (TTS) / Reconhecimento de Voz (STT)       │
│  - Anúncios de Leitores de Tela (aria-live assertive/polite) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / FormData (em memória)
┌──────────────────────────────▼──────────────────────────────┐
│            2. Middleware (Node.js & Express)                │
│  - Retenção Zero: multer.memoryStorage()                    │
│  - EphemeralMediaProcessor (Limpeza automática de RAM)      │
│  - Factory Pattern (AIServiceFactory)                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ Buffer de Mídia em Memória Volátil
┌──────────────────────────────▼──────────────────────────────┐
│           3. Provedores de IA Multimodal (VLM)               │
│  - MockPerceptionProvider (Testes Offline/Estresse)        │
│  - GeminiPerceptionProvider (VLM em Tempo Real)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Padrão de Projeto: Factory Pattern (`AIServiceFactory`)

A instanciação das classes dos provedores de Inteligência Artificial segue rigorosamente o **Factory Design Pattern**:

- **Interface Abstrata**: [`server/services/providers/baseProvider.js`](file:///home/cabral/.gemini/antigravity/scratch/tcc-assistente-percepcao-ambiental/server/services/providers/baseProvider.js)
- **Provedor Mock Concreto**: [`server/services/providers/mockProvider.js`](file:///home/cabral/.gemini/antigravity/scratch/tcc-assistente-percepcao-ambiental/server/services/providers/mockProvider.js)
- **Provedor Gemini Concreto**: [`server/services/providers/geminiProvider.js`](file:///home/cabral/.gemini/antigravity/scratch/tcc-assistente-percepcao-ambiental/server/services/providers/geminiProvider.js)
- **Fábrica de Serviços**: [`server/patterns/aiServiceFactory.js`](file:///home/cabral/.gemini/antigravity/scratch/tcc-assistente-percepcao-ambiental/server/patterns/aiServiceFactory.js)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: v18.0.0 ou superior

### Passos

1. Entre no diretório do projeto:
```bash
cd /home/cabral/.gemini/antigravity/scratch/tcc-assistente-percepcao-ambiental
```

2. Instale as dependências (sem dependências pesadas externas):
```bash
npm install
```

3. Copie as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Execute o servidor em modo de desenvolvimento ou produção:
```bash
npm start
```

5. Acesse no navegador:
```text
http://localhost:3000
```

---

## 🧪 Testes Automatizados

Para rodar a suíte de testes de retenção de memória e fábrica de IA:

```bash
npm test
```

---

## 📑 Documentação do TCC

A proposta oficial completa, fundamentação teórica, justificativa, estado da arte, cronograma de 10 meses e metodologia acadêmica podem ser consultadas em:

👉 [`docs/TCC_PROPOSAL.md`](file:///home/cabral/.gemini/antigravity/scratch/tcc-assistente-percepcao-ambiental/docs/TCC_PROPOSAL.md)
