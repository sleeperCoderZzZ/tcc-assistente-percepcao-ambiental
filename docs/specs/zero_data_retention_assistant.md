# Especificação de Funcionalidade: Assistente de Percepção Ambiental com Retenção Zero de Dados

**Status:** Rascunho para revisão  
**Contexto:** Trabalho de Conclusão de Curso (TCC) — *Assistente de Percepção Ambiental Baseado em Inteligência Artificial para Pessoas com Deficiência Visual: Uma Arquitetura Web de Retenção Zero de Dados*

---

## 1. Resumo Executivo

Um assistente web multimodal que permite a uma pessoa com deficiência visual capturar uma foto do ambiente (ou fazer uma pergunta por voz) e receber, em segundos, uma descrição falada e acessível do que está à sua frente. A imagem e o áudio nunca tocam disco: trafegam apenas em memória RAM volátil no middleware, sendo descartados imediatamente após a inferência. O sistema é desenhado para ser auditável (retenção zero é uma garantia arquitetural, não uma política) e para funcionar com qualquer provedor de VLM (Visual Language Model) via Factory Pattern.

---

## 2. Cenários de Usuário e Testes

### Cenário principal (fluxo feliz)
1. O usuário abre a PWA em um leitor de tela (VoiceOver/TalkBack/NVDA).
2. O usuário aciona a captura de câmera por gesto/atalho de teclado anunciado via `aria-live`.
3. O sistema captura um frame, envia via `FormData` sobre HTTPS.
4. O middleware recebe o buffer em memória (`multer.memoryStorage()`), encaminha ao provedor de IA ativo (Mock ou Gemini), recebe a descrição textual.
5. O middleware descarta o buffer da imagem imediatamente após o envio à IA (antes mesmo de retornar a resposta ao cliente).
6. O cliente recebe o texto, converte em fala via TTS e anuncia por região `aria-live="assertive"`.

### Cenário alternativo — pergunta por voz sobre a cena
1. O usuário grava um áudio com uma pergunta ("o que tem na minha frente?", "essa embalagem é de quê?").
2. O áudio (STT) e a imagem mais recente são enviados juntos.
3. O provedor de IA responde considerando a pergunta + a imagem.
4. Buffers de áudio e imagem são descartados da RAM após a chamada.

### Cenários de borda
- Falha de rede durante upload → cliente anuncia erro por voz, sem travar a interface, sem persistir nada localmente além do necessário para retry imediato.
- Provedor de IA indisponível/timeout → fallback ou mensagem de erro acessível; nenhum buffer deve ficar retido em memória além do timeout configurado.
- Imagem sem conteúdo interpretável (ex.: tampa da lente, ambiente totalmente escuro) → resposta explícita informando a limitação, não uma alucinação do modelo.
- Requisição maliciosa/arquivo malformado → middleware rejeita antes de instanciar o provedor de IA.

### Critérios de aceitação (dado/quando/então)
- **Dado** um frame capturado, **quando** o middleware processa a requisição, **então** nenhum arquivo de mídia é escrito em disco em nenhum momento do ciclo de vida da requisição.
- **Dado** uma resposta da IA recebida, **quando** o middleware monta o payload de retorno, **então** o buffer original da mídia já foi dereferenciado/limpo (verificável via teste de memória).
- **Dado** um usuário navegando com leitor de tela, **quando** uma nova descrição chega, **então** ela é anunciada automaticamente sem exigir foco manual do usuário.
- **Dado** a troca do provedor de IA (Mock → Gemini) via configuração, **quando** o `AIServiceFactory` é chamado, **então** nenhuma mudança de código é necessária no middleware ou no cliente.

---

## 3. Requisitos Funcionais

- **RF-001**: O sistema DEVE permitir captura de imagem via `MediaDevices API` (câmera do dispositivo).
- **RF-002**: O sistema DEVE permitir entrada de voz (STT) para perguntas contextuais sobre a cena capturada.
- **RF-003**: O sistema DEVE converter a resposta da IA em áudio (TTS) e reproduzi-la automaticamente.
- **RF-004**: O sistema DEVE anunciar mudanças de estado (carregando, sucesso, erro) via regiões `aria-live` apropriadas (`polite` para status, `assertive` para resultados/erros).
- **RF-005**: O middleware DEVE processar toda mídia recebida exclusivamente em memória volátil (`multer.memoryStorage()` ou equivalente), sem escrita em disco, banco de dados ou cache persistente.
- **RF-006**: O middleware DEVE descartar (dereferenciar) o buffer de mídia imediatamente após o envio ao provedor de IA, independentemente de sucesso ou falha da chamada.
- **RF-007**: O sistema DEVE instanciar provedores de IA exclusivamente através do `AIServiceFactory`, sem acoplamento direto do middleware a uma implementação concreta.
- **RF-008**: O sistema DEVE suportar múltiplos provedores de IA (no mínimo: `MockPerceptionProvider` para testes offline e `GeminiPerceptionProvider` para inferência real), todos implementando a mesma interface abstrata (`baseProvider`).
- **RF-009**: A interface web DEVE estar em conformidade com WCAG 2.1, nível AA como piso e AAA como meta em componentes críticos (contraste, navegação por teclado, foco visível).
- **RF-010**: O sistema DEVE expor uma suíte de testes automatizados que valide (a) retenção zero de dados e (b) comportamento correto da fábrica de provedores.

## 4. Requisitos Não Funcionais

- **RNF-001 (Privacidade/Segurança)**: Nenhuma imagem ou áudio de usuário pode ser persistido em disco, log, banco de dados ou serviço de terceiros além do provedor de IA estritamente necessário para a inferência da requisição corrente.
- **RNF-002 (Auditabilidade)**: A garantia de retenção zero deve ser verificável por teste automatizado, não apenas por documentação.
- **RNF-003 (Latência)**: O ciclo captura → resposta falada deve ser perceptivelmente rápido para uso em tempo real (meta sugerida: p95 < 3–5s, a validar conforme provedor de IA escolhido).
- **RNF-004 (Acessibilidade)**: Compatibilidade comprovada com VoiceOver, TalkBack e NVDA.
- **RNF-005 (Extensibilidade)**: Adicionar um novo provedor de IA deve exigir apenas uma nova classe concreta + registro na fábrica, sem alterar contratos existentes.
- **RNF-006 (Portabilidade)**: Node.js ≥ 18.0.0; sem dependências pesadas externas fora do necessário.

## 5. Entidades-Chave

- **MediaBuffer (efêmero)**: Representação em memória de uma imagem/áudio capturado. Nunca serializado em disco. Ciclo de vida limitado à requisição HTTP.
- **PerceptionRequest**: Agrupa o(s) `MediaBuffer` da requisição + contexto opcional (pergunta em texto/STT).
- **PerceptionResponse**: Descrição textual gerada pela IA, destinada à conversão em TTS.
- **AIProvider (interface abstrata)**: Contrato comum implementado por `MockPerceptionProvider` e `GeminiPerceptionProvider`.
- **AIServiceFactory**: Componente responsável por resolver, em tempo de execução, qual `AIProvider` instanciar, com base em configuração (ex.: variável de ambiente).

## 6. Fora de Escopo (nesta versão)

- Armazenamento de histórico de interações do usuário (por definição, incompatível com retenção zero).
- Autenticação/contas de usuário.
- Suporte offline completo (funcionamento sem conexão com o provedor de IA).
- Provedores de IA além de Mock e Gemini (podem ser adicionados depois via Factory, mas não fazem parte do escopo inicial).

## 7. Restrições e Premissas

- O provedor de IA real (Gemini) é externo e está fora do perímetro de retenção zero controlado por este sistema — a garantia cobre o middleware e o cliente, não a política de retenção do provedor terceiro (deve ser documentado como limitação conhecida no TCC).
- Ambiente de desenvolvimento e execução: Node.js + Express no middleware; PWA no cliente.
- O `MockPerceptionProvider` deve ser suficiente para rodar toda a suíte de testes e demonstrações sem dependência de rede ou chave de API.

## 8. Métricas de Sucesso

- 100% dos testes de retenção de memória passam (nenhum buffer sobrevive além do ciclo da requisição).
- Suíte de testes automatizados cobre: fábrica de provedores (troca de implementação sem alteração de contrato), retenção zero, e pelo menos os cenários de borda listados na Seção 2.
- Interface validada com pelo menos um leitor de tela real (não apenas checagem automática de acessibilidade).

---

## Referências ao código-fonte (arquitetura atual)

- Interface abstrata: `server/services/providers/baseProvider.js`
- Provedor Mock: `server/services/providers/mockProvider.js`
- Provedor Gemini: `server/services/providers/geminiProvider.js`
- Fábrica de serviços: `server/patterns/aiServiceFactory.js`
- Documentação acadêmica completa (fundamentação teórica, cronograma, metodologia): `docs/TCC_PROPOSAL.md`
