# ASSISTENTE DE PERCEPÇÃO AMBIENTAL BASEADO EM INTELIGÊNCIA ARTIFICIAL PARA PESSOAS COM DEFICIÊNCIA VISUAL: UMA ARQUITETURA WEB DE RETENÇÃO ZERO DE DADOS

**PROJETO DE TRABALHO DE CONCLUSÃO DE CURSO (TCC)**

---

## 1. INTRODUÇÃO

### 1.1 Contextualização e justificativa
A autonomia de pessoas com deficiência visual tem sido mediada por tecnologias de hardware e software que, com o advento dos Modelos de Visão e Linguagem (Vision-Language Models — VLMs), passaram por uma significativa evolução. A capacidade desses modelos de interpretar informações visuais e transformá-las em descrições semânticas possibilita uma nova forma de compreensão do ambiente ao redor do usuário.

Entretanto, a utilização dessas ferramentas de Inteligência Artificial também apresenta desafios éticos, técnicos e legais relacionados ao tratamento de dados. A captura de imagens e áudios pode envolver informações pessoais e sensíveis do próprio usuário e de terceiros presentes no ambiente. Dessa forma, o armazenamento, o registro ou a retenção indevida desses dados podem representar riscos relacionados à privacidade e à proteção das informações.

Diante desse cenário, o presente Trabalho de Conclusão de Curso (TCC) propõe o desenvolvimento de um Assistente de Percepção Ambiental por meio de uma interface baseada em Progressive Web App (PWA). A proposta concentra-se na implementação de uma arquitetura orientada ao princípio de retenção zero de dados, buscando reduzir a persistência de arquivos de mídia durante o processamento.

A arquitetura proposta deverá processar imagens e áudios exclusivamente em memória volátil, utilizando um servidor intermediário (middleware) responsável pela orquestração das requisições. Após a realização da inferência pelos serviços de Inteligência Artificial, os dados deverão ser descartados, evitando o armazenamento persistente dos arquivos no servidor da aplicação.

Dessa maneira, o projeto busca conciliar acessibilidade, Inteligência Artificial e privacidade, aplicando princípios de Privacy by Design, nos quais a proteção dos dados é considerada como parte da própria arquitetura do sistema.

---

## 2. INEDITISMO E ANÁLISE DO ESTADO DA ARTE

### 2.1 Tendência da indústria para retenção zero de dados
O avanço da Inteligência Artificial generativa tem ampliado as discussões relacionadas à privacidade e à retenção de dados. Grandes fornecedores de serviços de IA vêm desenvolvendo mecanismos voltados à redução da retenção de informações, especialmente em contextos corporativos e aplicações que processam dados potencialmente sensíveis.

A proposta deste projeto busca aplicar esse princípio diretamente na arquitetura da aplicação. Dessa forma, a segurança não dependerá exclusivamente das políticas de retenção adotadas por fornecedores externos, mas também de mecanismos implementados no próprio middleware, buscando impedir a persistência desnecessária de arquivos de imagem e áudio.

O processamento será estruturado para que os arquivos recebidos sejam manipulados temporariamente em memória, sendo descartados após a conclusão do fluxo de processamento.

### 2.2 Soluções comerciais focadas em privacidade
A análise preliminar do mercado identificou a existência de soluções voltadas à assistência de pessoas com deficiência visual e à interpretação do ambiente por meio de Inteligência Artificial. Algumas dessas soluções também apresentam preocupações relacionadas à privacidade, ao processamento efêmero e à redução do armazenamento de dados.

Entretanto, grande parte dessas ferramentas está disponível principalmente como aplicativos móveis nativos e, em muitos casos, utiliza arquiteturas proprietárias e de código fechado. Essa característica limita a possibilidade de estudar, reproduzir ou adaptar suas soluções arquiteturais em contextos acadêmicos e de pesquisa.

A presente proposta diferencia-se ao investigar a utilização de uma arquitetura baseada em tecnologias web, permitindo o acesso por meio de uma Progressive Web App e reduzindo a necessidade de instalação de aplicativos específicos.

### 2.3 Fator de inovação acadêmica
O principal fator de inovação do projeto está relacionado à combinação de tecnologias e práticas de engenharia de software voltadas simultaneamente à acessibilidade, à Inteligência Artificial multimodal e à privacidade.

A proposta busca integrar, em uma arquitetura única:
- **a)** acesso multiplataforma por meio de uma Progressive Web App (PWA);
- **b)** processamento temporário de arquivos de mídia utilizando buffers em memória RAM;
- **c)** utilização de mecanismos de armazenamento em memória, como o `multer.memoryStorage()`, em aplicações desenvolvidas com Node.js;
- **d)** descarte dos dados após o processamento das requisições;
- **e)** utilização de infraestrutura baseada em contêineres e serviços sem servidor ou gerenciados, como AWS Fargate;
- **f)** integração com serviços de reconhecimento de fala, interpretação de imagens e conversão de texto em fala;
- **g)** aplicação de princípios de Privacy by Design durante a concepção da arquitetura;
- **h)** uso de padrões de projeto (*Design Patterns*), como o **Factory Pattern**, para desacoplar e isolar o consumo dos provedores de IA.

Dessa forma, o projeto propõe inovação não apenas na utilização de Inteligência Artificial para descrição do ambiente, mas principalmente na investigação de uma arquitetura de software capaz de oferecer esse serviço reduzindo a retenção de dados durante o processamento.

---

## 3. OBJETIVOS

### 3.1 Objetivo geral
Conceber, implementar e validar uma arquitetura de software baseada em Progressive Web App e serviços de processamento em nuvem para um assistente ambiental multimodal baseado em Inteligência Artificial, buscando garantir o processamento de imagens e áudios em tempo real com retenção mínima ou inexistente de dados no servidor intermediário.

### 3.2 Objetivos específicos
Para alcançar o objetivo geral, pretende-se:
- **a)** desenvolver uma interface Progressive Web App compatível com recursos de acessibilidade e leitores de tela, como VoiceOver e TalkBack;
- **b)** aplicar as recomendações de acessibilidade previstas nas diretrizes WCAG 2.1, considerando os níveis de conformidade AA e, quando tecnicamente viável, AAA;
- **c)** implementar um backend em Node.js responsável pela orquestração das requisições e pelo processamento temporário de arquivos de mídia em memória volátil;
- **d)** implementar mecanismos para reduzir riscos relacionados ao consumo excessivo de memória durante o processamento de arquivos;
- **e)** integrar serviços de Inteligência Artificial para reconhecimento de fala (Speech-to-Text), interpretação visual e geração de respostas textuais;
- **f)** integrar mecanismos de conversão de texto em fala (Text-to-Speech), permitindo que as informações processadas sejam apresentadas ao usuário de forma audível;
- **g)** priorizar, por meio da lógica de processamento e das instruções fornecidas aos modelos de Inteligência Artificial, a identificação de situações potencialmente perigosas no ambiente;
- **h)** investigar técnicas de transmissão contínua de dados, incluindo o uso de streaming e transferência em partes (*chunked transfer*), com o objetivo de reduzir a percepção de latência;
- **i)** validar o funcionamento da arquitetura por meio de testes técnicos, testes de desempenho e avaliações de acessibilidade.

---

## 4. ARQUITETURA E ENGENHARIA DE SOFTWARE

### 4.1 Modelagem de requisitos e casos de uso
A interação do usuário com o sistema será baseada em fluxos simples, priorizando comandos de voz e elementos de interface acessíveis. O usuário deverá ser capaz de capturar informações do ambiente, realizar perguntas relacionadas à imagem analisada e receber respostas em formato audível.

Entre os principais casos de uso previstos estão:
- **a)** capturar uma imagem do ambiente;
- **b)** enviar uma solicitação de análise;
- **c)** realizar perguntas relacionadas ao ambiente;
- **d)** receber uma descrição contextualizada;
- **e)** receber alertas relacionados a possíveis obstáculos ou situações de risco;
- **f)** ouvir a resposta gerada pelo sistema;
- **g)** garantir o descarte dos dados temporários utilizados durante o processamento.

A restrição de privacidade estará presente em todo o fluxo do sistema. Sempre que uma imagem ou um áudio for enviado para processamento, os arquivos deverão ser mantidos temporariamente em memória e descartados após a conclusão da requisição, respeitando as limitações técnicas da infraestrutura e dos serviços externos utilizados.

A identificação de riscos ambientais será tratada como uma prioridade no processamento. Dessa forma, quando forem detectados elementos potencialmente perigosos, como obstáculos, desníveis ou outros riscos físicos, a resposta deverá priorizar essas informações em relação a descrições meramente estéticas ou secundárias.

### 4.2 Design arquitetural e fluxo de dados
A arquitetura do sistema será organizada em três camadas principais: cliente, middleware e provedores de Inteligência Artificial.

#### 4.2.1 Camada do cliente
A camada do cliente será composta por uma Progressive Web App, responsável pela interação direta com o usuário.
A aplicação deverá permitir a captura de imagens e, quando necessário, de áudio por meio dos recursos disponibilizados pelo dispositivo. Os dados serão enviados utilizando protocolos seguros, como HTTPS.
A interface será projetada priorizando a navegação por leitores de tela, comandos simples e retorno auditivo das informações processadas.

#### 4.2.2 Camada de middleware
O middleware será responsável por receber as requisições provenientes da PWA e coordenar a comunicação com os serviços de Inteligência Artificial.
O servidor será desenvolvido utilizando tecnologias do ecossistema Node.js e poderá ser executado em contêineres. Os arquivos enviados deverão ser manipulados temporariamente em memória, evitando o armazenamento persistente em disco durante o fluxo normal de processamento.

As principais responsabilidades do middleware serão:
- **a)** receber arquivos de imagem e áudio;
- **b)** validar o tamanho e o formato dos arquivos;
- **c)** manter os dados temporariamente em memória;
- **d)** encaminhar as informações aos serviços de Inteligência Artificial através de um padrão **Factory (`AIServiceFactory`)**;
- **e)** receber e processar as respostas;
- **f)** encaminhar a resposta ao usuário;
- **g)** descartar os dados temporários após o processamento.

#### 4.2.3 Camada de provedores de Inteligência Artificial
A terceira camada será composta pelos serviços responsáveis pelo processamento multimodal.

O fluxo poderá envolver:
- **a)** conversão de áudio em texto, quando o usuário realizar perguntas por voz;
- **b)** interpretação da imagem por modelos de visão computacional ou modelos multimodais;
- **c)** geração de uma resposta textual contextualizada;
- **d)** priorização de alertas relacionados à segurança;
- **e)** conversão da resposta textual em áudio;
- **f)** transmissão do áudio para a aplicação cliente.

O áudio gerado poderá ser transmitido de forma contínua, utilizando técnicas de streaming, permitindo que o usuário receba partes da resposta antes da conclusão completa da transmissão.

---

## 5. METODOLOGIA DE DESENVOLVIMENTO
O desenvolvimento do projeto será realizado por meio de uma abordagem aplicada e experimental, combinando atividades de pesquisa bibliográfica, projeto arquitetural, implementação de software e validação técnica.

Inicialmente, será realizada uma revisão bibliográfica sobre os seguintes temas:
- **a)** acessibilidade digital para pessoas com deficiência visual;
- **b)** diretrizes WCAG;
- **c)** Inteligência Artificial multimodal;
- **d)** modelos de visão e linguagem;
- **e)** proteção e tratamento de dados;
- **f)** princípios de Privacy by Design;
- **g)** arquiteturas baseadas em nuvem;
- **h)** Progressive Web Apps.

Após a fundamentação teórica, será realizada a modelagem da solução por meio da definição de requisitos funcionais e não funcionais, diagramas UML e especificação da arquitetura de software.

A etapa seguinte consistirá no desenvolvimento da Progressive Web App e do servidor middleware. Posteriormente, serão realizadas as integrações com os serviços de Inteligência Artificial.

A validação da proposta deverá considerar aspectos como:
- **a)** tempo de resposta do sistema;
- **b)** consumo de memória;
- **c)** comportamento da aplicação sob múltiplas requisições;
- **d)** funcionamento do descarte temporário dos dados;
- **e)** acessibilidade da interface;
- **f)** capacidade de identificação e comunicação de riscos ambientais.

Os resultados obtidos serão analisados e utilizados para avaliar a viabilidade da arquitetura proposta, suas limitações e possíveis possibilidades de evolução.

---

## 6. CRONOGRAMA DE DESENVOLVIMENTO

| Etapa | Período estimado | Foco acadêmico | Foco de engenharia de software |
|---|---|---|---|
| **1** | Mês 1 | Submissão do anteprojeto e revisão bibliográfica sobre acessibilidade visual, WCAG 2.1 e modelos multimodais. | Definição da stack técnica, prototipação e elaboração de wireframes da PWA. |
| **2** | Mês 2 | Redação da introdução e estudo sobre proteção de dados e tratamento de informações potencialmente sensíveis. | Configuração do repositório e desenvolvimento da estrutura inicial da PWA. |
| **3** | Mês 3 | Desenvolvimento da fundamentação teórica e análise de trabalhos relacionados. | Implementação inicial do middleware em Node.js e configuração do processamento de arquivos em memória. |
| **4** | Mês 4 | Formalização da metodologia e documentação dos diagramas do sistema. | Integração inicial com APIs de reconhecimento de fala e interpretação visual via Factory Pattern. |
| **5** | Mês 5 | Revisão teórica e validação metodológica com o orientador. | Otimização de latência, implementação de streaming e integração com Text-to-Speech. |
| **6** | Mês 6 | Banca de qualificação e definição dos procedimentos para validação do sistema. | Conteinerização da aplicação e estruturação das variáveis de ambiente. |
| **7** | Mês 7 | Redação do capítulo de implementação e documentação da arquitetura. | Implantação da infraestrutura em nuvem e avaliação de mecanismos de escalabilidade. |
| **8** | Mês 8 | Análise dos resultados obtidos durante os testes técnicos e de acessibilidade. | Execução de testes de estresse de memória e testes com leitores de tela. |
| **9** | Mês 9 | Elaboração das considerações finais, revisão das limitações e preparação do abstract. | Congelamento do escopo do sistema e correção de falhas identificadas durante os testes. |
| **10** | Mês 10 | Revisão final, adequação às normas institucionais e entrega da versão consolidada da monografia. | Monitoramento da infraestrutura e realização de ensaios técnicos para a apresentação do TCC. |

---

## 7. RESULTADOS ESPERADOS
Espera-se que o desenvolvimento deste trabalho resulte em uma arquitetura funcional capaz de auxiliar pessoas com deficiência visual na percepção e interpretação do ambiente por meio de recursos de Inteligência Artificial multimodal.

Como resultado, pretende-se obter uma Progressive Web App acessível, capaz de capturar informações visuais e auditivas, encaminhá-las para processamento e fornecer respostas de forma audível.

Do ponto de vista técnico, espera-se demonstrar a viabilidade da utilização de uma arquitetura baseada no processamento temporário de arquivos em memória, reduzindo a necessidade de armazenamento persistente de imagens e áudios no servidor intermediário.

Também se espera avaliar o impacto dessa abordagem sobre aspectos como consumo de memória, desempenho, escalabilidade e tempo de resposta.

Do ponto de vista acadêmico, o trabalho pretende contribuir para a discussão sobre a aplicação de princípios de privacidade desde a concepção de sistemas baseados em Inteligência Artificial, especialmente em aplicações que processam dados visuais e auditivos potencialmente sensíveis.

---

## 8. CONSIDERAÇÕES FINAIS
A proposta apresentada busca integrar três áreas de crescente relevância: acessibilidade digital, Inteligência Artificial multimodal e privacidade de dados.

O desenvolvimento de um assistente ambiental para pessoas com deficiência visual pode contribuir para ampliar a autonomia dos usuários na interpretação de diferentes ambientes. Entretanto, a utilização de imagens e áudios exige atenção especial à forma como esses dados são processados.

Nesse contexto, a arquitetura de retenção zero ou retenção mínima de dados surge como um dos principais diferenciais do projeto. A proposta busca investigar mecanismos capazes de reduzir a persistência de informações, utilizando processamento temporário em memória e descarte dos dados após a execução das inferências.

Dessa forma, o Trabalho de Conclusão de Curso pretende não apenas desenvolver uma aplicação funcional, mas também investigar uma abordagem arquitetural que possa servir como referência para o desenvolvimento de sistemas de Inteligência Artificial orientados simultaneamente à acessibilidade, ao desempenho e à privacidade.

---

## REFERÊNCIAS
- WORLD WIDE WEB CONSORTIUM. **Web Content Accessibility Guidelines (WCAG) 2.1**. [S. l.]: W3C, 2018.
- BRASIL. **Lei nº 13.709, de 14 de agosto de 2018**. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018.
- GAMMA, E. et al. **Design Patterns: Elements of Reusable Object-Oriented Software**. Addison-Wesley, 1994. *(Referência para o Factory Pattern)*.
- PUBLICAÇÕES CIENTÍFICAS SOBRE INTELIGÊNCIA ARTIFICIAL MULTIMODAL, modelos de visão e linguagem, acessibilidade digital, Privacy by Design, arquiteturas em nuvem e processamento de dados efêmeros.
