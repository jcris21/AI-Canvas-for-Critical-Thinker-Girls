import React from 'react';
import { useNavigate } from 'react-router';

const MapaDeExpediciones: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="stitch-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface shadow-none">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tighter text-primary font-headline">WonderCanvas AI</span>
          <div className="hidden md:flex ml-8 items-center gap-6">
            <nav className="flex gap-4 font-sans text-sm tracking-tight">
              <a className="text-primary font-bold" href="#">Mapa de Misiones</a>
              <a className="text-on-surface hover:bg-surface-variant transition-colors px-3 py-1 rounded-lg" href="#">Laboratorio</a>
              <a className="text-on-surface hover:bg-surface-variant transition-colors px-3 py-1 rounded-lg" href="#">Exposiciones</a>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-on-surface">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-on-surface">help</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
            <img
              alt="User Explorer Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDutHIWvQ81erjzT0XOOIeUyjniHBvqrZBSX8qEWiRV87OHK75RZm_I2KfK5aW-xlaDOvgIzeV1O1mOFqaRJrLra-Df_OFngKi2ElsmSYR-0uvTzRLtnSZrMNUgxUoY6YfqgvqHiG8WONmv6ikuGJzOadgwjqq4evGn5jC7v_Ztqge1nhxhOfVN4XQxR-J94kOjzlUEd4tgcUGdRbdLp7CmgDe-yKr1j8xIIM53JRPf_XscwGCi33aRu8GgGBc-pKvc6SRoVq9B5ms"
            />
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full pt-20 pb-8 px-4 flex flex-col gap-4 bg-surface/80 backdrop-blur-xl w-64 shadow-[20px_0_40px_rgba(46,46,48,0.04)] hidden md:flex">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">auto_fix_high</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-on-surface leading-none">Imaginarium</h2>
              <p className="text-xs text-on-surface-variant">Digital Alchemist</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-2 flex-grow">
          <a className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 transition-all duration-300" href="#">
            <span className="material-symbols-outlined">explore</span>
            <span className="font-sans font-medium">Mapa de Misiones</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-variant rounded-xl hover:translate-x-1 transition-all duration-300" href="#">
            <span className="material-symbols-outlined">biotech</span>
            <span className="font-sans font-medium">Laboratorio</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-variant rounded-xl hover:translate-x-1 transition-all duration-300" href="#">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-sans font-medium">Archivos del Tutor</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-variant rounded-xl hover:translate-x-1 transition-all duration-300" href="#">
            <span className="material-symbols-outlined">palette</span>
            <span className="font-sans font-medium">Exposiciones de Ideas</span>
          </a>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <button className="w-full py-4 px-4 mb-4 bg-gradient-to-r from-primary to-[#ea73fb] text-on-primary rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all scale-95 active:scale-90">
            Empezar a Indagar
          </button>
          <a className="flex items-center gap-3 px-4 py-2 text-on-surface hover:bg-surface-variant rounded-xl transition-all" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm">Ajustes</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-on-surface hover:bg-surface-variant rounded-xl transition-all" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Cerrar Sesión</span>
          </a>
        </div>
      </aside>

      {/* Main Content: Mission Map (Kanban) */}
      <main className="md:ml-64 pt-24 px-6 pb-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Mapa de Misiones</h1>
          <p className="text-on-surface-variant font-medium">¡Hola, Alquimista! Revisa tus desafíos y entra al laboratorio para investigar.</p>
        </header>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Column 1: Nuevas Expediciones */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Nuevas Expediciones
              </h3>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs font-bold">2</span>
            </div>
            <div className="flex flex-col gap-6">
              {/* Mission Card 1 */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_40px_rgba(46,46,48,0.04)] border border-outline-variant/15 flex flex-col gap-4 group hover:translate-y-[-4px] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-container/20 px-3 py-1 rounded-full">Física Espacial</span>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                      <img
                        alt="Mira AI Tutor"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUEOMr-kwqwAIEPQC6PH_tLqBz-Szbz4skvjXFCN6rIDvQGG28-KNOwXDdMEqTHIs3yMYvpdB8a7xJDSEdiTea0zMZjBlNOck1bJo9DwVI7UKNmvidVMD0TNGX3yK2uFzEFFmbx5MTrlKewD3jLdVByGatMdh4YJlguaIQdo_-mKJE3jbWrAhcXfwSi5QdR69OO7rBkHyOXUt1zfJeIb_YScfzRdZjNU8e5ZEJFMCjScj3TvKAItqdNYHcbRvteBkIidAHnRvGPTc"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface leading-tight mb-1">El Enigma de la Gravedad Cero</h4>
                  <p className="text-sm text-on-surface-variant">¿Cómo se mueven los objetos sin peso? Mira te guiará en este viaje orbital.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-tertiary">
                    <span>Logic Level</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-0 h-full vial-fill rounded-full transition-all duration-1000"></div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/session')}
                  className="w-full mt-2 py-3 bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary-dim transition-colors group"
                >
                  Entrar al Lab
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">rocket_launch</span>
                </button>
              </div>

              {/* Mission Card 2 */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_40px_rgba(46,46,48,0.04)] border border-outline-variant/15 flex flex-col gap-4 group hover:translate-y-[-4px] transition-all duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-container/20 px-3 py-1 rounded-full">Biología Marina</span>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                      <img
                        alt="Mira AI Tutor"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHbHHxVnjaFGTNLADnA1Bhbqi6H3FOsFrXXCVnwkHlWhwoIezXbvb84Q-R-QiZ6mYIOAVVwYID5Z7mq_LnssmMIZ84sTbFTbNy5KY4fUIo3yOi7JQyvdxbNceXBo9Zy9MMiKhVBQep2I9CTdUUBSzwT-IGfN5A-idkrcBB3WgVJmgRBAvxINMEDtxLbaLX3HYCoVu43kU09g-qojP5O34-1CmRBjgx3oHXZ7PVhuMfbCOIyPlGu52chqYErJzZI0GRguGwfmEo0IQ"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface leading-tight mb-1">El Canto de las Ballenas</h4>
                  <p className="text-sm text-on-surface-variant">Descifra los patrones de comunicación en el fondo del océano.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-tertiary">
                    <span>Wonder Points</span>
                    <span>0 / 500</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-0 h-full vial-fill rounded-full transition-all duration-1000"></div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/session')}
                  className="w-full mt-2 py-3 bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary-dim transition-colors group"
                >
                  Entrar al Lab
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">rocket_launch</span>
                </button>
              </div>
            </div>
          </section>

          {/* Column 2: Indagando (In Progress) */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Indagando
              </h3>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-primary-container/10 p-6 rounded-2xl shadow-[0_20px_40px_rgba(46,46,48,0.06)] border-2 border-primary/20 flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8"></div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary bg-surface-container-lowest/80 px-3 py-1 rounded-full">Energías Verdes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary animate-pulse uppercase">Activo</span>
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-secondary-container">
                      <img
                        alt="Mira AI Tutor"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCff7mcWpu54_mKar8od6mEQtcB0i90FXZECStqJ10dy0VUen31WN4OzrV1eKhXHcthjQvOjSOPZvAfqCTk_M2YeiT1Tw1qnR9xGi_uYn1ahIfeDAybQFJQZjQ9Kcr4xhXkqxNFTkgc50EE2Nc_1LseUuznNBkZpHeNeSV_ZMn02ad8KQXV3odQGsObASzzyu-Y0rftRh2PU9asb7iQmGl2Z4KmwNSklIpugOpvc7JodxFQ9crQebCjg1BH26j7f9OMdZS2yy4lw28"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface leading-tight mb-1">Molinillos del Futuro</h4>
                  <p className="text-sm text-on-surface-variant">Diseñando una ciudad que respira con el viento. ¡Casi lo logras!</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-tertiary">
                    <span>Logic Level</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-[65%] h-full vial-fill rounded-full shadow-[0_0_10px_rgba(255,191,0,0.5)]"></div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/session')}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 group"
                >
                  Continuar Lab
                  <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">science</span>
                </button>
              </div>
            </div>
          </section>

          {/* Column 3: Hipótesis Resueltas (Logros) */}
          <section className="flex flex-col gap-6 opacity-80">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                Hipótesis Resueltas
              </h3>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 flex flex-col gap-4 grayscale-[0.5]">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface-variant px-3 py-1 rounded-full">Arqueología</span>
                  <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface leading-tight mb-1">El Misterio de la Pirámide</h4>
                  <p className="text-sm text-on-surface-variant line-through opacity-60">Has decodificado los jeroglíficos antiguos con éxito.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant">
                    <span>Completado</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="w-full h-full bg-on-surface-variant/20 rounded-full"></div>
                  </div>
                </div>
                <button className="w-full mt-2 py-3 border-2 border-outline-variant text-on-surface-variant rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                  Ver Resultados
                  <span className="material-symbols-outlined text-sm">visibility</span>
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="md:ml-64 bg-surface-variant w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start py-12 px-8 border-t border-outline-variant">
        <div className="flex flex-col gap-4">
          <span className="font-bold text-on-surface">WonderCanvas AI</span>
          <p className="font-sans text-xs uppercase tracking-widest text-on-surface-variant">
            © 2025 WonderCanvas AI · The Digital Alchemist's Workspace
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-xs uppercase tracking-widest text-secondary mb-2">Comunidad</h4>
          <a className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Guía para Padres</a>
          <a className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Recursos Docentes</a>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-xs uppercase tracking-widest text-secondary mb-2">Legal</h4>
          <a className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors underline decoration-primary underline-offset-4" href="#">Privacidad</a>
          <a className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">Soporte Técnico</a>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-widest text-secondary mb-2">Social</h4>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-on-surface-variant">public</span>
            <span className="material-symbols-outlined text-on-surface-variant">hub</span>
          </div>
        </div>
      </footer>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-tertiary text-on-tertiary rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
      </button>

    </div>
  );
};

export default MapaDeExpediciones;
