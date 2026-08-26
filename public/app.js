/**
 * CLIENTE PWA ACESSÍVEL - ASSISTENTE DE PERCEPÇÃO AMBIENTAL MULTI-AGENTE
 * Com Extração de Métricas de Pixels no Agente Local, Detecção de Fones, Roupas, Pessoas e Retorno Auditivo.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const cameraFeed = document.getElementById('camera-feed');
  const captureCanvas = document.getElementById('capture-canvas');
  const imagePlaceholder = document.getElementById('image-placeholder');
  const scanOverlay = document.getElementById('scan-overlay');
  const cameraStatusPill = document.getElementById('camera-status-pill');
  
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const btnCapture = document.getElementById('btn-capture');
  const btnDetectPerson = document.getElementById('btn-detect-person');
  const btnVoiceInput = document.getElementById('btn-voice-input');
  const btnSubmitQuestion = document.getElementById('btn-submit-question');
  const btnSpeakAgain = document.getElementById('btn-speak-again');
  const btnOpenTour = document.getElementById('btn-open-tour');
  const btnToggleAudio = document.getElementById('btn-toggle-audio');
  
  const inputQuestion = document.getElementById('input-question');
  const hazardAlertBox = document.getElementById('hazard-alert-box');
  const hazardList = document.getElementById('hazard-list');
  
  const humanDetectionBox = document.getElementById('human-detection-box');
  const badgeHumanStatus = document.getElementById('badge-human-status');
  const badgeProximity = document.getElementById('badge-proximity');
  const humanDetailsText = document.getElementById('human-details-text');
  
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const descriptionText = document.getElementById('description-text');
  const infoProvider = document.getElementById('info-provider');
  
  const assertiveAnnouncer = document.getElementById('aria-assertive-announcer');
  const politeAnnouncer = document.getElementById('aria-polite-announcer');

  // Elementos do Modal do Guia Passo a Passo
  const tourModal = document.getElementById('tour-modal');
  const tourSpotlight = document.getElementById('tour-spotlight');
  const tourStepBadge = document.getElementById('tour-step-badge');
  const tourStepTitle = document.getElementById('tour-step-title');
  const tourStepText = document.getElementById('tour-step-text');
  const tourIconBox = document.getElementById('tour-icon-box');
  
  const btnTourPrev = document.getElementById('btn-tour-prev');
  const btnTourNext = document.getElementById('btn-tour-next');
  const btnTourSpeak = document.getElementById('btn-tour-speak');
  const btnCloseTour = document.getElementById('btn-close-tour');

  let mediaStream = null;
  let currentSpeechText = '';
  let audioNavigationEnabled = true;

  /**
   * ==========================================================================
   * AGENTE LOCAL DE EXTRAÇÃO DE MÉTRICAS VISUAIS (PIXEL FEATURE EXTRACTOR)
   * ==========================================================================
   */
  function extractVisualPixelMetrics(canvas, ctx) {
    try {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return null;

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const totalPixels = width * height;

      let skinPixels = 0;
      let totalBrightness = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      let edgeCount = 0;

      // Amostragem rápida de pixels (passo de 4 pixels para performance)
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Brilho
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;

        rSum += r; gSum += g; bSum += b;

        // Regra heurística de detecção de tom de pele em RGB (Skin Detection Rules)
        const isSkin = (r > 95) && (g > 40) && (b > 20) &&
                       (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
                       (Math.abs(r - g) > 15) && (r > g) && (r > b);
        if (isSkin) skinPixels++;

        // Detecção de variação de borda rápida (fones, óculos, estampas)
        if (i > 16) {
          const prevR = data[i - 16];
          if (Math.abs(r - prevR) > 50) edgeCount++;
        }
      }

      const sampledPixels = totalPixels / 4;
      const skinRatio = skinPixels / sampledPixels;
      const edgeDensity = edgeCount / sampledPixels;
      const avgBrightness = totalBrightness / sampledPixels;

      // Determinador de cor dominante de vestuário
      const avgR = Math.round(rSum / sampledPixels);
      const avgG = Math.round(gSum / sampledPixels);
      const avgB = Math.round(bSum / sampledPixels);

      let clothingColor = 'escuro';
      if (avgR > 160 && avgG > 160 && avgB > 160) clothingColor = 'claro / branco';
      else if (avgR > avgG && avgR > avgB) clothingColor = 'vermelho / quente';
      else if (avgG > avgR && avgG > avgB) clothingColor = 'verde';
      else if (avgB > avgR && avgB > avgG) clothingColor = 'azul / frio';

      return {
        skinRatio: skinRatio,
        hasFaceCandidate: skinRatio > 0.08,
        headphoneCandidate: edgeDensity > 0.15,
        edgeDensity: edgeDensity,
        brightness: avgBrightness,
        dominantColors: [clothingColor]
      };
    } catch (e) {
      console.warn('Falha na extração local de métricas de pixels:', e);
      return null;
    }
  }

  /**
   * SINTETIZADOR DE EFETOS SONOROS (WEB AUDIO API)
   */
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playFocusSound() {
    if (!audioNavigationEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }

  function playClickSound() {
    if (!audioNavigationEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  function speakText(text, isNavigation = false) {
    if (!('speechSynthesis' in window)) return;
    if (isNavigation && !audioNavigationEnabled) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  btnToggleAudio.addEventListener('click', () => {
    audioNavigationEnabled = !audioNavigationEnabled;
    if (audioNavigationEnabled) {
      btnToggleAudio.classList.remove('muted');
      btnToggleAudio.classList.add('active');
      btnToggleAudio.innerHTML = '<span aria-hidden="true">🔊</span> Som de Navegação: ON';
      btnToggleAudio.setAttribute('aria-label', 'Alternar retorno de áudio de navegação. Status atual: Ativado');
      announcePolite('Sons de navegação ativados.');
      playClickSound();
      speakText('Sons de navegação e retorno audível ativados.', true);
    } else {
      btnToggleAudio.classList.remove('active');
      btnToggleAudio.classList.add('muted');
      btnToggleAudio.innerHTML = '<span aria-hidden="true">🔇</span> Som de Navegação: OFF';
      btnToggleAudio.setAttribute('aria-label', 'Alternar retorno de áudio de navegação. Status atual: Desativado');
      announcePolite('Sons de navegação desativados.');
      window.speechSynthesis.cancel();
    }
  });

  function attachAudioFeedbackToElements() {
    const interactiveElements = document.querySelectorAll('button, input, a, summary, [tabindex="0"]');

    interactiveElements.forEach(el => {
      el.addEventListener('focus', () => {
        playFocusSound();
        const label = el.getAttribute('data-audio-label') || el.getAttribute('aria-label') || el.innerText || el.placeholder;
        if (label) {
          speakText(label, true);
        }
      });

      el.addEventListener('click', () => {
        playClickSound();
      });
    });
  }

  attachAudioFeedbackToElements();

  /**
   * 1. Gerenciamento de Câmera em Alta Resolução (MediaDevices API)
   */
  async function startCamera() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920, max: 3840 }, 
          height: { ideal: 1080, max: 2160 } 
        },
        audio: false
      });
      cameraFeed.srcObject = mediaStream;
      cameraFeed.classList.remove('hidden');
      imagePlaceholder.classList.add('hidden');
      cameraStatusPill.textContent = '● Câmera Ativa';
      cameraStatusPill.style.color = 'var(--accent-success)';
      announcePolite('Câmera em alta resolução ativada.');
    } catch (err) {
      console.warn('Câmera indisponível ou permissão negada:', err);
      cameraStatusPill.textContent = '○ Câmera Inativa';
      cameraStatusPill.style.color = 'var(--accent-warning)';
      announceAssertive('Aviso: Não foi possível acessar a câmera do dispositivo.');
    }
  }

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
      cameraFeed.classList.add('hidden');
      imagePlaceholder.classList.remove('hidden');
      cameraStatusPill.textContent = '○ Câmera Inativa';
      cameraStatusPill.style.color = 'var(--text-muted)';
      announcePolite('Câmera desligada.');
    }
  }

  btnToggleCamera.addEventListener('click', () => {
    if (mediaStream) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  /**
   * 2. Captura de Frame de Imagem e Extração de Métricas de Pixels
   */
  function getCapturedImageWithMetrics() {
    return new Promise((resolve) => {
      let ctx;
      if (mediaStream && cameraFeed.videoWidth > 0) {
        captureCanvas.width = cameraFeed.videoWidth;
        captureCanvas.height = cameraFeed.videoHeight;
        ctx = captureCanvas.getContext('2d');
        ctx.drawImage(cameraFeed, 0, 0, captureCanvas.width, captureCanvas.height);
      } else {
        captureCanvas.width = 1280;
        captureCanvas.height = 720;
        ctx = captureCanvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = '#00f2fe';
        ctx.font = '36px sans-serif';
        ctx.fillText('Captura de Alta Resolução Multi-Agente', 300, 360);
      }

      // Extrai métricas visuais dos pixels no Agente Local
      const metrics = extractVisualPixelMetrics(captureCanvas, ctx);

      captureCanvas.toBlob((blob) => {
        resolve({ blob, metrics });
      }, 'image/jpeg', 0.95);
    });
  }

  /**
   * 3. Anúncios para Leitores de Tela (ARIA Live Regions)
   */
  function announcePolite(message) {
    politeAnnouncer.textContent = '';
    setTimeout(() => {
      politeAnnouncer.textContent = message;
    }, 50);
  }

  function announceAssertive(message) {
    assertiveAnnouncer.textContent = '';
    setTimeout(() => {
      assertiveAnnouncer.textContent = message;
    }, 50);
  }

  /**
   * 4. Reconhecimento de Voz no Cliente (Web Speech API STT)
   */
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;

    recognition.onstart = () => {
      announcePolite('Reconhecimento de voz ativado. Fale a sua dúvida sobre o ambiente.');
      btnVoiceInput.classList.add('active');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputQuestion.value = transcript;
      announcePolite(`Pergunta registrada por voz: ${transcript}`);
      btnVoiceInput.classList.remove('active');
    };

    recognition.onerror = () => {
      announcePolite('Não foi possível compreender o áudio. Tente novamente.');
      btnVoiceInput.classList.remove('active');
    };

    btnVoiceInput.addEventListener('click', () => {
      recognition.start();
    });
  } else {
    btnVoiceInput.disabled = true;
    btnVoiceInput.title = 'Reconhecimento de voz não suportado neste navegador.';
  }

  /**
   * 5. Fluxo de Análise Multi-Agente Efêmero no Middleware (Retenção Zero)
   */
  async function performEnvironmentalAnalysis(overrideQuestion) {
    btnCapture.disabled = true;
    btnDetectPerson.disabled = true;
    scanOverlay.classList.remove('hidden');
    statusIndicator.classList.add('loading');
    statusText.textContent = 'Orquestrando Agentes de Percepção (Pixels + VLM) em memória RAM...';
    announcePolite('Processando imagem com múltiplos agentes de visão. Por favor aguarde...');

    try {
      const { blob: imageBlob, metrics: visualFeatures } = await getCapturedImageWithMetrics();
      const question = overrideQuestion || inputQuestion.value.trim();

      const formData = new FormData();
      formData.append('image', imageBlob, 'capture.jpg');
      if (question) {
        formData.append('question', question);
      }
      if (visualFeatures) {
        formData.append('visualFeatures', JSON.stringify(visualFeatures));
      }

      const response = await fetch('/api/perceive', {
        method: 'POST',
        body: formData
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Falha no servidor middleware.');
      }

      const data = json.data;
      currentSpeechText = data.speechText || data.description;

      infoProvider.textContent = data.provider || 'Multi-Agente Híbrido';

      // Atualização do Painel de Detecção Humana e Acessórios
      if (data.humanDetected) {
        humanDetectionBox.classList.remove('hidden');
        badgeHumanStatus.textContent = '🧍 Pessoa Detectada: SIM';
        badgeHumanStatus.style.backgroundColor = 'var(--accent-purple)';
        badgeProximity.textContent = `📏 Proximidade: ${data.proximityEstimate || 'Aproximada'}`;
        humanDetailsText.textContent = data.humanDetails || 'Ser humano identificado com elementos básicos (roupa, acessórios e silhueta).';
      } else {
        humanDetectionBox.classList.remove('hidden');
        badgeHumanStatus.textContent = '👤 Pessoa Detectada: NÃO';
        badgeHumanStatus.style.backgroundColor = 'var(--bg-surface)';
        badgeProximity.textContent = `📏 Proximidade: ${data.proximityEstimate || 'Desobstruído'}`;
        humanDetailsText.textContent = 'Nenhuma pessoa identificada no caminho imediato.';
      }

      // Tratamento de Perigos e Riscos Físicos
      if (data.priority === 'HIGH' && data.hazards && data.hazards.length > 0) {
        hazardAlertBox.classList.remove('hidden');
        hazardList.innerHTML = '';
        data.hazards.forEach(hazard => {
          const li = document.createElement('li');
          li.textContent = hazard;
          hazardList.appendChild(li);
        });

        announceAssertive(`ALERTA DE SEGURANÇA! ${data.hazards.join(' ')}`);
        speakText(currentSpeechText);
      } else {
        hazardAlertBox.classList.add('hidden');
        announcePolite(`Percepção concluída: ${data.description}`);
        speakText(currentSpeechText);
      }

      descriptionText.textContent = data.description;
      statusText.textContent = 'Percepção concluída por Múltiplos Agentes (Dados descartados da RAM).';
      btnSpeakAgain.disabled = false;

    } catch (err) {
      console.error('Erro na requisição de percepção:', err);
      statusText.textContent = 'Erro no processamento.';
      descriptionText.textContent = `Ocorreu um erro: ${err.message}`;
      announceAssertive(`Erro ao analisar ambiente: ${err.message}`);
    } finally {
      scanOverlay.classList.add('hidden');
      statusIndicator.classList.remove('loading');
      btnCapture.disabled = false;
      btnDetectPerson.disabled = false;
    }
  }

  btnCapture.addEventListener('click', () => performEnvironmentalAnalysis());
  
  btnDetectPerson.addEventListener('click', () => {
    performEnvironmentalAnalysis('Examine em detalhes a pessoa, incluindo fones de ouvido, roupas, óculos e proximidade exata.');
  });

  btnSpeakAgain.addEventListener('click', () => {
    if (currentSpeechText) {
      speakText(currentSpeechText);
    }
  });

  btnSubmitQuestion.addEventListener('click', () => {
    performEnvironmentalAnalysis(inputQuestion.value.trim());
  });

  inputQuestion.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performEnvironmentalAnalysis(inputQuestion.value.trim());
    }
  });

  /**
   * 6. MODO GUIA PASSO A PASSO INTERATIVO
   */
  const tourSteps = [
    {
      step: 1,
      badge: 'Passo 1 de 5',
      title: 'Bem-vindo e Privacidade de Dados',
      icon: '🔒',
      targetId: 'main-content',
      text: 'Bem-vindo ao Assistente de Percepção Ambiental Multi-Agente! Este sistema utiliza Inteligência Artificial e agentes múltiplos para descrever o ambiente e alertar sobre perigos físicos em tempo real. Importante: suas imagens e áudios são processados exclusivamente na memória RAM e descartados imediatamente, garantindo Retenção Zero de Dados.'
    },
    {
      step: 2,
      badge: 'Passo 2 de 5',
      title: 'Captura da Câmera e Análise de Pixels',
      icon: '📷',
      targetId: 'section-capture',
      text: 'Nesta seção você tem a visualização em tempo real da câmera. Aponte a câmera do dispositivo para a direção em que deseja andar. Clique em "Detectar Pessoas" ou "Analisar Ambiente Agora" (Atalho Alt + A) para acionar a leitura dos agentes.'
    },
    {
      step: 3,
      badge: 'Passo 3 de 5',
      title: 'Pergunta por Voz ou Texto',
      icon: '🎙️',
      targetId: 'section-question',
      text: 'Se você tiver uma dúvida específica sobre o ambiente à frente (como: "Há pessoas perto?", "Estou vendo alguém com fone?", "Há algum degrau?"), você pode clicar no botão do microfone para ditar sua pergunta por voz ou digitar no campo de texto.'
    },
    {
      step: 4,
      badge: 'Passo 4 de 5',
      title: 'Descrição Multi-Agente e Retorno Auditivo',
      icon: '🔊',
      targetId: 'section-result',
      text: 'Assim que a análise for concluída, os agentes identificarão se há pessoas, roupas, fones de ouvido, óculos e estimarão a distância em metros, lendo a instrução em voz alta automaticamente.'
    },
    {
      step: 5,
      badge: 'Passo 5 de 5',
      title: 'Atalhos de Teclado Rápidos',
      icon: '⌨️',
      targetId: 'main-content',
      text: 'Você pode controlar a aplicação rapidamente pelo teclado a qualquer momento: pressione Alt + G para abrir este guia passo a passo, Alt + A para analisar o ambiente, Alt + P para detectar pessoas, e Alt + R para repetir o último áudio de descrição.'
    }
  ];

  let currentTourStepIndex = 0;

  function updateTourStep(index) {
    if (index < 0 || index >= tourSteps.length) return;
    
    currentTourStepIndex = index;
    const stepData = tourSteps[index];

    tourStepBadge.textContent = stepData.badge;
    tourStepTitle.textContent = stepData.title;
    tourIconBox.textContent = stepData.icon;
    tourStepText.textContent = stepData.text;

    btnTourPrev.disabled = index === 0;
    if (index === tourSteps.length - 1) {
      btnTourNext.textContent = 'Concluir Guia ✓';
    } else {
      btnTourNext.textContent = 'Próximo →';
    }

    const targetEl = document.getElementById(stepData.targetId);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      tourSpotlight.style.top = `${window.scrollY + rect.top - 8}px`;
      tourSpotlight.style.left = `${window.scrollX + rect.left - 8}px`;
      tourSpotlight.style.width = `${rect.width + 16}px`;
      tourSpotlight.style.height = `${rect.height + 16}px`;
      tourSpotlight.classList.remove('hidden');

      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      tourSpotlight.classList.add('hidden');
    }

    speakText(`${stepData.title}. ${stepData.text}`);
    announcePolite(`Guia passo ${index + 1}: ${stepData.title}`);
  }

  function openTour() {
    tourModal.classList.remove('hidden');
    updateTourStep(0);
  }

  function closeTour() {
    tourModal.classList.add('hidden');
    tourSpotlight.classList.add('hidden');
    window.speechSynthesis.cancel();
    announcePolite('Guia passo a passo fechado.');
  }

  btnOpenTour.addEventListener('click', openTour);
  btnCloseTour.addEventListener('click', closeTour);
  btnTourSpeak.addEventListener('click', () => {
    const stepData = tourSteps[currentTourStepIndex];
    speakText(`${stepData.title}. ${stepData.text}`);
  });

  btnTourNext.addEventListener('click', () => {
    if (currentTourStepIndex < tourSteps.length - 1) {
      updateTourStep(currentTourStepIndex + 1);
    } else {
      closeTour();
    }
  });

  btnTourPrev.addEventListener('click', () => {
    if (currentTourStepIndex > 0) {
      updateTourStep(currentTourStepIndex - 1);
    }
  });

  /**
   * 7. ATALHOS GLOBAIS DE TECLADO
   * - Alt + G: Abrir Guia Passo a Passo
   * - Alt + A: Analisar Ambiente
   * - Alt + P: Detectar Pessoas
   * - Alt + R: Repetir Áudio
   */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tourModal.classList.contains('hidden')) {
      closeTour();
      return;
    }

    if (e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'g') {
        e.preventDefault();
        openTour();
      } else if (key === 'a') {
        e.preventDefault();
        performEnvironmentalAnalysis();
      } else if (key === 'p') {
        e.preventDefault();
        performEnvironmentalAnalysis('Examine em detalhes se há qualquer ser humano, pessoa ou rosto à minha frente, mesmo que em close-up. A qual distância exata?');
      } else if (key === 'r') {
        e.preventDefault();
        if (currentSpeechText) speakText(currentSpeechText);
      }
    }
  });

  // Inicialização da Câmera
  startCamera();

  // Registrar Service Worker para PWA Offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Registro de ServiceWorker em dev:', err);
    });
  }
});
