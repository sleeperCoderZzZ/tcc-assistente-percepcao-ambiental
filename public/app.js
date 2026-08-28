/**
 * CLIENTE PWA — ASSISTENTE DE PERCEPÇÃO AMBIENTAL (RETENÇÃO ZERO DE DADOS)
 * Arquitetura Vue.js 3 + Vuetify 3 com Design System Pastel
 * Acessibilidade Cego-First: STT Contínuo, TTS Neural, Web Audio API e Atalhos Globais
 */

const { createApp, ref, onMounted, watch } = Vue;
const { createVuetify } = Vuetify;

// Configuração do Tema Pastel Customizado no Vuetify 3
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'pastelTheme',
    themes: {
      pastelTheme: {
        dark: false,
        colors: {
          primary: '#0284C7',      // Azul Sereno Pastel Dark
          secondary: '#7C3AED',    // Lavanda Pastel Dark
          background: '#F0F4F8',   // Pastel Slate
          surface: '#FFFFFF',      // Branco Puro Surface
          info: '#0284C7',         // Azul Pastel
          success: '#166534',      // Menta Pastel Dark
          warning: '#D97706',      // Âmbar Pastel
          error: '#DC2626',        // Vermelho Alerta
        }
      }
    }
  }
});

const app = createApp({
  setup() {
    // Referências reativas do Estado da Aplicação
    const isCameraActive = ref(false);
    const isProcessing = ref(false);
    const isVoiceListening = ref(false);
    const userQuestion = ref('');
    const latestAnalysis = ref(null);
    const lastSpeechText = ref('');
    const showHelpDialog = ref(false);

    // Referências DOM para elementos de vídeo e canvas
    const videoRef = ref(null);
    const canvasRef = ref(null);

    // Instâncias do Web Audio Context e Reconhecimento de Voz (STT)
    let audioCtx = null;
    let speechRecognition = null;

    /**
     * Inicializador da Câmera do Dispositivo via MediaDevices API
     */
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Câmera traseira por padrão
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.value) {
          videoRef.value.srcObject = stream;
          isCameraActive.value = true;
          announceAria('Câmera ativada com sucesso.', 'polite');
          playAudioBeep(600, 0.1); // Beep de confirmação
        }
      } catch (err) {
        console.error('Erro ao acessar a câmera:', err);
        announceAria('Não foi possível acessar a câmera. Verifique as permissões.', 'assertive');
        speakText('Não foi possível acessar a câmera. Verifique as permissões do dispositivo.');
      }
    };

    /**
     * Captura o frame atual da vídeo-stream e envia ao backend
     */
    const captureAndAnalyze = async () => {
      if (isProcessing.value) return;

      if (!videoRef.value || !canvasRef.value) {
        speakText('A câmera ainda não está pronta.');
        return;
      }

      try {
        isProcessing.value = true;
        announceAria('Capturando foto. Analisando ambiente...', 'assertive');
        speakText('Analisando ambiente.');
        playAudioBeep(800, 0.15); // Som de obturador/captura

        // Desenhar frame no canvas volátil em memória
        const video = videoRef.value;
        const canvas = canvasRef.value;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Converter canvas em Blob JPEG de alta velocidade
        const imageBlob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.85);
        });

        // Montar FormData para o backend Express (RAM-only)
        const formData = new FormData();
        formData.append('image', imageBlob, 'capture.jpg');
        if (userQuestion.value.trim()) {
          formData.append('question', userQuestion.value.trim());
        }

        const response = await fetch('/api/perceive', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Erro no servidor (${response.status})`);
        }

        const data = await response.json();
        latestAnalysis.value = data;
        lastSpeechText.value = data.speechText;

        // Anúncio e Leitura Falada Automática (TTS)
        announceAria(data.speechText, 'assertive');
        speakText(data.speechText, () => {
          // Se houver perigo detectado, emitir tom de alerta sonoro
          if (data.hazards && data.hazards.length > 0) {
            playAudioBeep(300, 0.3, 'sawtooth');
          }
        });

        // Limpar pergunta de texto pós-envio
        userQuestion.value = '';
      } catch (err) {
        console.error('Erro no envio da percepção:', err);
        announceAria('Erro ao analisar a imagem. Tente novamente.', 'assertive');
        speakText('Ocorreu um erro ao analisar a imagem. Por favor, tente novamente.');
      } finally {
        isProcessing.value = false;
      }
    };

    /**
     * Sintetizador de Fala (TTS) em Português com Tom Humano Acolhedor
     */
    const speakText = (text, onEndCallback = null) => {
      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis não suportado neste navegador.');
        return;
      }

      window.speechSynthesis.cancel(); // Cancelar falas anteriores

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05; // Velocidade natural
      utterance.pitch = 1.0; // Entonação equilibrada

      // Priorizar vozes neurais brasileiras
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Luciana') || v.name.includes('Francisca')));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      if (onEndCallback) {
        utterance.onend = onEndCallback;
      }

      window.speechSynthesis.speak(utterance);
    };

    /**
     * Repetir a última leitura de áudio
     */
    const repeatAudio = () => {
      if (lastSpeechText.value) {
        speakText(lastSpeechText.value);
        announceAria('Repetindo áudio.', 'polite');
      } else {
        speakText('Nenhuma leitura anterior para repetir.');
      }
    };

    /**
     * Reconhecimento Continuo de Voz Mãos Livres (STT)
     */
    const initVoiceRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('Reconhecimento de voz não suportado neste navegador.');
        return;
      }

      speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'pt-BR';

      speechRecognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const command = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        console.log('Comando de Voz Recebido:', command);

        if (command.includes('capturar') || command.includes('analisar') || command.includes('foto')) {
          captureAndAnalyze();
        } else if (command.includes('o que tem na minha frente') || command.includes('o que tem aqui')) {
          userQuestion.value = 'O que tem na minha frente?';
          captureAndAnalyze();
        } else if (command.includes('repetir') || command.includes('fala de novo')) {
          repeatAudio();
        }
      };

      speechRecognition.onerror = (err) => {
        console.warn('Erro no reconhecimento de voz:', err);
      };

      speechRecognition.onend = () => {
        // Reiniciar automaticamente se o modo estiver ativo
        if (isVoiceListening.value) {
          try { speechRecognition.start(); } catch (e) {}
        }
      };
    };

    const toggleVoiceListening = () => {
      isVoiceListening.value = !isVoiceListening.value;
      if (isVoiceListening.value) {
        if (!speechRecognition) initVoiceRecognition();
        try {
          speechRecognition.start();
          speakText('Modo de comandos por voz ativado. Fale Capturar a qualquer momento.');
          announceAria('Escuta por voz ativada.', 'polite');
        } catch (e) {}
      } else {
        if (speechRecognition) {
          try { speechRecognition.stop(); } catch (e) {}
        }
        speakText('Modo de voz desativado.');
        announceAria('Escuta por voz desativada.', 'polite');
      }
    };

    const askWithVoicePrompt = () => {
      userQuestion.value = 'O que está à minha frente e a qual distância?';
      captureAndAnalyze();
    };

    /**
     * Web Audio API Sonificação
     */
    const playAudioBeep = (freq = 440, duration = 0.1, type = 'sine') => {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {
        console.warn('Não foi possível tocar o tom Web Audio:', e);
      }
    };

    /**
     * Anúncio para Leitores de Tela (ARIA Live)
     */
    const announceAria = (message, priority = 'polite') => {
      const liveRegion = document.getElementById(`aria-${priority}`);
      if (liveRegion) {
        liveRegion.textContent = '';
        setTimeout(() => {
          liveRegion.textContent = message;
        }, 50);
      }
    };

    /**
     * Atalhos de Teclado Universais
     */
    const setupKeyboardShortcuts = () => {
      window.addEventListener('keydown', (e) => {
        // Evitar disparar atalhos se o usuário estiver digitando no input
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          return;
        }

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          captureAndAnalyze();
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          repeatAudio();
        } else if (e.code === 'KeyV') {
          e.preventDefault();
          toggleVoiceListening();
        }
      });
    };

    // Montagem do Componente
    onMounted(() => {
      initCamera();
      initVoiceRecognition();
      setupKeyboardShortcuts();
    });

    return {
      isCameraActive,
      isProcessing,
      isVoiceListening,
      userQuestion,
      latestAnalysis,
      lastSpeechText,
      showHelpDialog,
      videoRef,
      canvasRef,
      captureAndAnalyze,
      repeatAudio,
      toggleVoiceListening,
      askWithVoicePrompt
    };
  }
});

app.use(vuetify);
app.mount('#app');
