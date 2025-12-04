import React, { useState, useRef, useEffect } from 'react';
import CanvasBoard, { CanvasHandle } from './components/CanvasBoard';
import { chatWithGemini } from './services/geminiService';
import { Message, Sender, ToolType } from './types';
import { 
  Pen, 
  Eraser, 
  Trash2, 
  Send, 
  Sparkles, 
  Eye, 
  Upload 
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [strokeColor, setStrokeColor] = useState('#db2777'); // brand-600
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: Sender.AI,
      text: '¡Hola! Soy WonderBot 🤖. Dibuja algo en el lienzo y pregúntame sobre ello. ¡Vamos a pensar juntos!',
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Refs ---
  const canvasRef = useRef<CanvasHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---
  
  const handleSendMessage = async () => {
    if ((!inputText.trim() && !canvasRef.current) || isProcessing) return;

    const userMsgText = inputText.trim() || "Mira mi dibujo...";
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMsgText,
      sender: Sender.User,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Prepare history for context
      const history = messages.map(m => ({
        role: m.sender === Sender.AI ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      // Get canvas data if needed
      // We assume if the user sends a message, we always look at the canvas context for this specific PoC
      const imageBase64 = canvasRef.current?.getCanvasImage();

      const response = await chatWithGemini(
        history, 
        userMsgText, 
        imageBase64 || undefined
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: Sender.AI,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle Image Injection
      if (response.generatedImageBase64) {
        canvasRef.current?.injectImage(response.generatedImageBase64);
        // Add a system notification
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          text: "🎨 ¡He añadido una ilustración a tu dibujo!",
          sender: Sender.System,
          timestamp: Date.now()
        }]);
      }

    } catch (error) {
      console.error("Error in interaction", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Ups, tuve un problema pensando. ¿Intentamos de nuevo?",
        sender: Sender.AI,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeDrawing = () => {
    // Shortcut to just say "What is this?"
    setInputText("¿Qué ves en mi dibujo? ¿Qué te hace pensar?");
    handleSendMessage();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && canvasRef.current) {
        canvasRef.current.injectImage(result);
        
        // Optional: Notify the user in chat
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: "🖼️ He cargado tu imagen en el lienzo. ¡Podemos dibujar sobre ella!",
            sender: Sender.System,
            timestamp: Date.now()
          }]);
      }
    };
    reader.readAsDataURL(file);
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-brand-50 font-sans text-gray-800 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none h-16 bg-white shadow-sm flex items-center px-6 justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-2 rounded-full text-white">
            <Sparkles size={20} />
          </div>
          <h1 className="text-xl font-bold text-brand-600 tracking-tight">WonderCanvas AI</h1>
        </div>
        <div className="text-sm text-brand-400 font-medium hidden md:block">
          Critical Thinking & Creativity Lab
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left: Canvas Area */}
        <div className="flex-1 flex flex-col relative p-4">
          
          {/* Toolbar */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-3 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-brand-100">
            <button 
              onClick={() => setActiveTool('pen')}
              className={`p-3 rounded-lg transition-all ${activeTool === 'pen' ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:bg-brand-50'}`}
              title="Pincel"
            >
              <Pen size={20} />
            </button>
            <div className="w-full h-px bg-gray-200 my-1"></div>
            {/* Color Picker (Simple) */}
            {[ '#db2777', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#000000'].map(color => (
              <button
                key={color}
                onClick={() => { setActiveTool('pen'); setStrokeColor(color); }}
                className={`w-6 h-6 rounded-full border-2 ${strokeColor === color && activeTool === 'pen' ? 'border-gray-600 scale-110' : 'border-white'}`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="w-full h-px bg-gray-200 my-1"></div>
            <button 
              onClick={() => setActiveTool('eraser')}
              className={`p-3 rounded-lg transition-all ${activeTool === 'eraser' ? 'bg-gray-200 text-gray-700 shadow-inner' : 'text-gray-500 hover:bg-brand-50'}`}
              title="Borrador"
            >
              <Eraser size={20} />
            </button>
            
            <div className="w-full h-px bg-gray-200 my-1"></div>
            
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
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

            <button 
              onClick={() => canvasRef.current?.clearCanvas()}
              className="p-3 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
              title="Limpiar todo"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border-4 border-white overflow-hidden relative">
             <CanvasBoard 
                ref={canvasRef} 
                activeTool={activeTool} 
                strokeColor={strokeColor}
                strokeWidth={activeTool === 'pen' ? 5 : 20}
             />
             
             {/* Floating Action Button for Quick Analysis */}
             <button 
              onClick={handleAnalyzeDrawing}
              disabled={isProcessing}
              className="absolute bottom-6 right-6 bg-brand-600 text-white px-6 py-3 rounded-full shadow-xl hover:bg-brand-700 transition-transform hover:-translate-y-1 flex items-center gap-2 font-bold disabled:opacity-50"
             >
               <Eye size={20} />
               <span>Mira esto</span>
             </button>
          </div>

        </div>

        {/* Right: Chat Interface */}
        <div className="w-full md:w-96 flex flex-col bg-white border-l border-brand-100 shadow-lg z-20">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-brand-50 no-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === Sender.User 
                      ? 'bg-brand-500 text-white rounded-tr-none' 
                      : msg.sender === Sender.System 
                        ? 'bg-yellow-100 text-yellow-800 text-center w-full font-medium'
                        : 'bg-white border border-brand-100 text-gray-700 rounded-tl-none'
                  }`}
                >
                   {/* Basic formatting for AI response */}
                   {msg.text.split('\n').map((line, i) => (
                     <p key={i} className="min-h-[1rem]">{line}</p>
                   ))}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-brand-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                   <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                   <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                   <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-brand-100">
            <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage();
                   }
                }}
                placeholder="Pregunta algo o dibuja..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-24 text-sm p-2"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={isProcessing}
                className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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