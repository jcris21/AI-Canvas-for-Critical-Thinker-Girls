import React from 'react';
import { useNavigate } from 'react-router';

const SelectorDeModo: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="stitch-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#f8f6f8] dark:bg-slate-900 shadow-none">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-primary font-headline">WonderCanvas AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface hover:bg-surface-variant transition-colors rounded-full">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-24">
        <div className="max-w-7xl w-full">

          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-on-surface">
              Bienvenido al <span className="text-primary">Imaginarium</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-medium">
              El laboratorio donde el pensamiento crítico se convierte en magia.
              Selecciona tu rol para comenzar la alquimia digital.
            </p>
          </div>

          {/* Mode Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">

            {/* Modo Explorador (Kids) */}
            <div className="group relative flex flex-col bg-surface-container rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgba(151,32,171,0.12)] hover:-translate-y-2 cursor-pointer">
              <div className="h-64 overflow-hidden relative">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Laboratorio futurista con iconos holográficos flotantes"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiVw3Dn_Rs4WC9LBbSgApwwTtANS1Yt0i44Y2J-4GxjfHHGcrUSbXdSlZaekxD0V3zmcMNQP3hlwU8YwLMqt1kIMz3goxbdjfTMszxIxcbAf0nNzDGEXr9xhs9_ODk3kjv64fKFBzokPdKGy37cob-w6NWjaKQlwnF3x2yLLVAE3eWjgyr0WISrMXyxZogcPUbKpuR2aiK8UXl62gErcA0wQ87puC8r8h9OLhzjt3-Crvek8iMgI3nTsDwZNXonJoipRk7ipvkEig"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-primary-container/80 backdrop-blur-md px-4 py-2 rounded-full border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                  <span className="text-primary font-bold text-xs tracking-widest uppercase">Para Jóvenes Alquimistas</span>
                </div>
              </div>
              <div className="p-8 md:p-10 flex flex-col h-full">
                <h2 className="text-3xl font-extrabold text-on-surface mb-4">Modo Explorador (Kids)</h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-10">
                  Entra al Laboratorio de Ideas. Resuelve retos y entrena tu mente con WonderBot.
                </p>
                <div className="mt-auto">
                  <button
                    onClick={() => navigate('/student/missions')}
                    className="w-full bg-primary text-on-primary py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:bg-on-primary-container transition-all active:scale-[0.98]"
                  >
                    Entrar al Laboratorio
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modo Guía (Tutor/Padres) */}
            <div className="group relative flex flex-col bg-surface-container-high rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,102,102,0.12)] hover:-translate-y-2 cursor-pointer">
              <div className="h-64 overflow-hidden relative">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Centro de mando moderno con visualizaciones de datos"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzM0fLxU_V6tmynBr8A0wjyKGxCJNBHtCBTFkcoH3qFjFZip7aCdtIh95caQZ-ogNSNIAeOHm7fPqKzquJVNm7GOOTOVn5tUMGt4y_SfdwC6Wc_WtKH1LLjJ8SplykyWSNvT1aYyI43Y6FwOzmDc4qVHjCRIM6weLKGm3-vAZTQnPtNJ9bgnsuC1v1on4_VOek1BSQ--u_rFsHT6FGy2XGxsojGTkWOG6KYQOge4gpofWaax67MDcY8gHawP6XVzVQO2ze-JOHMRc"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent" />
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-secondary-container/80 backdrop-blur-md px-4 py-2 rounded-full border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>model_training</span>
                  <span className="text-secondary font-bold text-xs tracking-widest uppercase">Centro de Mando</span>
                </div>
              </div>
              <div className="p-8 md:p-10 flex flex-col h-full">
                <h2 className="text-3xl font-extrabold text-on-surface mb-4">Modo Guía (Tutor/Padres)</h2>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-10">
                  Diseña Desafíos Socráticos. Crea misiones personalizadas y apoya
                  el pensamiento crítico de tus alumnos.
                </p>
                <div className="mt-auto">
                  <button
                    onClick={() => navigate('/teacher/panel')}
                    className="w-full bg-secondary text-on-secondary py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-secondary/20 hover:shadow-secondary/40 transition-all active:scale-[0.98]"
                  >
                    Diseñar Misiones
                    <span className="material-symbols-outlined">architecture</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer links */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 border-t border-outline-variant pt-12">
            <a className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">Guía para Padres</a>
            <a className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">Recursos Docentes</a>
            <a className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">Soporte Técnico</a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start bg-surface-variant py-12 px-8 border-t border-outline-variant">
        <div className="flex flex-col gap-4">
          <span className="font-bold text-on-surface">WonderCanvas AI</span>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest leading-relaxed">
            © 2025 WonderCanvas AI · The Digital Alchemist's Workspace
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:text-primary transition-colors" href="#">Privacidad</a>
          <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:text-primary transition-colors" href="#">Términos de Alquimia</a>
        </div>
        <div />
        <div className="flex justify-end gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:scale-110 transition-transform cursor-pointer">
            <span className="material-symbols-outlined">science</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary hover:scale-110 transition-transform cursor-pointer">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
        </div>
      </footer>

      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-secondary/5 blur-[140px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

    </div>
  );
};

export default SelectorDeModo;
