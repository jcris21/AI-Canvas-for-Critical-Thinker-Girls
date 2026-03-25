import React from 'react';
import { useNavigate } from 'react-router';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#fdf2f8' }}
    >
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#fdf2f8]/80 backdrop-blur-md border-b border-pink-100">
        <span className="text-xl font-black tracking-tight text-[#9720ab]">
          WonderCanvas AI
        </span>
        <button
          onClick={() => navigate('/mode')}
          className="px-5 py-2 rounded-full bg-[#9720ab] text-white font-bold text-sm hover:bg-[#7a1a8a] transition-colors"
        >
          Entrar
        </button>
      </header>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-[#9720ab] px-4 py-2 rounded-full text-sm font-bold">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            Aprende pensando, no memorizando
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-tight">
            El lienzo donde{' '}
            <span className="text-[#9720ab]">las ideas</span>{' '}
            cobran vida
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            WonderCanvas combina un canvas interactivo con WonderBot, tu tutora socrática con IA.
            Dibuja, explora y desarrolla pensamiento crítico a través de preguntas que despiertan curiosidad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => navigate('/mode')}
              className="px-8 py-4 rounded-2xl bg-[#9720ab] text-white font-bold text-lg shadow-lg shadow-[#9720ab]/30 hover:bg-[#7a1a8a] hover:-translate-y-1 transition-all"
            >
              Comenzar ahora
            </button>
            <button
              onClick={() => navigate('/session')}
              className="px-8 py-4 rounded-2xl border-2 border-[#9720ab] text-[#9720ab] font-bold text-lg hover:bg-pink-50 hover:-translate-y-1 transition-all"
            >
              Ver demo
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 text-left">
          {[
            {
              icon: 'draw',
              title: 'Canvas interactivo',
              desc: 'Dibuja libremente con Fabric.js. Arrastra objetos, sube imágenes y construye ideas visualmente.',
              color: '#9720ab',
              bg: '#f3e8ff',
            },
            {
              icon: 'smart_toy',
              title: 'WonderBot socrático',
              desc: 'Nuestra IA nunca da respuestas directas. Guía con preguntas que activan el pensamiento profundo.',
              color: '#0066cc',
              bg: '#e0f0ff',
            },
            {
              icon: 'assignment',
              title: 'Misiones guiadas',
              desc: 'Docentes crean lecciones con contexto e instrucciones. Los estudiantes las viven en el canvas.',
              color: '#006644',
              bg: '#e0f5ee',
            },
          ].map(({ icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl p-8 flex flex-col gap-4"
              style={{ backgroundColor: bg }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ color, fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA secundario */}
        <div className="mt-24 max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-black text-gray-900">
            ¿Eres docente o padre/madre?
          </h2>
          <p className="text-gray-500">
            Crea lecciones, define misiones socrátícas y asígnalas a tus estudiantes en minutos.
          </p>
          <button
            onClick={() => navigate('/teacher/panel')}
            className="px-8 py-4 rounded-2xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-700 hover:-translate-y-1 transition-all"
          >
            Panel del tutor →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400 border-t border-pink-100">
        © 2025 WonderCanvas AI · Pensamiento crítico para la próxima generación
      </footer>

      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#9720ab]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-pink-300/10 blur-[140px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />
    </div>
  );
};

export default LandingPage;
