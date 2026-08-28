/**
 * ASSISTENTE DE PERCEPÇÃO AMBIENTAL PARA DEFICIENTES VISUAIS (TCC - RETENÇÃO ZERO)
 * Identidade Visual Pastel Premium com Vuetify 3, Controle por Voz Contínuo (STT),
 * Sintetizador Humano (TTS) e Sonificação Web Audio API.
 */

const { createApp, ref, computed, onMounted } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify({
  components: Vuetify.components || {},
  directives: Vuetify.directives || {},
  defaults: {
    VBtn: {
      rounded: 'xl',
      elevation: 0
    },
    VCard: {
      rounded: 'xl',
      elevation: 0
    },
    VAlert: {
      rounded: 'lg'
    },
    VChip: {
      rounded: 'lg'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary'
    }
  },
  theme: {
    defaultTheme: 'pastelTheme',
    themes: {
      pastelTheme: {
        dark: false,
        colors: {
          primary: '#0284C7',        /* Azul Oceânico */
          'primary-light': '#E0F2FE',
          secondary: '#7C3AED',      /* Lavanda Suave */
          'secondary-light': '#F3E8FF',
          surface: '#FFFFFF',
          'surface-variant': '#F8FAFC',
          accent: '#0D9488',         /* Menta Profundo */
          emerald: '#059669',        /* Menta Esmeralda */
          'emerald-light': '#D1FAE5',
          error: '#E11D48',          /* Rosa Coral Alerta */
          'error-light': '#FFE4E6',
          warning: '#D97706',        /* Âmbar Solar */
          'warning-light': '#FEF3C7',
          info: '#0284C7',
          'slate-400': '#94A3B8',
          'slate-600': '#475569',
          'slate-800': '#1E293B',
          'grey-lighten-1': '#E2E8F0'
        }
      }
    }
  }
});

const app = createApp({
  setup() {
    // Refs reativas de estado
    const videoRef = ref(null);
    const canvasRef = ref(null);
    const isCameraActive = ref(false);
    const isProcessing = ref(false);
    const isVoiceListening = ref(false);
    const showHelpDialog = ref(false);
    const userQuestion = ref('');
    const latestAnalysis = ref(null);
    const lastSpeechText = ref('');
    const hasError = ref(false);
    const errorMessage = ref('');
    
    let mediaStream = null;
    let speechSynth = window.speechSynthesis;
    let speechUtterance = null;
    let selectedVoice = null;
    let speechRecognition = null;
    let audioCtx = null;

    // Web Audio API para Beeps de Sonificação Acessível
    function getAudioContext() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }

    function playTone(freq = 440, duration = 0.1, type = 'sine') {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    }

    // Regiões ARIA Live
    function announceAssertive(text) {
      const el = document.getElementById('aria-assertive');
      if (el) el.textContent = text;
    }
    function announcePolite(text) {
      const el = document.getElementById('aria-polite');
      if (el) el.textContent = text;
    }

    // Inicialização do Motor de Câmera
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          announceAssertive('Erro: Câmera não suportada neste navegador.');
          return;
        }
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (videoRef.value) {
          videoRef.value.srcObject = mediaStream;
          isCameraActive.value = true;
          playTone(523.25, 0.15); // Tone C5 de Câmera Ativa
          announcePolite('Câmera ativada com sucesso.');
        }
      } catch (err) {
        console.error('Falha ao acessar câmera:', err);
        announceAssertive('Erro ao acessar a câmera. Verifique as permissões.');
      }
    }

    // Busca e Seleção de Vozes Naturais em Português (TTS Humano)
    function loadHumanVoices() {
      if (!speechSynth) return;
      const voices = speechSynth.getVoices();
      // Prioridade: Vozes Neurais ou Naturais PT-BR (Google, Microsoft, Apple)
      selectedVoice = voices.find(v => v.lang.includes('pt') && (
        v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Francisca') || v.name.includes('Helena')
      )) || voices.find(v => v.lang.includes('pt-BR')) || voices.find(v => v.lang.includes('pt'));
    }

    if (speechSynth) {
      loadHumanVoices();
      if (speechSynth.onvoiceschanged !== undefined) {
        speechSynth.onvoiceschanged = loadHumanVoices;
      }
    }

    // Síntese de Fala Humana Acolhedora
    function speakNaturalText(text, priority = 'NORMAL') {
      if (!speechSynth || !text) return;
      speechSynth.cancel(); // Cancelar falas anteriores

      speechUtterance = new SpeechSynthesisUtterance(text);
      speechUtterance.lang = 'pt-BR';
      if (selectedVoice) speechUtterance.voice = selectedVoice;

      // Parâmetros sintonizados para voz natural humana
      speechUtterance.rate = 1.05; // Velocidade natural fluida
      speechUtterance.pitch = priority === 'HIGH' ? 1.15 : 1.0; // Tom mais alto para perigo

      speechSynth.speak(speechUtterance);
      announceAssertive(text);
    }

    // Repetir a última leitura de voz (Atalho: R)
    function repeatAudio() {
      if (lastSpeechText.value) {
        speakNaturalText(lastSpeechText.value, latestAnalysis.value?.priority);
      } else {
        speakNaturalText('Nenhuma análise anterior para repetir.');
      }
    }

    // Modo Mãos Livres: Reconhecimento de Voz Contínuo (STT)
    function initVoiceRecognition() {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechClass) {
        console.warn('Reconhecimento de voz não suportado neste navegador.');
        return;
      }

      speechRecognition = new SpeechClass();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'pt-BR';

      speechRecognition.onresult = (event) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
        console.log('Comando de voz recebido:', transcript);

        if (transcript.includes('capturar') || transcript.includes('analisar') || transcript.includes('foto')) {
          captureAndAnalyze();
        } else if (transcript.includes('repetir') || transcript.includes('ouvir de novo')) {
          repeatAudio();
        } else if (transcript.includes('o que tem') || transcript.includes('o que há') || transcript.includes('quem está')) {
          userQuestion.value = transcript;
          captureAndAnalyze();
        }
      };

      speechRecognition.onerror = (err) => {
        console.warn('Erro na escuta por voz:', err.error);
      };
    }

    function toggleVoiceListening() {
      if (!speechRecognition) initVoiceRecognition();
      if (!speechRecognition) {
        speakNaturalText('Reconhecimento de voz não suportado neste navegador.');
        return;
      }

      if (isVoiceListening.value) {
        speechRecognition.stop();
        isVoiceListening.value = false;
        speakNaturalText('Modo de comando por voz desativado.');
      } else {
        try {
          speechRecognition.start();
          isVoiceListening.value = true;
          playTone(880, 0.15);
          speakNaturalText('Modo de comando por voz ativado. Diga Capturar a qualquer momento.');
        } catch (e) {
          isVoiceListening.value = false;
        }
      }
    }

    function askWithVoicePrompt() {
      if (!isVoiceListening.value) {
        toggleVoiceListening();
      } else {
        speakNaturalText('Fale sua pergunta agora.');
      }
    }

    // Recuperação em caso de erro (Retry)
    function retryCapture() {
      hasError.value = false;
      errorMessage.value = '';
      captureAndAnalyze();
    }

    // Capturar Foto e Enviar para o Backend Express (Retenção Zero)
    async function captureAndAnalyze() {
      if (isProcessing.value) return;

      hasError.value = false;
      errorMessage.value = '';
      playTone(659.25, 0.12); // Som de acionamento
      if (navigator.vibrate) navigator.vibrate(100); // Feedback tátil

      if (!videoRef.value || !canvasRef.value) return;

      const video = videoRef.value;
      const canvas = canvasRef.value;

      if (!video.videoWidth || !video.videoHeight) {
        speakNaturalText('Câmera ainda carregando. Aguarde um segundo e tente novamente.');
        return;
      }

      isProcessing.value = true;
      announcePolite('Capturando imagem e enviando para análise...');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extração de métricas de pixels no agente visual local
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let totalPixels = data.length / 4;
      let skinPixels = 0;
      let totalBrightness = 0;

      for (let i = 0; i < data.length; i += 16) { // Amostragem rápida a cada 4 pixels
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Regra de detecção de tom de pele HSV/RGB
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && (Math.max(r, g, b) - Math.min(r, g, b) > 15) && Math.abs(r - g) > 15) {
          skinPixels++;
        }
        totalBrightness += (r + g + b) / 3;
      }

      const skinRatio = skinPixels / (totalPixels / 4);
      const avgBrightness = Math.round(totalBrightness / (totalPixels / 4));

      // Converter canvas para Blob JPEG efêmero
      canvas.toBlob(async (blob) => {
        if (!blob) {
          isProcessing.value = false;
          hasError.value = true;
          errorMessage.value = 'Erro ao capturar a moldura da imagem da câmera.';
          speakNaturalText('Erro ao capturar a imagem.');
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'capture.jpg');
        if (userQuestion.value) {
          formData.append('question', userQuestion.value);
          formData.append('userQuestion', userQuestion.value);
        }

        formData.append('visualFeatures', JSON.stringify({
          skinRatio: skinRatio,
          brightness: avgBrightness,
          hasFaceCandidate: skinRatio > 0.08,
          edgeDensity: 0.25
        }));

        try {
          const response = await fetch('/api/perceive', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`HTTP Error (${response.status})`);
          }

          const result = await response.json();
          const analysisData = (result && result.data) ? result.data : result;

          latestAnalysis.value = analysisData;
          lastSpeechText.value = analysisData.speechText || analysisData.description || '';

          isProcessing.value = false;
          hasError.value = false;

          // Perigo/Emergência
          if (analysisData.priority === 'HIGH' || (analysisData.hazards && analysisData.hazards.length > 0)) {
            playTone(987.77, 0.4, 'sawtooth'); // Beep de alerta de perigo
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          } else {
            playTone(523.25, 0.15); // Beep de sucesso
          }

          // Leitura por voz humana imediata
          speakNaturalText(lastSpeechText.value, analysisData.priority);

        } catch (err) {
          console.error('Erro na requisição /api/perceive:', err);
          isProcessing.value = false;
          hasError.value = true;
          errorMessage.value = 'Falha de conexão com a inteligência visual. Verifique a rede e tente novamente.';
          playTone(300, 0.3, 'sawtooth');
          speakNaturalText(errorMessage.value);
        }
      }, 'image/jpeg', 0.85);
    }

    // Atalhos Globais de Teclado
    onMounted(() => {
      startCamera();
      initVoiceRecognition();

      window.addEventListener('keydown', (e) => {
        // Se estiver digitando no campo de texto, não dispara atalhos rápidos de tecla única
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
          return;
        }

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          captureAndAnalyze();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          repeatAudio();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          toggleVoiceListening();
        }
      });
    });

    return {
      videoRef,
      canvasRef,
      isCameraActive,
      isProcessing,
      isVoiceListening,
      showHelpDialog,
      userQuestion,
      latestAnalysis,
      lastSpeechText,
      hasError,
      errorMessage,
      captureAndAnalyze,
      retryCapture,
      repeatAudio,
      toggleVoiceListening,
      askWithVoicePrompt
    };
  }
});

app.use(vuetify).mount('#app');
