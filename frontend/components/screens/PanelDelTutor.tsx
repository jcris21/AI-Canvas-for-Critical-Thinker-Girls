import React from 'react';
import { useNavigate } from 'react-router';

const PanelDelTutor: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f5f2f5]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Top Navigation ── */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-primary">WonderCanvas AI</span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="#">Panel</a>
            <a className="text-primary border-b-2 border-primary pb-[1px]" href="#">Misiones</a>
            <a className="hover:text-primary transition-colors" href="#">Biblioteca</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-variant">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-variant">
            <span className="material-symbols-outlined text-xl">help</span>
          </button>
          <img
            alt="User Avatar"
            className="w-8 h-8 rounded-full border border-gray-200"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5tIk65uyzE9-rKm9KXMRRLP42aX6qJf4_O_sC5b8vkz1Ooy3YOtLXgjbWSCfmli7ZHktzRkPg4cSflqumj12lvAMGItVx2htsJc_r9Td-xovqaA2OXMV91rPsjuDLidoLrQ_UwWx42CznSHhcpDnyhkwHPgRBmSLqimUVPj-kdCnZRISwPRw3J-EdkR3w3V0Ab1b4lOayNjB9eKFi8ho99XOEsw4_PDqCzbf9HKBStimL-ycsqqvE-WQaS0V_LBSD9RYmWr8ChRI"
          />
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-64 border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0 hidden lg:flex bg-[#faf8fb]">
          <div className="p-6">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">auto_fix_high</span>
              </div>
              <div>
                <h2 className="font-bold text-on-surface leading-tight">Imaginarium</h2>
                <p className="text-xs text-on-surface-variant">Digital Alchemist</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              <a
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant rounded-xl hover:bg-surface-variant transition-colors cursor-pointer"
                onClick={() => navigate('/student/missions')}
              >
                <span className="material-symbols-outlined text-primary text-xl">explore</span>
                Mapa de Misiones
              </a>
              <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-primary rounded-xl shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                Laboratorio
              </a>
              <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant rounded-xl hover:bg-surface-variant transition-colors" href="#">
                <span className="material-symbols-outlined text-primary text-xl">folder_open</span>
                Archivos del Tutor
              </a>
              <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant rounded-xl hover:bg-surface-variant transition-colors" href="#">
                <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
                Exposiciones de Ideas
              </a>
            </nav>
          </div>

          {/* Bottom links */}
          <div className="mt-auto p-6 space-y-1">
            <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant rounded-xl hover:bg-surface-variant transition-colors" href="#">
              <span className="material-symbols-outlined text-primary text-xl">settings</span>
              Ajustes
            </a>
            <a className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant rounded-xl hover:bg-surface-variant transition-colors" href="#">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">logout</span>
              Cerrar Sesión
            </a>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10">
          <div className="max-w-5xl mx-auto">

            {/* Content Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase mb-2">
                  Módulo de Alquimia Digital
                </p>
                <h1 className="text-3xl font-bold text-on-surface mb-2">Laboratorio de Creación</h1>
                <p className="text-on-surface-variant max-w-xl">
                  Diseña desafíos socráticos que transformen la curiosidad en conocimiento.
                </p>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface font-medium rounded-xl transition-colors shadow-sm text-sm">
                  Guardar Borrador
                </button>
                <button
                  className="px-6 py-2.5 text-white font-medium rounded-xl transition-all shadow-md text-sm"
                  style={{ background: 'linear-gradient(to right, #9720ab, #e43df3)' }}
                >
                  Publicar Misión
                </button>
              </div>
            </div>

            {/* Grid: 2/3 + 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">

              {/* ── Left Column ── */}
              <div className="lg:col-span-2 space-y-8">

                {/* Activos de la Misión */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">deployed_code</span>
                    Activos de la Misión
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[
                      { icon: 'upload_file', label: 'Subir PDF' },
                      { icon: 'image',       label: 'Galería 2D' },
                      { icon: 'view_in_ar',  label: 'Modelos 3D' },
                    ].map(({ icon, label }) => (
                      <button
                        key={label}
                        className="border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary-container/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors text-on-surface-variant hover:text-primary group"
                      >
                        <span className="material-symbols-outlined text-3xl">{icon}</span>
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {/* File item 1 */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">ecosistemas_marinos.pdf</h4>
                          <p className="text-xs text-on-surface-variant">2.4 MB · Documento de consulta</p>
                        </div>
                      </div>
                      <button className="text-error hover:text-on-error hover:bg-error-container p-2 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>

                    {/* File item 2 */}
                    <div className="bg-primary-container/20 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">view_in_ar</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">corales_vivos.glb</h4>
                          <p className="text-xs text-on-surface-variant">15.8 MB · Modelo interactivo</p>
                        </div>
                      </div>
                      <button className="text-error hover:text-on-error hover:bg-error-container p-2 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* Instrucciones Socráticas */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Instrucciones Socráticas
                  </h3>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-on-surface mb-2">
                      Protocolo del Guía AI
                    </label>
                    <textarea
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-on-surface resize-none h-32 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/50"
                      placeholder="Ejemplo: No proporciones respuestas directas. Si el estudiante se bloquea, formula una pregunta sobre las causas raíz..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-secondary text-lg">lightbulb</span>
                        <h4 className="font-bold text-sm text-on-surface">Incitación al por qué</h4>
                      </div>
                      <p className="text-xs text-on-surface-variant">La IA obligará a justificar cada hipótesis antes de validarla.</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-lg">shutter_speed</span>
                        <h4 className="font-bold text-sm text-on-surface">Modo Desafío Temporal</h4>
                      </div>
                      <p className="text-xs text-on-surface-variant">Añade presión de tiempo para fomentar la intuición educada.</p>
                    </div>
                  </div>
                </section>

              </div>

              {/* ── Right Column ── */}
              <div className="space-y-8">

                {/* Etiquetado Curricular */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">sell</span>
                    Etiquetado Curricular
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Biología',              active: true,  color: 'secondary' },
                      { label: 'Ecología',              active: true,  color: 'primary'   },
                      { label: '+ Matemáticas',         active: false, color: null },
                      { label: '+ Ética',               active: false, color: null },
                      { label: '+ Arte',                active: false, color: null },
                      { label: '+ Química',             active: false, color: null },
                      { label: '+ Inteligencia Artificial', active: false, color: null },
                    ].map(({ label, active, color }) => (
                      <button
                        key={label}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          active && color === 'secondary'
                            ? 'bg-secondary-container text-secondary border-secondary'
                            : active && color === 'primary'
                            ? 'bg-primary-container text-primary border-primary'
                            : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container hover:border-primary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Progreso de Hipótesis */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
                  <h3 className="font-bold text-base text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">monitoring</span>
                    Progreso de Hipótesis
                  </h3>

                  <div className="space-y-6">
                    {/* Student 1 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            alt="Mateo V."
                            className="w-6 h-6 rounded-full"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3toaNrUiP0sTNDcYJCqwwx4qLbRrGo_VEASgwqJsi18-LXpfDsn579ntRRVcEdZR3F85hhpya9aRIep_G2x0UwLbBzhoHRuPECJbJeC6Vce9eubIWecq0wH3t0sseoYQwnaMGN9p3anmKyDge7Fne_JcaE8v9p_LtcmIsLVmYJGnGb1vVRvqocjX-ims5430U4tUEZwBLdQLMfN9HbjvbdGSI2dZiKY2eN2zrlQ_t2cqWcD1z1671jGXrWkWifOr3WyzubYByJas"
                          />
                          <span className="text-sm font-medium text-on-surface">Mateo V.</span>
                        </div>
                        <span className="text-xs font-bold text-secondary">85% Alquimia</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full w-[85%] vial-fill rounded-full" />
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1 italic">"La temperatura afecta la fotosíntesis..."</p>
                    </div>

                    {/* Student 2 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            alt="Elena R."
                            className="w-6 h-6 rounded-full"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT1JaEH_yT_ZotIuQWJ62DRygMFL27cQxdkRHiIeNN57S7jMiNSmbNPeqQV0zploPdciK1DDV3i1QKbXmiW11ok8tB206--Ws_2JNLRURozLGfmbgrXfBQ9SPA9knMnKtJX5f5wqDEc8ZW2pm0jtvibJlQos9l_sQtQqTf3VN_IoS4gqqNoHi_MdRGABa2xUMDkvBjSDzXsi18pwacm81XU3FrUASSiaIwuTuQIBVEFiJf5bph_lx05BS8ZaK_EM3sC78-a8qbO0M"
                          />
                          <span className="text-sm font-medium text-on-surface">Elena R.</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">40% Indagando</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full w-[40%] bg-tertiary-container rounded-full" />
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1 italic">Esperando validación de datos...</p>
                    </div>

                    {/* Student 3 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-secondary">JP</div>
                          <span className="text-sm font-medium text-on-surface">Julian P.</span>
                        </div>
                        <span className="text-xs font-bold text-error">Bloqueado</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full w-[10%] bg-error rounded-full" />
                      </div>
                      <p className="text-[10px] text-error mt-1 italic">Requiere intervención de tutor</p>
                    </div>
                  </div>

                  <button className="w-full mt-8 py-3 rounded-xl border border-secondary/20 text-secondary text-sm font-bold hover:bg-secondary/5 transition-colors">
                    Ver Dashboard Completo
                  </button>
                </section>

              </div>
            </div>

            {/* ── Footer ── */}
            <footer className="mt-auto py-8 border-t border-gray-200 text-xs text-on-surface-variant grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <p className="font-bold text-on-surface mb-2">WonderCanvas AI</p>
                <p>© 2025 WonderCanvas AI · The Digital Alchemist's Workspace</p>
              </div>
              <div>
                <p className="font-bold text-on-surface mb-2 uppercase tracking-wider">Comunidad</p>
                <ul className="space-y-2">
                  <li><a className="hover:text-primary transition-colors" href="#">Guía para Padres</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Recursos Docentes</a></li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-on-surface mb-2 uppercase tracking-wider">Legal</p>
                <ul className="space-y-2">
                  <li><a className="hover:text-primary transition-colors" href="#">Privacidad</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Soporte Técnico</a></li>
                </ul>
              </div>
              <div className="text-right">
                <p className="italic text-on-surface-variant mb-2">"El pensamiento es un acto mágico."</p>
                <div className="flex justify-end gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">science</span>
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">auto_awesome</span>
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">history_edu</span>
                </div>
              </div>
            </footer>

          </div>
        </main>

      </div>
    </div>
  );
};

export default PanelDelTutor;
