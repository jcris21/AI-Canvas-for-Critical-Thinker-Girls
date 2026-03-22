import React, { useState, useRef, useEffect, useCallback } from 'react';
import CanvasBoard, { CanvasHandle } from './components/CanvasBoard';
import { chatWithGemini } from './services/geminiService';
import { Message, Sender, ToolType } from './types';
import {
  Pen,
  MousePointer2,
  Trash2,
  Send,
  Sparkles,
  Eye,
  Upload,
  Mic,
  MicOff,
} from 'lucide-react';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare const webkitSpeechRecognition: new () => SpeechRecognitionInstance;
declare const SpeechRecognition: new () => SpeechRecognitionInstance;

const getSpeechRecognition = (): SpeechRecognitionInstance | null => {
  if (typeof SpeechRecognition !== 'undefined') return new SpeechRecognition();
  if (typeof webkitSpeechRecognition !== 'undefined') return new webkitSpeechRecognition();
  return null;
};

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [strokeColor, setStrokeColor] = useState('#db2777');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: Sender.AI,
      text: '¡Hola! Soy WonderBot 🤖. Dibuja algo en el lienzo y pregúntame sobre ello. ¡Vamos a pensar juntos!',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.User,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === Sender.AI ? 'model' : 'user',
        text: m.text,
      }));

      const imageBase64 = canvasRef.current?.getCanvasImage();

      const response = await chatWithGemini(history, text, imageBase64 || undefined);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: response.text,
          sender: Sender.AI,
          timestamp: Date.now(),
        },
      ]);

    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: 'Ups, tuve un problema pensando. ¿Intentamos de nuevo?',
          sender: Sender.AI,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, messages]);

  const handleAnalyzeDrawing = () => {
    sendMessage('¿Qué ves en mi dibujo? ¿Qué te hace pensar?');
  };

  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: '⚠️ Formato no compatible. Por favor sube una imagen JPEG, PNG, WebP o GIF.',
          sender: Sender.System,
          timestamp: Date.now(),
        },
      ]);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: '⚠️ La imagen es demasiado grande. El tamaño máximo permitido es 5 MB.',
          sender: Sender.System,
          timestamp: Date.now(),
        },
      ]);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && canvasRef.current) {
        canvasRef.current.injectImage(result);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: '🖼️ He cargado tu imagen en el lienzo. ¡Podemos dibujar sobre ella!',
            sender: Sender.System,
            timestamp: Date.now(),
          },
        ]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInputText(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="flex flex-col h-screen bg-pink-50 font-sans text-gray-800 overflow-hidden" style={{ fontFamily: "'Comic Sans MS', cursive" }}>

      {/* Header */}
      <header className="flex-none h-16 bg-white shadow-sm flex items-center px-6 justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-pink-500 p-2 rounded-full text-white">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-bold text-pink-600 tracking-tight">WonderCanvas AI</h1>
        </div>
        <div className="text-sm text-pink-400 font-medium hidden md:block">
          Critical Thinking &amp; Creativity Lab
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col relative p-4">

          {/* Toolbar */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-3 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-pink-100">

            {/* Pen */}
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-3 rounded-lg transition-all ${activeTool === 'pen' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-pink-50'}`}
              title="Pincel"
            >
              <Pen size={20} />
            </button>

            {/* Select / Move */}
            <button
              onClick={() => setActiveTool('select')}
              className={`p-3 rounded-lg transition-all ${activeTool === 'select' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-500 hover:bg-pink-50'}`}
              title="Mover objetos"
            >
              <MousePointer2 size={20} />
            </button>

            <div className="w-full h-px bg-gray-200 my-1" />

            {/* Colors */}
            {['#db2777', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#000000'].map(color => (
              <button
                key={color}
                onClick={() => { setActiveTool('pen'); setStrokeColor(color); }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${strokeColor === color && activeTool === 'pen' ? 'border-gray-600 scale-110' : 'border-white'}`}
                style={{ backgroundColor: color }}
              />
            ))}

            <div className="w-full h-px bg-gray-200 my-1" />

            {/* Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-lg text-blue-500 hover:bg-blue-50 transition-all"
              title="Cargar imagen"
            >
              <Upload size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {/* Clear all */}
            <button
              onClick={() => canvasRef.current?.clearCanvas()}
              className="p-3 rounded-lg text-red-400 hover:bg-red-50 transition-all"
              title="Limpiar todo"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden relative">
            <CanvasBoard
              ref={canvasRef}
              activeTool={activeTool}
              strokeColor={strokeColor}
              strokeWidth={activeTool === 'pen' ? 5 : 20}
            />

            {/* Quick analyze button */}
            <button
              onClick={handleAnalyzeDrawing}
              disabled={isProcessing}
              className="absolute bottom-6 right-6 bg-pink-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-pink-700 transition-transform hover:-translate-y-1 flex items-center gap-2 font-bold disabled:opacity-50"
            >
              <Eye size={20} />
              <span>Mira esto</span>
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full md:w-96 flex flex-col bg-white border-l border-pink-100 shadow-lg z-20">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-pink-50 no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === Sender.User
                      ? 'bg-pink-500 text-white rounded-tr-none'
                      : msg.sender === Sender.System
                        ? 'bg-yellow-100 text-yellow-800 text-center w-full font-medium'
                        : 'bg-white border border-pink-100 text-gray-700 rounded-tl-none'
                  }`}
                >
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="min-h-[1rem]">{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-pink-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-pink-100">
            <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100 transition-all">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Pregunta algo o dibuja..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-24 text-sm p-2"
                rows={1}
              />

              {/* Speech button */}
              <button
                onClick={toggleSpeech}
                className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500'}`}
                title={isListening ? 'Detener' : 'Hablar'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Send button */}
              <button
                title="Enviar"
                onClick={() => sendMessage()}
                disabled={isProcessing}
                className="p-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-xs text-center text-gray-400 mt-2">
              La IA puede cometer errores. Revisa la información.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
