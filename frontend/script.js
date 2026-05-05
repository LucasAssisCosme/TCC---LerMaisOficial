const API_BASE_URL = window.location.origin || "";

const RUNTIME_API_BASE_URL = String(
  window.APP_CONFIG?.API_BASE_URL ||
    (/127\.0\.0\.1:550\d|localhost:550\d/i.test(API_BASE_URL)
      ? "http://localhost:3000"
      : API_BASE_URL) ||
    "http://localhost:3000",
).replace(/\/$/, "");
const DEFAULT_BOOK_COVER_URL =
  window.APP_CONFIG?.DEFAULT_BOOK_COVER_URL ||
  "https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png";
const SWEETALERT_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js";
const SWEETALERT_STYLE_HREF =
  "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
let sweetAlertLoadPromise = null;

function apiUrl(path = "") {
  if (!path) {
    return RUNTIME_API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${RUNTIME_API_BASE_URL}${normalized}`;
}

window.API_BASE_URL = RUNTIME_API_BASE_URL;
window.DEFAULT_BOOK_COVER_URL = DEFAULT_BOOK_COVER_URL;
window.apiUrl = apiUrl;

// ==================== UPLOAD DE IMAGEM ====================
async function uploadImagemLivro(arquivo) {
  try {
    const formData = new FormData();
    formData.append("imagemFile", arquivo);

    const response = await fetch(apiUrl("/upload-livro-capa"), {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.sucesso) {
      throw new Error(data.mensagem || "Erro ao fazer upload");
    }

    return normalizarUrlMidia(data.url);
  } catch (erro) {
    console.error("[uploadImagemLivro] Erro:", erro);
    throw erro;
  }
}

function normalizarUrlMidia(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  const urlLimpa = url.trim();
  if (!urlLimpa) {
    return "";
  }

  if (/^https?:\/\//i.test(urlLimpa) || urlLimpa.startsWith("data:")) {
    return urlLimpa;
  }

  if (urlLimpa.startsWith("/")) {
    return `${RUNTIME_API_BASE_URL}${urlLimpa}`;
  }

  return `${RUNTIME_API_BASE_URL}/${urlLimpa.replace(/^\.?\//, "")}`;
}

const PAGE_TRANSITION_DURATION = 280;

// Função auxiliar para garantir URLs completas de fotos
function normalizarUrlFoto(url) {
  if (!url) return "";
  
  // Se já é uma URL completa (começa com http/https), retorna como está
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  
  // Se é uma URL relativa, construir a URL completa usando apiUrl
  if (url.startsWith('/')) {
    return apiUrl(url);
  }
  
  // Caso contrário, adicionar / e usar apiUrl
  return apiUrl('/' + url);
}

function setupPageTransitions() {
  if (!document.body || document.getElementById("page-transition-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "page-transition-style";
  style.textContent = `
    html {
      scroll-behavior: smooth;
    }

    body.page-transition-ready {
      opacity: 1;
      transform: translateY(0);
      transition:
        opacity ${PAGE_TRANSITION_DURATION}ms ease,
        transform ${PAGE_TRANSITION_DURATION}ms ease;
    }

    body.page-enter {
      opacity: 0;
      transform: translateY(12px);
    }

    body.page-exit {
      opacity: 0;
      transform: translateY(-10px);
      pointer-events: none;
    }
  `;

  document.head.appendChild(style);
  document.body.classList.add("page-transition-ready", "page-enter");

  requestAnimationFrame(() => {
    document.body.classList.remove("page-enter");
  });
}

function navegarComTransicao(url) {
  if (!url || document.body?.classList.contains("page-exit")) {
    return;
  }

  document.body?.classList.add("page-exit");

  window.setTimeout(() => {
    window.location.href = url;
  }, PAGE_TRANSITION_DURATION);
}

function setupTransitionLinks() {
  if (document.body?.dataset.transitionLinksReady === "true") {
    return;
  }

  document.body.dataset.transitionLinksReady = "true";

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) {
      return;
    }

    const href = link.getAttribute("href");
    if (!href || href === "#" || link.hasAttribute("download")) {
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.dataset.noTransition === "true"
    ) {
      return;
    }

    if (href.startsWith("#")) {
      const destino = document.querySelector(href);
      if (destino) {
        event.preventDefault();
        destino.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    navegarComTransicao(url.href);
  });
}

const SKELETON_STYLE_ID = "ler-mais-skeleton-style";

function setupSkeletonStyles() {
  if (
    !document.head ||
    document.getElementById(SKELETON_STYLE_ID)
  ) {
    return;
  }

  const style = document.createElement("style");
  style.id = SKELETON_STYLE_ID;
  style.textContent = `
    @keyframes lm-skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .lm-skeleton {
      display: block;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.08) 25%,
        rgba(255, 255, 255, 0.18) 37%,
        rgba(255, 255, 255, 0.08) 63%
      );
      background-size: 200% 100%;
      animation: lm-skeleton-shimmer 1.3s linear infinite;
      border-radius: 16px;
    }

    .lm-skeleton-line {
      height: 14px;
      border-radius: 999px;
    }

    .lm-skeleton-line.lm-lg {
      height: 22px;
    }

    .lm-skeleton-line.lm-xl {
      height: 34px;
    }

    .lm-skeleton-circle {
      border-radius: 999px;
    }

    .lm-loading-host {
      position: relative;
    }

    .lm-loading-host.lm-loading > *:not(.lm-skeleton-overlay) {
      visibility: hidden;
    }

    .lm-skeleton-overlay {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 24px;
      pointer-events: none;
    }

    .lm-skeleton-page {
      display: flex;
      flex-direction: column;
      gap: 18px;
      width: 100%;
    }

    .lm-skeleton-hero {
      display: flex;
      gap: 24px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .lm-skeleton-stack {
      flex: 1;
      min-width: 280px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .lm-skeleton-cover-large {
      width: 220px;
      max-width: 100%;
      aspect-ratio: 11 / 17;
      flex-shrink: 0;
      border-radius: 16px;
    }

    .lm-skeleton-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 140px;
      padding: 18px 22px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.05);
    }

    .lm-skeleton-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }

    .lm-skeleton-field {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .lm-skeleton-input {
      height: 48px;
      border-radius: 14px;
    }

    .lm-skeleton-textarea {
      height: 140px;
      border-radius: 18px;
    }

    .lm-skeleton-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
    }

    .lm-skeleton-button {
      width: 160px;
      height: 44px;
      border-radius: 12px;
    }

    .lm-skeleton-book-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .lm-skeleton-book-cover {
      width: 100%;
      aspect-ratio: 11 / 17;
      border-radius: 14px;
    }

    .lm-skeleton-book-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 0 4px;
    }

    .lm-skeleton-book-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 25px;
    }

    .lm-skeleton-status-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin-top: 8px;
    }

    .lm-skeleton-status-item {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .lm-skeleton-flag {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      flex-shrink: 0;
    }

    @media (max-width: 1280px) {
      .lm-skeleton-book-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    @media (max-width: 992px) {
      .lm-skeleton-book-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .lm-skeleton-overlay {
        padding: 18px;
      }

      .lm-skeleton-book-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .lm-skeleton-cover-large {
        width: min(220px, 100%);
      }
    }

    @media (max-width: 520px) {
      .lm-skeleton-book-grid,
      .lm-skeleton-form {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

function skeletonLine(width = "100%", extraClass = "") {
  const classes = ["lm-skeleton", "lm-skeleton-line", extraClass]
    .filter(Boolean)
    .join(" ");
  return `<span class="${classes}" style="width:${width}"></span>`;
}

function skeletonBlock(height, width = "100%", extraClass = "") {
  const classes = ["lm-skeleton", extraClass].filter(Boolean).join(" ");
  return `<span class="${classes}" style="height:${height};width:${width}"></span>`;
}

function skeletonBookCardsMarkup(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="lm-skeleton-book-card">
      <span class="lm-skeleton lm-skeleton-book-cover"></span>
      <div class="lm-skeleton-book-meta">
        ${skeletonLine("88%", "lm-lg")}
        ${skeletonLine("62%")}
      </div>
    </div>
  `).join("");
}

function renderSkeletonOverlay(host, markup, extraClass = "") {
  if (!host) {
    return;
  }

  setupSkeletonStyles();

  host.classList.add("lm-loading-host", "lm-loading");

  let overlay = host.querySelector(".lm-skeleton-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    host.appendChild(overlay);
  }

  overlay.className = `lm-skeleton-overlay ${extraClass}`.trim();
  overlay.innerHTML = markup;
}

function clearSkeletonOverlay(host) {
  if (!host) {
    return;
  }

  host.classList.remove("lm-loading-host", "lm-loading");
  const overlay = host.querySelector(".lm-skeleton-overlay");
  if (overlay) {
    overlay.remove();
  }
}

function showBibliotecaSkeleton() {
  setupSkeletonStyles();

  const countEl = document.querySelector(".books-header h3");
  if (countEl) {
    countEl.innerHTML = skeletonLine("190px", "lm-lg");
  }

  const row = document.querySelector(".books-grid .row");
  if (row) {
    row.innerHTML = Array.from({ length: 6 }, () => `
      <div class="col-6 col-md-4 col-lg-3 col-xl-2">
        ${skeletonBookCardsMarkup(1)}
      </div>
    `).join("");
  }

  const rankElem = document.querySelector(".ranking-text.mb-2");
  if (rankElem) {
    rankElem.innerHTML = `
      ${skeletonLine("100%", "lm-xl")}
      <div style="margin-top:12px;">${skeletonLine("78%", "lm-lg")}</div>
    `;
  }

  const pageMeterElem = document.querySelector(
    ".overview-card .paginometro-value",
  );
  if (pageMeterElem) {
    pageMeterElem.innerHTML = skeletonLine("140px", "lm-lg");
  }
}

function marcarCapaLivroCarregada(img) {
  if (!img) {
    return;
  }

  img.classList.add("is-loaded");
  const cover = img.closest(".book-cover");
  if (cover) {
    cover.classList.add("cover-loaded");
  }
}

function tratarErroCapaLivro(img) {
  if (!img) {
    return;
  }

  const fallback = DEFAULT_BOOK_COVER_URL;

  if (img.dataset.fallbackApplied === "true") {
    marcarCapaLivroCarregada(img);
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.src = normalizarUrlMidia(fallback);
}

function showPerfilSkeleton() {
  const host = document.querySelector(".perfil-container");
  if (!host) {
    return;
  }

  renderSkeletonOverlay(
    host,
    `
      <div class="lm-skeleton-page">
        ${skeletonLine("220px", "lm-xl")}
        ${skeletonBlock("150px", "150px", "lm-skeleton-circle")}
        <div class="lm-skeleton-form">
          <div class="lm-skeleton-field">
            ${skeletonLine("90px")}
            ${skeletonBlock("48px", "100%", "lm-skeleton-input")}
          </div>
          <div class="lm-skeleton-field">
            ${skeletonLine("120px")}
            ${skeletonBlock("48px", "100%", "lm-skeleton-input")}
          </div>
          <div class="lm-skeleton-field">
            ${skeletonLine("90px")}
            ${skeletonBlock("48px", "100%", "lm-skeleton-input")}
          </div>
          <div class="lm-skeleton-field">
            ${skeletonLine("110px")}
            ${skeletonBlock("48px", "100%", "lm-skeleton-input")}
          </div>
          <div class="lm-skeleton-field" style="grid-column: 1 / -1;">
            ${skeletonLine("70px")}
            ${skeletonBlock("140px", "100%", "lm-skeleton-textarea")}
          </div>
        </div>
        <div class="lm-skeleton-actions">
          ${skeletonBlock("44px", "150px", "lm-skeleton-button")}
          ${skeletonBlock("44px", "150px", "lm-skeleton-button")}
          ${skeletonBlock("44px", "150px", "lm-skeleton-button")}
        </div>
      </div>
    `,
  );
}

function hidePerfilSkeleton() {
  clearSkeletonOverlay(document.querySelector(".perfil-container"));
}

function showAvaliacaoSkeleton() {
  const host = document.querySelector(".avaliacao-container");
  if (!host) {
    return;
  }

  renderSkeletonOverlay(
    host,
    `
      <div class="lm-skeleton-page">
        <div class="lm-skeleton-hero">
          ${skeletonBlock("350px", "220px", "lm-skeleton-cover-large")}
          <div class="lm-skeleton-stack">
            ${skeletonLine("72%", "lm-xl")}
            ${skeletonLine("96%")}
            ${skeletonLine("88%")}
            ${skeletonBlock("48px", "260px", "lm-skeleton-input")}
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">
              ${Array.from({ length: 5 }, () => skeletonBlock("34px", "34px", "lm-skeleton-circle")).join("")}
            </div>
          </div>
        </div>
        <div class="lm-skeleton-panel">
          ${skeletonLine("150px", "lm-lg")}
          ${skeletonLine("100%")}
          ${skeletonLine("92%")}
          ${skeletonLine("70%")}
          ${skeletonBlock("40px", "110px", "lm-skeleton-button")}
        </div>
        <div class="lm-skeleton-panel">
          ${skeletonLine("170px", "lm-lg")}
          ${skeletonLine("100%")}
          ${skeletonLine("86%")}
          ${skeletonLine("74%")}
          ${skeletonBlock("40px", "110px", "lm-skeleton-button")}
        </div>
      </div>
    `,
  );
}

function hideAvaliacaoSkeleton() {
  clearSkeletonOverlay(document.querySelector(".avaliacao-container"));
}

function showInformacoesSkeleton() {
  const host = document.querySelector(".informacoes-container");
  if (!host) {
    return;
  }

  renderSkeletonOverlay(
    host,
    `
      <div class="lm-skeleton-page">
        <div class="lm-skeleton-hero">
          ${skeletonBlock("360px", "240px", "lm-skeleton-cover-large")}
          <div class="lm-skeleton-stack">
            ${skeletonLine("68%", "lm-xl")}
            ${skeletonLine("42%")}
            ${skeletonLine("82%")}
            ${skeletonLine("66%")}
            ${skeletonLine("54%")}
            <div class="lm-skeleton-panel" style="padding:0;background:transparent;min-height:auto;">
              ${skeletonLine("130px", "lm-lg")}
              ${skeletonLine("100%")}
              ${skeletonLine("96%")}
              ${skeletonLine("88%")}
              ${skeletonLine("72%")}
            </div>
            <div class="lm-skeleton-actions">
              ${skeletonBlock("44px", "180px", "lm-skeleton-button")}
              ${skeletonBlock("44px", "180px", "lm-skeleton-button")}
            </div>
          </div>
        </div>
      </div>
    `,
  );
}

function hideInformacoesSkeleton() {
  clearSkeletonOverlay(document.querySelector(".informacoes-container"));
}

window.renderIndexSkeleton = function renderIndexSkeleton() {
  const container = document.getElementById("categoriesContainer");
  if (!container) {
    return;
  }

  setupSkeletonStyles();

  container.innerHTML = `
    <h2 class="section-title">MAIS FAMOSOS DO MOMENTO</h2>
    ${["ROMANCE", "FANTASIA"].map((titulo) => `
      <div class="categoria">
        <h3>${titulo}</h3>
        <div class="lm-skeleton-book-grid">
          ${skeletonBookCardsMarkup(6)}
        </div>
      </div>
    `).join("")}
  `;
};

// ==================== VALIDAR SENHA ====================
function validarSenha(senha) {
// Validações básicas
if (!senha || typeof senha !== "string") {
  return {
    valida: false,
    mensagem: "Senha inválida",
  };
}

// Verificar comprimento (8 a 32 caracteres)
if (senha.length < 8 || senha.length > 32) {
  return {
    valida: false,
    mensagem: "Senha deve ter entre 8 e 32 caracteres",
  };
}

// Verificar espaços
if (/\s/.test(senha)) {
  return { valida: false, mensagem: "Senha não pode conter espaços" };
}

// Verificar acentuação
const semAcentos = senha.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
if (semAcentos !== senha) {
  return { valida: false, mensagem: "Senha não pode conter acentuação" };
}

// Verificar letra maiúscula
if (!/[A-Z]/.test(senha)) {
  return {
    valida: false,
    mensagem: "Senha deve conter pelo menos uma letra maiúscula",
  };
}

// Verificar letra minúscula
if (!/[a-z]/.test(senha)) {
  return {
    valida: false,
    mensagem: "Senha deve conter pelo menos uma letra minúscula",
  };
}

// Verificar número
if (!/\d/.test(senha)) {
  return {
    valida: false,
    mensagem: "Senha deve conter pelo menos um número",
  };
}

// Verificar símbolo (caracteres especiais permitidos)
if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
  return {
    valida: false,
    mensagem: `Senha deve conter pelo menos um símbolo: !@#$%^&*()_+-=[]{};\\':"\\|,.<>/?`,
  };
}

return { valida: true, mensagem: "Senha válida" };

}

function atualizarFeedbackFormulario(feedbackId, mensagem = "", tipo = "") {
  const feedback = document.getElementById(feedbackId);
  if (!feedback) return;

  feedback.textContent = mensagem || "";
  feedback.classList.remove("is-error", "is-success", "is-loading");

  if (tipo) {
    feedback.classList.add(`is-${tipo}`);
  }
}

function garantirSweetAlertEstilos() {
  if (
    document.querySelector(`link[data-sweetalert-style="true"]`) ||
    document.querySelector(`link[href="${SWEETALERT_STYLE_HREF}"]`)
  ) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = SWEETALERT_STYLE_HREF;
  link.dataset.sweetalertStyle = "true";
  document.head.appendChild(link);
}

function garantirSweetAlert() {
  garantirSweetAlertEstilos();

  if (window.Swal?.fire) {
    return Promise.resolve(window.Swal);
  }

  if (sweetAlertLoadPromise) {
    return sweetAlertLoadPromise;
  }

  sweetAlertLoadPromise = new Promise((resolve) => {
    const scriptExistente = document.getElementById("sweetalert2-script");

    if (scriptExistente) {
      scriptExistente.addEventListener(
        "load",
        () => resolve(window.Swal || null),
        { once: true },
      );
      scriptExistente.addEventListener(
        "error",
        () => resolve(null),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "sweetalert2-script";
    script.src = SWEETALERT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Swal || null);
    script.onerror = () => {
      console.warn("[garantirSweetAlert] Falha ao carregar SweetAlert2.");
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return sweetAlertLoadPromise;
}

function obterTituloAlertaPorTipo(tipo = "info") {
  switch (tipo) {
    case "success":
      return "Sucesso";
    case "warning":
      return "Atenção";
    case "error":
      return "Erro";
    case "loading":
      return "Carregando";
    default:
      return "Aviso";
  }
}

function obterIconeAlertaPorTipo(tipo = "info") {
  switch (tipo) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "info";
  }
}

function obterOpcoesBaseSweetAlert(options = {}) {
  return {
    confirmButtonColor: "#7a1f05",
    cancelButtonColor: "#a45c2a",
    background: "#fffaf5",
    color: "#51210f",
    reverseButtons: true,
    ...options,
  };
}

async function exibirAlertaApp(options = {}) {
  const swal = await garantirSweetAlert();
  const config = obterOpcoesBaseSweetAlert(options);

  if (!swal?.fire) {
    const mensagem = config.text || config.title || "";

    if (config.showCancelButton) {
      return {
        isConfirmed: window.confirm(mensagem),
        isDismissed: false,
      };
    }

    if (mensagem) {
      alert(mensagem);
    }

    return {
      isConfirmed: true,
      isDismissed: false,
    };
  }

  return swal.fire(config);
}

function exibirFeedbackOuAlert(
  feedbackId,
  mensagem = "",
  tipo = "error",
  options = {},
) {
  const {
    mostrarPopup = false,
    manterFeedback = false,
    title,
    icon,
    ...alertOptions
  } = options;
  const feedback = document.getElementById(feedbackId);
  const deveMostrarFeedback =
    !!feedback && (tipo === "loading" || !mostrarPopup || manterFeedback);

  if (feedback) {
    if (deveMostrarFeedback) {
      atualizarFeedbackFormulario(feedbackId, mensagem, tipo);
    } else {
      atualizarFeedbackFormulario(feedbackId);
    }
  }

  if (mensagem && tipo !== "loading" && (!feedback || mostrarPopup)) {
    void exibirAlertaApp({
      icon: icon || obterIconeAlertaPorTipo(tipo),
      title: title || obterTituloAlertaPorTipo(tipo),
      text: mensagem,
      ...alertOptions,
    });
  }

  return deveMostrarFeedback;
}

async function cadastrarUsuario(formData) {
  try {
    const senha = formData.get("senha");
    atualizarFeedbackFormulario("cadastroUsuarioFeedback");
    const containerSugestoes = document.getElementById("sugestoesApelido");
    if (containerSugestoes) {
      containerSugestoes.style.display = "none";
    }

    // Validar senha
    const validacaoSenha = validarSenha(senha);
    if (!validacaoSenha.valida) {
      exibirFeedbackOuAlert(
        "cadastroUsuarioFeedback",
        validacaoSenha.mensagem,
        "error",
        {
          mostrarPopup: true,
          title: "Senha inválida",
        },
      );
      return;
    }

    atualizarFeedbackFormulario(
      "cadastroUsuarioFeedback",
      "Cadastrando usuário...",
      "loading",
    );

    const payload = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      senha: senha,
      tipo: "aluno",
      genero_favorito: formData.get("genero_favorito"),
      apelido: formData.get("apelido"),
    };

    const resposta = await fetch(apiUrl("/usuario/cadastrar"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));

      // Tratamento especial para username duplicado
      if (resposta.status === 409 && erroBody.campo === "apelido") {
        exibirFeedbackOuAlert(
          "cadastroUsuarioFeedback",
          "Esse apelido já está em uso. Escolha uma sugestão abaixo.",
          "error",
          {
            mostrarPopup: true,
            title: "Apelido indisponível",
          },
        );
        exibirSugestoesApelido(erroBody.sugestoes || []);
        return;
      }

      const detalhes = Array.isArray(erroBody.detalhes)
        ? erroBody.detalhes
            .map((item) => `${item.path || item.param || "campo"}: ${item.msg}`)
            .join("; ")
        : "";

      throw new Error(
        detalhes || erroBody.mensagem || erroBody.erro || `Erro ${resposta.status}`,
      );
    }

    const data = await resposta.json();
    exibirFeedbackOuAlert(
      "cadastroUsuarioFeedback",
      "Cadastro realizado com sucesso!",
      "success",
      {
        mostrarPopup: true,
        title: "Conta criada",
        timer: 2600,
        timerProgressBar: true,
        showConfirmButton: false,
      },
    );

    // Auto-login após cadastro bem-sucedido
    try {
      const loginFormData = new FormData();
      loginFormData.append("email", formData.get("email"));
      loginFormData.append("senha", senha);

      await loginUsuario(loginFormData, true, 5000); // true = auto-login, não mostra alert
    } catch (loginError) {
      console.error("Erro no auto-login:", loginError);
      // Se auto-login falhar, redireciona para login manual
      setTimeout(() => {
        window.location.href = "/frontend/login.html";
      }, 5000);
    }

    return data;
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    exibirFeedbackOuAlert(
      "cadastroUsuarioFeedback",
      "Erro ao cadastrar usuário: " + (error.message || error),
      "error",
      {
        mostrarPopup: true,
        title: "Não foi possível cadastrar",
      },
    );
  }
}

async function cadastrarLivro(formData) {
  const form = document.querySelector("form.cadastro-livro-form");
  const botaoSubmit = form?.querySelector('button[type="submit"]');

  try {
    if (botaoSubmit) {
      botaoSubmit.disabled = true;
      botaoSubmit.dataset.originalText = botaoSubmit.textContent || "Confirmar";
      botaoSubmit.textContent = "Cadastrando...";
    }

    atualizarFeedbackFormulario("cadastroLivroFeedback");
    const token = getToken();
    if (!token) {
      atualizarFeedbackFormulario(
        "cadastroLivroFeedback",
        "Você precisa estar logado para cadastrar livros.",
        "error",
      );
      await exibirAlertaApp({
        icon: "warning",
        title: "Login necessário",
        text: "Você precisa estar logado para cadastrar livros.",
      });
      window.location.href = "/frontend/login.html";
      return;
    }

    const usuarioId = getUsuarioLogadoId();
    if (!usuarioId) {
      exibirFeedbackOuAlert(
        "cadastroLivroFeedback",
        "Erro: ID do usuário não encontrado.",
        "error",
        {
          mostrarPopup: true,
          title: "Usuário não identificado",
        },
      );
      return;
    }

    // Verificar se há arquivo de imagem (obrigatório)
    const arquivoImagem = document.getElementById("inputImagemLivro")?.files[0];
    if (!arquivoImagem) {
      exibirFeedbackOuAlert(
        "cadastroLivroFeedback",
        "Por favor, selecione uma imagem para o livro.",
        "error",
        {
          mostrarPopup: true,
          title: "Imagem obrigatória",
        },
      );
      return;
    }

    atualizarFeedbackFormulario(
      "cadastroLivroFeedback",
      "Enviando imagem e cadastrando livro...",
      "loading",
    );

    let urlImagem;

    // Fazer upload da imagem
    try {
      urlImagem = await uploadImagemLivro(arquivoImagem);
      if (!urlImagem) {
        throw new Error("URL da imagem não foi retornada");
      }
    } catch (erro) {
      exibirFeedbackOuAlert(
        "cadastroLivroFeedback",
        "Erro ao fazer upload da imagem: " + erro.message,
        "error",
        {
          mostrarPopup: true,
          title: "Falha no upload",
        },
      );
      return;
    }

    const payload = {
      titulo: formData.get("nome"),
      autor: formData.get("autor"),
      genero: normalizarGeneroLivro(formData.get("assunto")),
      ano: parseInt(formData.get("ano")),
      numero_paginas: parseInt(formData.get("paginas")),
      descricao: formData.get("descricao"),
      imagem_capa: urlImagem,
      editora: formData.get("editora"),
      tipo_usuario: getUsuarioLogadoTipo(),
    };

    // Frontend guard: campo ano dentro do intervalo aceito pelo backend
    if (
      !payload.ano ||
      payload.ano < 1000 ||
      payload.ano > new Date().getFullYear()
    ) {
      exibirFeedbackOuAlert(
        "cadastroLivroFeedback",
        "Ano inválido. Use um ano entre 1000 e " +
          new Date().getFullYear() +
          ".",
        "error",
        {
          mostrarPopup: true,
          title: "Ano inválido",
        },
      );
      return;
    }

    if (!payload.numero_paginas || payload.numero_paginas < 1) {
      exibirFeedbackOuAlert(
        "cadastroLivroFeedback",
        "Número de páginas inválido.",
        "error",
        {
          mostrarPopup: true,
          title: "Quantidade inválida",
        },
      );
      return;
    }

    console.log("Enviando dados do livro:", payload);

    const resposta = await fetch(apiUrl("/livros/cadastrar"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      if (resposta.status === 400 && data.detalhes) {
        const detalhes = data.detalhes
          .map((d) => `${d.param}: ${d.msg}`)
          .join(" | ");
        throw new Error(`Erro 400 - validação: ${detalhes}`);
      }
      throw new Error(data.mensagem || `Erro ${resposta.status}`);
    }

    console.log("Livro cadastrado com sucesso:", data);

    atualizarFeedbackFormulario("cadastroLivroFeedback");
    await exibirAlertaApp({
      icon: "success",
      title: "Livro cadastrado",
      text: "Livro cadastrado com sucesso!",
      confirmButtonText: "OK",
      allowOutsideClick: false,
      allowEscapeKey: true,
    });

    window.location.href = "/frontend/src/pages/index.html";
  } catch (error) {
    console.error("Erro ao cadastrar livro:", error);
    exibirFeedbackOuAlert(
      "cadastroLivroFeedback",
      "Erro ao cadastrar livro: " + (error.message || error),
      "error",
      {
        mostrarPopup: true,
        title: "Falha ao cadastrar livro",
      },
    );
  } finally {
    if (botaoSubmit) {
      botaoSubmit.disabled = false;
      botaoSubmit.textContent = botaoSubmit.dataset.originalText || "Confirmar";
      delete botaoSubmit.dataset.originalText;
    }
  }
}

function exibirSugestoesApelido(sugestoes) {
  const containerSugestoes = document.getElementById("sugestoesApelido");
  const listaSugestoes = document.getElementById("listaSugestoes");
  const inputApelido = document.getElementById("inputApelido");

  if (!containerSugestoes || !listaSugestoes || !inputApelido) {
    console.error("Elementos de sugestão não encontrados");
    return;
  }

  // Limpar lista anterior
  listaSugestoes.innerHTML = "";

  if (!Array.isArray(sugestoes) || sugestoes.length === 0) {
    containerSugestoes.style.display = "none";
    return;
  }

  // Criar botões para cada sugestão
  sugestoes.forEach((sugestao) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn-outline-primary btn-sm me-2 mb-2";
    botao.textContent = sugestao;

    botao.addEventListener("click", (e) => {
      e.preventDefault();
      inputApelido.value = sugestao;
      containerSugestoes.style.display = "none";
      inputApelido.focus();
    });

    listaSugestoes.appendChild(botao);
  });

  // Mostrar container de sugestões
  containerSugestoes.style.display = "block";
}

function initCadastroUsuario() {
  const form = document.querySelector("form.cadastro-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await cadastrarUsuario(formData);
  });
}

function atualizarVisibilidadeSenha(botao, input, mostrarSenha) {
  if (!botao || !input) {
    return;
  }

  input.type = mostrarSenha ? "text" : "password";

  const acao = mostrarSenha ? "Ocultar senha" : "Mostrar senha";
  botao.setAttribute("aria-pressed", String(mostrarSenha));
  botao.setAttribute("aria-label", acao);
  botao.setAttribute("title", acao);

  const label = botao.querySelector(".password-toggle__label");
  if (label) {
    label.textContent = acao;
  }
}

function initPasswordToggles() {
  const botoes = document.querySelectorAll("[data-password-toggle]");
  if (!botoes.length) {
    return;
  }

  botoes.forEach((botao) => {
    if (botao.dataset.passwordToggleReady === "true") {
      return;
    }

    const inputId = botao.getAttribute("aria-controls");
    const input =
      (inputId && document.getElementById(inputId)) ||
      botao.closest(".password-field")?.querySelector("input");

    if (!input) {
      return;
    }

    atualizarVisibilidadeSenha(botao, input, input.type === "text");

    botao.addEventListener("click", () => {
      const mostrarSenha = input.type === "password";
      atualizarVisibilidadeSenha(botao, input, mostrarSenha);
    });

    botao.dataset.passwordToggleReady = "true";
  });
}

function initCadastroLivro() {
  const form = document.querySelector("form.cadastro-livro-form");
  if (!form) return;

  if (form.dataset.submitReady === "true") {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await cadastrarLivro(formData);
  });

  form.dataset.submitReady = "true";
}

function exibirAlertaLogin(options = {}) {
  garantirSweetAlertEstilos();

  if (!window.Swal?.fire) {
    return null;
  }

  return window.Swal.fire(obterOpcoesBaseSweetAlert(options));
}

function mostrarCarregamentoLogin() {
  if (!window.Swal?.fire) {
    return false;
  }

  void exibirAlertaLogin({
    title: "Entrando...",
    text: "Estamos verificando seus dados.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      window.Swal.showLoading();
    },
  });

  return true;
}

async function loginUsuario(
  formData,
  isAutoLogin = false,
  redirectDelayMs = 3000,
) {
  try {
    let loginComSwal = false;

    if (!isAutoLogin) {
      loginComSwal = mostrarCarregamentoLogin();

      if (!loginComSwal) {
        atualizarFeedbackFormulario("loginFeedback", "Entrando...", "loading");
      } else {
        atualizarFeedbackFormulario("loginFeedback");
      }
    }

    const payload = {
      email: formData.get("email"),
      senha: formData.get("senha"),
    };

    const resposta = await fetch(apiUrl("/usuario/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.erro || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();

    // Salva usuário logado para usar biblioteca/ranking
    if (data.usuario && data.usuario.id) {
      const userId = String(data.usuario.id).trim();
      localStorage.setItem("usuarioLogadoId", userId);

      const tipo = normalizarTipo(String(data.usuario.tipo || "aluno"));
      localStorage.setItem("usuarioLogadoTipo", tipo);

      const apelido = String(data.usuario.apelido || data.usuario.nome || "").trim();
      localStorage.setItem("usuarioLogadoApelido", apelido);
      atualizarApelidoPerfilHeader(apelido);

      console.log("[Login realizado]", {
        usuarioId: userId,
        usuarioTipo: tipo,
      });

      // Atualiza acesso aos recursos baseado no tipo de usuário
      atualizarAcessoCadastroLivro();
    }

    // Salva o token JWT
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    if (!isAutoLogin) {
      if (loginComSwal) {
        window.Swal.close();
        void exibirAlertaLogin({
          icon: "success",
          title: "Login realizado com sucesso!",
          text: "Redirecionando para a página inicial...",
          timer: redirectDelayMs,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } else {
        exibirFeedbackOuAlert(
          "loginFeedback",
          "Login realizado com sucesso!",
          "success",
        );
      }
    }

    // Redireciona para a página principal (ajuste conforme sua estrutura)
    setTimeout(() => {
      window.location.href = "/frontend/src/pages/index.html";
    }, redirectDelayMs);

    return data;
  } catch (error) {
    console.error("Erro ao logar:", error);
    if (!isAutoLogin) {
      if (window.Swal?.isVisible()) {
        window.Swal.close();
      }

      if (window.Swal?.fire) {
        await exibirAlertaLogin({
          icon: "error",
          title: "Erro ao fazer login",
          text: error.message || String(error),
        });
        atualizarFeedbackFormulario("loginFeedback");
      } else {
        exibirFeedbackOuAlert(
          "loginFeedback",
          "Erro ao logar: " + (error.message || error),
          "error",
        );
      }
    }
    throw error;
  }
}

function initLogin() {
  const form = document.querySelector("form.login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    try {
      await loginUsuario(formData);
    } catch (error) {
      console.error("[initLogin] Falha no login:", error);
    }
  });
}

async function redefinirSenha(formData) {
  try {
    const novaSenha = formData.get("nova_senha");
    const confirmarSenha = formData.get("senha");

    // Validar nova senha
    const validacaoSenha = validarSenha(novaSenha);
    if (!validacaoSenha.valida) {
      await exibirAlertaApp({
        icon: "error",
        title: "Senha inválida",
        text: validacaoSenha.mensagem,
      });
      return;
    }

    // Validar se as senhas coincidem
    if (novaSenha !== confirmarSenha) {
      await exibirAlertaApp({
        icon: "error",
        title: "Senhas diferentes",
        text: "As senhas não coincidem.",
      });
      return;
    }

    const payload = {
      email: formData.get("email"),
      novaSenha: novaSenha,
      confirmarSenha: confirmarSenha,
    };

    const resposta = await fetch(
      apiUrl("/usuario/esqueceuSenha"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.mensagem || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    await exibirAlertaApp({
      icon: "success",
      title: "Senha redefinida",
      text: "Sua senha foi redefinida com sucesso.",
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    });
    window.location.href = "/frontend/login.html";
    return data;
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    await exibirAlertaApp({
      icon: "error",
      title: "Erro ao redefinir senha",
      text: error.message || String(error),
    });
    throw error;
  }
}

function initRedefinirSenha() {
  const form = document.querySelector("form.redefinir-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await redefinirSenha(formData);
  });
}

function getStatusTag(progresso) {
  switch (progresso) {
    case "lido":
      return { ribbonClass: "ribbon-lido", label: "Lido", progressClass: "is-lido" };
    case "lendo":
      return { ribbonClass: "ribbon-lendo", label: "Lendo", progressClass: "is-lendo" };
    case "quero_ler":
    default:
      return { ribbonClass: "ribbon-quero", label: "Quero ler", progressClass: "is-quero-ler" };
  }
}

function getBookPageProgress(book, progresso) {
  const totalPaginas = Number(book?.numero_paginas || book?.paginas || 0);
  const paginasLidasInformadas = Number(
    book?.paginas_lidas ?? book?.pagina_atual ?? book?.progresso_paginas ?? 0,
  );

  let paginasLidas = Number.isFinite(paginasLidasInformadas)
    ? paginasLidasInformadas
    : 0;

  if ((!paginasLidas || paginasLidas < 0) && progresso === "lido" && totalPaginas > 0) {
    paginasLidas = totalPaginas;
  }

  paginasLidas = Math.max(0, Math.min(paginasLidas, totalPaginas || paginasLidas));

  const percentual =
    totalPaginas > 0 ? Math.round((paginasLidas / totalPaginas) * 100) : 0;

  return {
    totalPaginas,
    paginasLidas,
    percentual,
  };
}

function getUsuarioLogadoId() {
  const id = localStorage.getItem("usuarioLogadoId");
  return id ? id.trim() : null;
}

function normalizarTipo(tipo) {
  if (!tipo || typeof tipo !== "string") return "aluno";
  return tipo
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getUsuarioLogadoTipo() {
  return normalizarTipo(localStorage.getItem("usuarioLogadoTipo") || "aluno");
}

function getToken() {
  return localStorage.getItem("token");
}

function getPerfilHeaderImageElement() {
  return document.querySelector(".perfil-img, .info-perfil .perfil img");
}

function getPerfilHeaderNameElement() {
  return document.querySelector(".perfil-nome, .info-perfil .perfil a");
}

function atualizarApelidoPerfilHeader(apelido) {
  const nomePerfil = getPerfilHeaderNameElement();
  if (!nomePerfil) return;

  const texto = String(apelido || "").trim();
  nomePerfil.textContent = texto || "PERFIL";
}

function logout() {
  localStorage.removeItem("usuarioLogadoId");
  localStorage.removeItem("usuarioLogadoTipo");
  localStorage.removeItem("usuarioLogadoApelido");
  localStorage.removeItem("token");

  atualizarApelidoPerfilHeader("");

  // Limpa o intervalo de atualização se estiver ativo
  if (bibliotecaAutoRefreshId !== null) {
    clearInterval(bibliotecaAutoRefreshId);
    bibliotecaAutoRefreshId = null;
  }

  setTimeout(() => {
    window.location.href = "/frontend/login.html";
  }, 300);
}

function isBibliotecariaLogada() {
  const tipo = getUsuarioLogadoTipo();
  return [
    "bibliotecaria",
    "bibliotecario",
    "professor",
  ].includes(tipo);
}

function atualizarAcaoInformacoesAvaliacao() {
  const botao = document.getElementById("btnAcaoInformacoes");
  if (!botao) return;

  const rotulo = "Ver informações";

  const textoExistente = Array.from(botao.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE,
  );

  if (textoExistente) {
    textoExistente.textContent = ` ${rotulo}`;
  } else {
    botao.append(document.createTextNode(` ${rotulo}`));
  }
}

function atualizarAcessoCadastroLivro() {
  const podeCadastrar = isBibliotecariaLogada();

  // Seleciona todos os links que contenham "cadastroLivro.html" no href
  const links = document.querySelectorAll('a[href*="cadastroLivro.html"]');

  links.forEach((link) => {
    if (podeCadastrar) {
      link.style.display = "";
      link.parentElement.style.display = ""; // Mostra também o elemento pai (li)
    } else {
      link.style.display = "none";
      link.parentElement.style.display = "none"; // Esconde também o elemento pai (li)
    }
  });

  // Verifica se usuário não autorizado está na página de cadastro
  if (!podeCadastrar && window.location.href.includes("cadastroLivro.html")) {
    alert("Acesso negado: apenas bibliotecárias podem cadastrar livros.");
    window.location.href = "/frontend/src/pages/index.html";
  }
}

function atualizarAcessoGerenciamentoUsuarios() {
  const podeGerenciarUsuarios = isBibliotecariaLogada();
  const links = document.querySelectorAll('a[href*="gerenciamento-usuarios.html"]');

  links.forEach((link) => {
    if (podeGerenciarUsuarios) {
      link.style.display = "";
      if (link.parentElement) {
        link.parentElement.style.display = "";
      }
      return;
    }

    link.style.display = "none";
    if (link.parentElement) {
      link.parentElement.style.display = "none";
    }
  });

  if (!window.location.href.includes("gerenciamento-usuarios.html")) {
    return;
  }
}

let bibliotecaAutoRefreshId = null;
let bibliotecaCachedBooks = [];
let bibliotecaCachedStatus = [];
let bibliotecaFiltroStatusAtivo = "";
let paginasCarregadas = new Set();
const BIBLIOTECA_STATUS_VALIDOS = ["lido", "lendo", "quero_ler"];

function obterLivroBibliotecaId(item) {
  const id = item?.livro_id ?? item?.id ?? null;
  return id === null || typeof id === "undefined" ? "" : String(id);
}

function criarMapaStatusBiblioteca(statusList = []) {
  const statusMap = new Map();

  statusList.forEach((item) => {
    const livroId = obterLivroBibliotecaId(item);
    const progresso = String(item?.progresso || "").trim();

    if (livroId && BIBLIOTECA_STATUS_VALIDOS.includes(progresso)) {
      statusMap.set(livroId, progresso);
    }
  });

  return statusMap;
}

function livroCorrespondeBuscaBiblioteca(livro, termo = "") {
  const termoNormalizado = String(termo || "").trim().toLowerCase();
  if (!termoNormalizado) {
    return true;
  }

  const titulo = String(livro?.titulo || livro?.nome || "").toLowerCase();
  const autor = String(livro?.autor || "").toLowerCase();

  return (
    titulo.includes(termoNormalizado) || autor.includes(termoNormalizado)
  );
}

function livroCorrespondeStatusBiblioteca(livro, statusMap, statusFiltro = "") {
  if (!statusFiltro) {
    return true;
  }

  const livroId = obterLivroBibliotecaId(livro);
  const progresso =
    statusMap.get(livroId) || String(livro?.progresso || "").trim();

  return progresso === statusFiltro;
}

function atualizarEstadoFiltrosBiblioteca() {
  const itensFiltro = document.querySelectorAll(".status .item[data-status]");

  itensFiltro.forEach((item) => {
    const ativo = item.dataset.status === bibliotecaFiltroStatusAtivo;
    item.classList.toggle("item-active", ativo);
    item.setAttribute("aria-pressed", String(ativo));
  });
}

function aplicarFiltrosBiblioteca() {
  const row = document.querySelector(".books-grid .row");
  if (!row) {
    return;
  }

  const inputSearch = document.querySelector(
    '.books-grid input[type="search"]',
  );
  const termo = inputSearch ? inputSearch.value.trim().toLowerCase() : "";
  const statusMap = criarMapaStatusBiblioteca(bibliotecaCachedStatus);

  const livrosFiltrados = bibliotecaCachedBooks.filter(
    (livro) =>
      livroCorrespondeBuscaBiblioteca(livro, termo) &&
      livroCorrespondeStatusBiblioteca(
        livro,
        statusMap,
        bibliotecaFiltroStatusAtivo,
      ),
  );

  renderBooks(livrosFiltrados, bibliotecaCachedStatus);
  atualizarEstadoFiltrosBiblioteca();
}

function setupFiltrosStatusBiblioteca() {
  const itensFiltro = document.querySelectorAll(".status .item[data-status]");

  itensFiltro.forEach((item) => {
    if (item.dataset.filterBound === "true") {
      return;
    }

    const alternarFiltro = () => {
      const statusSelecionado = item.dataset.status || "";
      bibliotecaFiltroStatusAtivo =
        bibliotecaFiltroStatusAtivo === statusSelecionado
          ? ""
          : statusSelecionado;

      aplicarFiltrosBiblioteca();
    };

    item.addEventListener("click", alternarFiltro);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        alternarFiltro();
      }
    });

    item.dataset.filterBound = "true";
  });

  atualizarEstadoFiltrosBiblioteca();
}

async function atualizarBibliotecaELista() {
  // Verifica se os elementos necessários existem
  const inputSearch = document.querySelector(
    '.books-grid input[type="search"]',
  );
  const row = document.querySelector(".books-grid .row");
  if (!inputSearch || !row) {
    console.warn("[Biblioteca] Elementos da grid não encontrados!");
    return;
  }

  console.log("[atualizarBibliotecaELista] Buscando livros...");

  if (!bibliotecaCachedBooks.length) {
    showBibliotecaSkeleton();
  }

  // A biblioteca deve mostrar apenas os livros salvos com status pelo usuário
  const livrosDaBiblioteca = await fetchBiblioteca();

  console.log("[Biblioteca] Livros carregados:", {
    quantidade: livrosDaBiblioteca.length,
    dados: livrosDaBiblioteca,
  });

  bibliotecaCachedBooks = livrosDaBiblioteca;
  bibliotecaCachedStatus = livrosDaBiblioteca.map((livro) => ({
    livro_id: livro.livro_id || livro.id,
    progresso: livro.progresso || "",
  }));

  renderBibliotecaOverviewStatus();
  aplicarFiltrosBiblioteca();

  const usuarioId = getUsuarioLogadoId();
  if (usuarioId) {
    const ranking = await fetchRanking(usuarioId);
    if (ranking) {
      renderRank(ranking.posicao_ranking || 1, ranking.total_paginas || 0);
    } else {
      renderRank("-", "-");
    }
  } else {
    renderRank("-", "-");
  }
}

async function fetchBiblioteca() {
  try {
    const usuarioId = getUsuarioLogadoId();
    const token = getToken();

    console.log("[fetchBiblioteca] Iniciando busca com ", {
      usuarioId,
      temToken: !!token,
    });

    if (!token) {
      console.error("Token não encontrado! Redirecionando para login.");
      logout();
      return [];
    }

    if (!usuarioId) {
      console.error("ID do usuário não encontrado!");
      return [];
    }

    const url = apiUrl(`/biblioteca/usuario/${usuarioId}`);
    console.log("[fetchBiblioteca] Fazendo requisição para:", url);

    const resposta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[fetchBiblioteca] Status HTTP:", resposta.status);

    if (resposta.status === 401 || resposta.status === 403) {
      alert("Sessão expirada. Faça login novamente.");
      logout();
      return [];
    }

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error("[fetchBiblioteca] Erro na resposta:", erro);
      throw new Error(`Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    console.log("[fetchBiblioteca] Dados recebidos:", data);

    // A resposta pode vir como { status: [...] } ou { biblioteca: [...] } ou direto [...]
    const livros = data.status || data.biblioteca || data.livros || data || [];
    console.log("[fetchBiblioteca] Livros extraídos:", livros);

    return livros;
  } catch (error) {
    console.error("Erro ao buscar biblioteca:", error);
    return [];
  }
}

async function fetchLivrosPublicos() {
  try {
    console.log("[fetchLivrosPublicos] Buscando livros públicos...");

    const resposta = await fetch(apiUrl("/livros/"));

    console.log("[fetchLivrosPublicos] Status HTTP:", resposta.status);

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error("[fetchLivrosPublicos] Erro na resposta:", erro);
      throw new Error(`Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    console.log("[fetchLivrosPublicos] Dados recebidos:", data);

    // A resposta pode vir em diferentes formatos
    // Tenta extrair os livros de várias estruturas possíveis
    let livros = [];

    if (Array.isArray(data)) {
      livros = data;
    } else if (data.livros && Array.isArray(data.livros)) {
      livros = data.livros;
    } else if (data.status && Array.isArray(data.status)) {
      livros = data.status;
    } else if (data.biblioteca && Array.isArray(data.biblioteca)) {
      livros = data.biblioteca;
    } else if (data.data && Array.isArray(data.data)) {
      livros = data.data;
    }

    console.log("[fetchLivrosPublicos] Livros extraídos:", {
      quantidade: livros.length,
      livros,
    });

    return livros;
  } catch (error) {
    console.error(
      "[fetchLivrosPublicos] Erro ao buscar livros públicos:",
      error,
    );
    return [];
  }
}

async function fetchLivros() {
  try {
    const resposta = await fetch(apiUrl("/livros/"));
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    const data = await resposta.json();
    return data.livros || [];
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    return [];
  }
}

async function carregarPerfil() {
  showPerfilSkeleton();

  try {
    const id = getUsuarioLogadoId();
    const token = getToken();

    // Se não estiver logado, redirecionar para login
    if (!id || !token) {
      await exibirAlertaApp({
        icon: "warning",
        title: "Login necessário",
        text: "Você precisa estar logado para acessar o perfil.",
      });
      window.location.href = "/frontend/login.html";
      return;
    }

    const response = await fetch(apiUrl(`/usuario/${id}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();

    console.log("Perfil carregado:", data.usuario);

    document.getElementById("nome").value = data.usuario.nome || "";
    document.getElementById("bio").value = data.usuario.bio || "";
    document.getElementById("email").value = data.usuario.email || "";
    document.getElementById("apelido").value = data.usuario.apelido || "";
    document.getElementById("genero").value =
      data.usuario.genero_favorito || "";

    // Se houver foto de perfil, carregar em todos os elementos
    if (data.usuario.foto_perfil) {
      const fotoNormalizada = normalizarUrlFoto(data.usuario.foto_perfil);
      
      // Atualizar foto no header
      const fotoHeader = getPerfilHeaderImageElement();
      if (fotoHeader) {
        fotoHeader.src = fotoNormalizada;
      }

      // Atualizar foto no formulário principal
      const fotoMain = document.getElementById("fotoPerfilMain");
      if (fotoMain) {
        fotoMain.src = fotoNormalizada;
      }
    }

  } catch (erro) {
    console.error("Erro ao carregar perfil:", erro);
    await exibirAlertaApp({
      icon: "error",
      title: "Erro ao carregar perfil",
      text: erro.message || String(erro),
    });
  } finally {
    hidePerfilSkeleton();
  }
}

function desabilitarCampos() {
  [
    "nome",
    "bio",
    "email",
    "apelido",
    "genero",
    "inputFoto",
    "inputFotoPerfil",
  ].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.disabled = true;
    }
  });

  const botaoFoto = document.querySelector(".foto-acao");
  if (botaoFoto) {
    botaoFoto.disabled = true;
    botaoFoto.setAttribute("aria-disabled", "true");
  }
}

function habilitarCamposPerfil() {
  [
    "nome",
    "bio",
    "email",
    "apelido",
    "genero",
    "inputFoto",
    "inputFotoPerfil",
  ].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.disabled = false;
    }
  });

  const botaoFoto = document.querySelector(".foto-acao");
  if (botaoFoto) {
    botaoFoto.disabled = false;
    botaoFoto.setAttribute("aria-disabled", "false");
  }
}

function alternarBotoesPerfil(estaEditando) {
  const btnSalvar = document.querySelector(".btn-salvar");
  const btnCancelar = document.querySelector(".btn-cancelar");
  const btnEditar = document.querySelector(".btn-editar");
  const btnExcluirPerfil = document.querySelector(".btn-excluir-perfil");
  const dicaFoto = document.querySelector(".foto-dica");

  if (btnSalvar) {
    btnSalvar.hidden = !estaEditando;
    btnSalvar.style.display = estaEditando ? "inline-block" : "none";
  }

  if (btnCancelar) {
    btnCancelar.hidden = !estaEditando;
    btnCancelar.style.display = estaEditando ? "inline-block" : "none";
  }

  if (btnEditar) {
    btnEditar.hidden = estaEditando;
    btnEditar.style.display = estaEditando ? "none" : "inline-block";
  }

  if (btnExcluirPerfil) {
    btnExcluirPerfil.hidden = estaEditando;
    btnExcluirPerfil.style.display = estaEditando ? "none" : "inline-block";
  }

  if (dicaFoto) {
    dicaFoto.textContent = estaEditando
      ? "Clique na foto para alterar"
      : "Clique em Editar para liberar alterações";
  }
}

function alternarModoEdicaoPerfil(estaEditando) {
  if (estaEditando) {
    habilitarCamposPerfil();
  } else {
    desabilitarCampos();

    const inputFoto = document.getElementById("inputFoto");
    if (inputFoto) {
      inputFoto.value = "";
    }

    const inputFotoPerfil = document.getElementById("inputFotoPerfil");
    if (inputFotoPerfil) {
      inputFotoPerfil.value = "";
    }
  }

  alternarBotoesPerfil(estaEditando);
}

function habilitarEdicao() {
  alternarModoEdicaoPerfil(true);
}

async function salvarPerfil() {
  try {
    atualizarFeedbackFormulario("perfilFeedback", "Salvando perfil...", "loading");
    const id = getUsuarioLogadoId();
    const token = getToken();

    const formData = new FormData();
    formData.append("nome", document.getElementById("nome").value);
    formData.append("bio", document.getElementById("bio").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("apelido", document.getElementById("apelido").value);
    formData.append("genero_favorito", document.getElementById("genero").value);

    // Se houver arquivo, adicionar
    const file = document.getElementById("inputFoto").files[0];
    if (file) {
      formData.append("foto_perfil", file);
    }

    const response = await fetch(apiUrl(`/usuario/${id}`), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(erro.mensagem || "Erro ao salvar");
    }

    const resultado = await response.json();
    exibirFeedbackOuAlert(
      "perfilFeedback",
      "Perfil atualizado com sucesso!",
      "success",
      {
        mostrarPopup: true,
        title: "Perfil atualizado",
        timer: 2200,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      },
    );

    console.log("[salvarPerfil] Resultado:", resultado);

    const apelidoAtualizado = document.getElementById("apelido").value.trim();
    localStorage.setItem("usuarioLogadoApelido", apelidoAtualizado);
    atualizarApelidoPerfilHeader(apelidoAtualizado);

    // Atualizar foto no header se foi enviada
    if (resultado.foto_url || resultado.usuario?.foto_perfil) {
      let novaFoto = resultado.foto_url || resultado.usuario?.foto_perfil;
      
      // Garantir URL completa (não relativa)
      if (novaFoto && !novaFoto.match(/^https?:\/\//)) {
        // Se for URL relativa, usar a URL correta do servidor
        novaFoto = apiUrl(novaFoto);
      }
      
      // Adicionar cache-bust se não tiver
      if (novaFoto && !novaFoto.includes("?v=") && !novaFoto.includes("&v=")) {
        novaFoto = novaFoto + (novaFoto.includes("?") ? "&" : "?") + "v=" + Date.now();
      }

      console.log("[salvarPerfil] URL final da foto:", novaFoto);

      // Atualizar foto no header
      const fotoHeader = getPerfilHeaderImageElement();
      if (fotoHeader) {
        // Criar nova imagem para forçar reload
        const tempImg = new Image();
        tempImg.onload = function() {
          fotoHeader.src = novaFoto;
          console.log("[salvarPerfil] Foto do header atualizada:", novaFoto);
        };
        tempImg.onerror = function() {
          console.error("[salvarPerfil] Erro ao carregar foto do header:", novaFoto);
          fotoHeader.src = novaFoto; // Tenta mesmo assim
        };
        tempImg.src = novaFoto;
      }

      // Atualizar foto no formulário principal
      const fotoMain = document.getElementById("fotoPerfilMain");
      if (fotoMain) {
        const tempImg2 = new Image();
        tempImg2.onload = function() {
          fotoMain.src = novaFoto;
          console.log("[salvarPerfil] Foto principal atualizada:", novaFoto);
        };
        tempImg2.onerror = function() {
          console.error("[salvarPerfil] Erro ao carregar foto principal:", novaFoto);
          fotoMain.src = novaFoto;
        };
        tempImg2.src = novaFoto;
      }
    }

    alternarModoEdicaoPerfil(false);

    // Recarregar dados para garantir sincronização
    setTimeout(() => {
      carregarPerfil();
    }, 500);
  } catch (erro) {
    console.error(erro);
    exibirFeedbackOuAlert(
      "perfilFeedback",
      "Erro ao salvar perfil: " + erro.message,
      "error",
      {
        mostrarPopup: true,
        title: "Falha ao salvar perfil",
      },
    );
  }
}

function cancelarEdicao() {
  carregarPerfil(); // recarrega dados originais
  alternarModoEdicaoPerfil(false);
}

async function excluirPerfil() {
  try {
    const id = getUsuarioLogadoId();
    const token = getToken();

    if (!id || !token) {
      await exibirAlertaApp({
        icon: "warning",
        title: "Login necessário",
        text: "Você precisa estar logado para apagar o perfil.",
      });
      logout();
      return;
    }

    const confirmacao = await exibirAlertaApp({
      icon: "warning",
      title: "Apagar perfil?",
      text: "Tem certeza que deseja apagar seu perfil? Essa ação não pode ser desfeita.",
      showCancelButton: true,
      confirmButtonText: "Apagar",
      cancelButtonText: "Cancelar",
      focusCancel: true,
    });
    if (!confirmacao.isConfirmed) {
      return;
    }

    const resposta = await fetch(apiUrl(`/usuario/deletar/${id}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(data.mensagem || `Erro ${resposta.status}`);
    }

    await exibirAlertaApp({
      icon: "success",
      title: "Perfil apagado",
      text: "Seu perfil foi apagado com sucesso.",
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    });
    localStorage.removeItem("usuarioLogadoId");
    localStorage.removeItem("usuarioLogadoTipo");
    localStorage.removeItem("usuarioLogadoApelido");
    localStorage.removeItem("token");
    atualizarApelidoPerfilHeader("");
    window.location.href = "/frontend/login.html";
  } catch (erro) {
    console.error("[excluirPerfil] Erro ao apagar perfil:", erro);
    await exibirAlertaApp({
      icon: "error",
      title: "Erro ao apagar perfil",
      text: erro.message || String(erro),
    });
  }
}

async function salvarStatusBiblioteca(
  usuarioId,
  livroId,
  progresso = "quero_ler",
) {
  try {
    // ValidaçÃµes no frontend
    const uId = parseInt(usuarioId);
    const lId = parseInt(livroId);

    if (!uId || !lId) {
      console.error("Dados inválidos:", { usuarioId, livroId });
      exibirFeedbackOuAlert(
        "avaliacaoSidebarFeedback",
        "Erro: IDs inválidos. Abra o console para detalhes.",
        "error",
        {
          mostrarPopup: true,
          title: "Dados inválidos",
        },
      );
      return null;
    }

    if (!["lido", "lendo", "quero_ler"].includes(progresso)) {
      exibirFeedbackOuAlert(
        "avaliacaoSidebarFeedback",
        "Erro: Progresso inválido. Use: lido, lendo ou quero ler.",
        "error",
        {
          mostrarPopup: true,
          title: "Status inválido",
        },
      );
      return null;
    }

    const token = getToken();
    if (!token) {
      atualizarFeedbackFormulario(
        "avaliacaoSidebarFeedback",
        "Você precisa estar logado.",
        "error",
      );
      await exibirAlertaApp({
        icon: "warning",
        title: "Login necessário",
        text: "Você precisa estar logado para salvar esse status.",
      });
      logout();
      return null;
    }

    atualizarFeedbackFormulario(
      "avaliacaoSidebarFeedback",
      "Salvando status do livro...",
      "loading",
    );

    const payload = {
      usuario_id: uId,
      livro_id: lId,
      progresso: progresso,
    };

    console.log("[Frontend] Enviando status:", payload);

    const resposta = await fetch(apiUrl("/biblioteca/cadastrar"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[Frontend] Status HTTP:", resposta.status);

    if (resposta.status === 401 || resposta.status === 403) {
      atualizarFeedbackFormulario(
        "avaliacaoSidebarFeedback",
        "Sessão expirada. Faça login novamente.",
        "error",
      );
      await exibirAlertaApp({
        icon: "warning",
        title: "Sessão expirada",
        text: "Faça login novamente para continuar.",
      });
      logout();
      return null;
    }

    const data = await resposta.json();

    if (!resposta.ok) {
      console.error("[Frontend] Erro na resposta:", data);
      const mensagem = data.mensagem || `Erro ${resposta.status}`;
      console.error("[Frontend] Erro ao salvar:", mensagem);
      exibirFeedbackOuAlert(
        "avaliacaoSidebarFeedback",
        "Erro ao salvar: " + mensagem,
        "error",
        {
          mostrarPopup: true,
          title: "Falha ao salvar status",
        },
      );
      return null;
    }

    console.log("[Frontend] Status salvo com sucesso:", data);
    const mensagemStatus =
      progresso === "lido"
        ? "Livro marcado como lido!"
        : progresso === "lendo"
          ? "Livro marcado como lendo!"
          : "Livro adicionado em quero ler!";

    exibirFeedbackOuAlert(
      "avaliacaoSidebarFeedback",
      mensagemStatus,
      "success",
      {
        mostrarPopup: true,
        title: "Status atualizado",
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      },
    );

    // Dispara evento para atualizar biblioteca com pequeno delay
    setTimeout(() => {
      console.log("[Frontend] Disparando evento StatusLivroAlterado...");
      document.dispatchEvent(new Event("StatusLivroAlterado"));
    }, 100);

    return data;
  } catch (error) {
    console.error("[Frontend] Erro ao salvar status:", error);
    exibirFeedbackOuAlert(
      "avaliacaoSidebarFeedback",
      "Erro: " + error.message,
      "error",
      {
        mostrarPopup: true,
        title: "Erro ao atualizar status",
      },
    );
    return null;
  }
}

function renderBooks(books, bibliotecaStatus) {
  const row = document.querySelector(".books-grid .row");
  const countEl = document.querySelector(".books-header h3");

  console.log("[renderBooks] Renderizando livros:", {
    quantidade: books.length,
    temRow: !!row,
    temCountEl: !!countEl,
    primeirLivro: books[0],
  });

  if (!row) {
    console.error("[renderBooks] .books-grid .row não encontrado!");
    return;
  }

  const statusMap = criarMapaStatusBiblioteca(bibliotecaStatus);

  row.innerHTML = "";

  // Filtrar apenas livros com status válido
  const livrosFiltrados = books.filter((book) => {
    const livroId = obterLivroBibliotecaId(book);
    const progresso = statusMap.get(livroId) || book.progresso || "";
    return BIBLIOTECA_STATUS_VALIDOS.includes(progresso);
  });

  console.log(
    "[renderBooks] Livros filtrados com status Inválidos:",
    livrosFiltrados.length,
  );

  if (livrosFiltrados.length === 0) {
    console.warn("[renderBooks] Nenhum livro para renderizar!");
    row.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: white; padding: 40px; font-size: 18px;">Nenhum livro encontrado com os filtros atuais.</p>';
  } else {
    livrosFiltrados.forEach((book) => {
      try {
        // Trata diferentes estruturas de IDs
        const livroId = obterLivroBibliotecaId(book);
        const titulo = book.titulo || book.nome || "Sem título";
        const autor = book.autor || book.author || "Desconhecido";
        const capa =
          book.imagem_capa ||
          book.capa ||
          book.image ||
          DEFAULT_BOOK_COVER_URL;

        const progresso = statusMap.get(livroId) || book.progresso || "";
        const status = getStatusTag(progresso);
        const progressoPaginas = getBookPageProgress(book, progresso);
        const resumoProgresso =
          progresso === "lendo" ? "Em Processo" : `${progressoPaginas.percentual}%`;

        let capaUrl = normalizarUrlMidia(
          capa && capa.trim()
            ? capa
            : DEFAULT_BOOK_COVER_URL,
        );

        // Remover qualquer versão anterior (com ?v=) e adicionar cache-buster novo
        capaUrl = capaUrl.split("?")[0];
        if (!capaUrl.includes("?")) {
          capaUrl += "?v=" + Date.now();
        }

        const card = `
          <div class="col-6 col-md-4 col-lg-3 col-xl-2" data-livro-id="${livroId}">
            <article class="book-card" style="cursor: pointer;" onclick="irParaAvaliacao(${livroId})">
              <div class="book-cover" aria-label="Capa do livro ${titulo}">
                <span
                  class="book-ribbon ${status.ribbonClass}"
                  aria-label="Status do livro: ${status.label}"
                  title="${status.label}"
                ></span>
                <img
                  src="${capaUrl}"
                  alt="Capa do livro ${titulo}"
                  loading="lazy"
                  onload="marcarCapaLivroCarregada(this)"
                  onerror="tratarErroCapaLivro(this)"
                />
              </div>
              <div class="book-info">
                <h4 class="book-title">${titulo}</h4>
                <p class="book-author">${autor}</p>
                <div class="book-progress">
                  <div class="book-progress-meta">
                    <span>${resumoProgresso}</span>
                    <span>${progressoPaginas.paginasLidas} / ${progressoPaginas.totalPaginas || 0}</span>
                  </div>
                  <div class="book-progress-track" aria-hidden="true">
                    <span class="book-progress-fill ${status.progressClass}" style="width: ${progressoPaginas.percentual}%;"></span>
                  </div>
                  <p class="book-pages">${progressoPaginas.totalPaginas || 0} páginas</p>
                </div>
              </div>
            </article>
          </div>`;

        row.insertAdjacentHTML("beforeend", card);
      } catch (error) {
        console.error("[renderBooks] Erro ao renderizar livro:", {
          livro: book,
          erro: error,
        });
      }
    });
  }

  if (countEl) {
    countEl.textContent = `${livrosFiltrados.length} itens encontrados`;
  }
}

async function fetchRanking(usuarioId = 1) {
  try {
    const token = getToken();
    if (!token) {
      console.error("Token não encontrado! Redirecionando para login.");
      logout();
      return null;
    }
    const resposta = await fetch(
      apiUrl(`/ranking/paginometro/${usuarioId}`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (resposta.status === 401 || resposta.status === 403) {
      alert("Sessão expirada. Faça login novamente.");
      logout();
      return null;
    }
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    return await resposta.json();
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return null;
  }
}

function renderRank(posicao, totalPaginas) {
  const rankElem = document.querySelector(".ranking-text.mb-2");
  if (rankElem) {
    const posicaoTexto =
      Number.isFinite(Number(posicao)) && String(posicao).trim() !== ""
        ? `${posicao}º lugar`
        : `${posicao} lugar`;
    rankElem.innerHTML = `Você está em <strong>${posicaoTexto}</strong> no ranking de mais páginas lidas da sua universidade!`;
  }

  const pageMeterElem = document.querySelector(
    ".overview-card .paginometro-value",
  );
  if (pageMeterElem) {
    pageMeterElem.textContent = String(totalPaginas);
  }
}

function formatarQuantidadeLivros(total) {
  const quantidade = Number(total) || 0;
  return `${quantidade} ${quantidade === 1 ? "livro" : "livros"}`;
}

function renderBibliotecaOverviewStatus() {
  const contadores = {
    lido: 0,
    quero_ler: 0,
    lendo: 0,
  };

  bibliotecaCachedStatus.forEach((item) => {
    const progresso = String(item?.progresso || "").trim();
    if (Object.prototype.hasOwnProperty.call(contadores, progresso)) {
      contadores[progresso] += 1;
    }
  });

  Object.entries(contadores).forEach(([status, total]) => {
    const countElem = document.querySelector(
      `.status-count[data-count-for="${status}"]`,
    );
    if (countElem) {
      countElem.textContent = formatarQuantidadeLivros(total);
    }
  });
}

async function initBibliotecaGrid() {
  // Verifica se os elementos da biblioteca existem
  const inputSearch = document.querySelector(
    '.books-grid input[type="search"]',
  );
  const row = document.querySelector(".books-grid .row");

  console.log("[initBibliotecaGrid] Inicializando biblioteca com:", {
    temInputSearch: !!inputSearch,
    temRow: !!row,
  });

  if (!inputSearch || !row) {
    console.error(
      "[initBibliotecaGrid] Elementos da biblioteca não encontrados!",
    );
    return;
  }

  setupFiltrosStatusBiblioteca();

  if (inputSearch && inputSearch.dataset.bibliotecaSearchBound !== "true") {
    inputSearch.addEventListener("input", () => {
      const termo = inputSearch.value.trim().toLowerCase();
      console.log("[initBibliotecaGrid] Filtro ativado com termo:", termo);
      aplicarFiltrosBiblioteca();
    });

    inputSearch.dataset.bibliotecaSearchBound = "true";
  }

  console.log("[initBibliotecaGrid] Chamando atualizarBibliotecaELista...");
  await atualizarBibliotecaELista();

  // Listener para atualizar biblioteca quando um livro é adicionado
  document.addEventListener("LivroAdicionado", async () => {
    console.log("[initBibliotecaGrid] Evento LivroAdicionado disparado");
    await atualizarBibliotecaELista();
  });

  // Listener para atualizar biblioteca quando o status de um livro é alterado
  document.addEventListener("StatusLivroAlterado", async () => {
    console.log(
      "[initBibliotecaGrid] Evento StatusLivroAlterado disparado - recarregando biblioteca...",
    );
    await atualizarBibliotecaELista();
  });

  // Listener global para atualizar biblioteca em qualquer página
  document.addEventListener("StatusLivroAlterado", async () => {
    console.log(
      "[Global] Evento StatusLivroAlterado - tentando atualizar elementos da biblioteca se visíveis",
    );

    // Se estiver na página de biblioteca
    const row = document.querySelector(".books-grid .row");
    if (row) {
      console.log("[Global] Atualizando biblioteca.html em tempo real...");
      await atualizarBibliotecaELista();
    }

    // Se estiver na página de Avaliação, recarregar dados
    if (window.location.href.includes("Avaliacao.html")) {
      console.log("[Global] Recarregando dados da Avaliação...");
      await carregarDadosLivroAvaliacao();
    }
  });
}

// ======================== FUNÃ‡Ã•ES DE AVALIAÃ‡ÃƒO E LIVROS ========================

let livroAtualId = null;
let livroAtualDados = null;
let avaliacaoAtual = 0;
const TEXTO_PADRAO_RESENHA = "Nenhuma resenha salva ainda.";
const TEXTO_PADRAO_FAVORITA = "Nenhuma parte favorita salva ainda.";

function obterTextoSecao(texto) {
  return String(texto || "").trim();
}

function aplicarTextoOuPadrao(elemento, texto, textoPadrao) {
  if (!elemento) {
    return;
  }

  const valor = obterTextoSecao(texto);
  elemento.textContent = valor || textoPadrao;
  elemento.innerText = valor || textoPadrao;
  elemento.style.display = "block";
  elemento.style.visibility = "visible";
  elemento.style.opacity = "1";
}

function ehPlaceholderResenha(texto) {
  const valor = obterTextoSecao(texto);
  return (
    !valor ||
    valor === TEXTO_PADRAO_RESENHA ||
    valor.includes("Amor, Teoricamente me conquistou")
  );
}

function ehPlaceholderFavorita(texto) {
  const valor = obterTextoSecao(texto);
  return (
    !valor ||
    valor === TEXTO_PADRAO_FAVORITA ||
    valor.includes("Quando Elsie e Jack deixam a rivalidade de lado")
  );
}

function resetarSecoesAvaliacao() {
  const resenhaTexto = document.getElementById("resenhaTexto");
  const resenhaInput = document.getElementById("resenhaInput");
  const botoesResenha = document.getElementById("botoesResenha");
  const btnEditarResenha = document.getElementById("btnEditarResenha");

  if (resenhaTexto) {
    resenhaTexto.style.display = "block";
    if (ehPlaceholderResenha(resenhaTexto.textContent)) {
      resenhaTexto.textContent = TEXTO_PADRAO_RESENHA;
    }
  }
  if (resenhaInput) {
    resenhaInput.style.display = "none";
    resenhaInput.value = "";
  }
  if (botoesResenha) {
    botoesResenha.style.display = "none";
    botoesResenha.style.visibility = "visible";
    botoesResenha.style.opacity = "1";
  }
  if (btnEditarResenha) {
    btnEditarResenha.style.display = "inline-block";
  }

  const favoritaTexto = document.getElementById("favoritaTexto");
  const favoritaInput = document.getElementById("favoritaInput");
  const botoesFavorita = document.getElementById("botoesFavorita");
  const btnEditarFavorita = document.getElementById("btnEditarFavorita");

  if (favoritaTexto) {
    favoritaTexto.style.display = "block";
    if (ehPlaceholderFavorita(favoritaTexto.textContent)) {
      favoritaTexto.textContent = TEXTO_PADRAO_FAVORITA;
    }
  }
  if (favoritaInput) {
    favoritaInput.style.display = "none";
    favoritaInput.value = "";
  }
  if (botoesFavorita) {
    botoesFavorita.style.display = "none";
    botoesFavorita.style.visibility = "visible";
    botoesFavorita.style.opacity = "1";
  }
  if (btnEditarFavorita) {
    btnEditarFavorita.style.display = "inline-block";
  }
}

function aplicarFavoritaPadrao() {
  const favoritaTexto = document.getElementById("favoritaTexto");
  const favoritaInput = document.getElementById("favoritaInput");

  if (favoritaTexto) {
    favoritaTexto.textContent = TEXTO_PADRAO_FAVORITA;
    favoritaTexto.innerText = TEXTO_PADRAO_FAVORITA;
    favoritaTexto.style.display = "block";
    favoritaTexto.style.visibility = "visible";
    favoritaTexto.style.opacity = "1";
  }

  if (favoritaInput) {
    favoritaInput.value = "";
  }
}

async function carregarFavoritaLivro(usuarioId, livroId, token) {
  try {
    const respostaFavorita = await fetch(
      apiUrl(`/livros/${livroId}/favorita/${usuarioId}`),
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!respostaFavorita.ok) {
      aplicarFavoritaPadrao();
      return null;
    }

    const dataFavorita = await respostaFavorita.json();
    const textoFavorita = obterTextoSecao(dataFavorita?.favorita?.parte_favorita);

    if (!textoFavorita) {
      aplicarFavoritaPadrao();
      return null;
    }

    aplicarTextoOuPadrao(
      document.getElementById("favoritaTexto"),
      textoFavorita,
      TEXTO_PADRAO_FAVORITA,
    );
    document.getElementById("favoritaInput").value = textoFavorita;
    return dataFavorita.favorita;
  } catch (erro) {
    console.log("Sem favorita salva");
    aplicarFavoritaPadrao();
    return null;
  }
}

// Redireciona para página de avaliação
function irParaAvaliacao(livroId) {
  if (livroId) {
    localStorage.setItem("livroAtualId", livroId);
  }
  window.location.href = "/frontend/src/pages/Avaliacao.html";
}

// Redireciona para página de informaçÃµes
function irParaInformacoes() {
  const livroId = localStorage.getItem("livroAtualId");
  if (livroId) {
    window.location.href = "/frontend/src/pages/informacoes.html";
  }
}

// Carrega dados do livro na página de avaliação
async function carregarDadosLivroAvaliacao() {
  showAvaliacaoSkeleton();

  try {
    const livroId = localStorage.getItem("livroAtualId");
    if (!livroId) {
      await exibirAlertaApp({
        icon: "warning",
        title: "Livro não encontrado",
        text: "Nenhum livro foi selecionado para avaliação.",
      });
      return;
    }

    console.log("[carregarDadosLivroAvaliacao] Carregando livro ID:", livroId);

    const token = getToken();
    const usuarioId = getUsuarioLogadoId();
    resetarSecoesAvaliacao();

    // Buscar dados do livro
    const respostaLivro = await fetch(
      apiUrl(`/livros/${livroId}`),
    );
    if (!respostaLivro.ok) throw new Error("Erro ao buscar livro");

    const dataLivro = await respostaLivro.json();
    const livro = normalizarDadosLivro(dataLivro.livro);
    livroAtualDados = livro;
    preencherFormularioEdicaoLivro(livro);
    configurarPreviewCapaLivro();

    console.log("[carregarDadosLivroAvaliacao] Livro carregado:", {
      titulo: livro.titulo,
      imagem_capa_original: livro.imagem_capa,
    });

    // Atualizar UI
    preencherVisualizacaoLivro(livro);

    if (livro.imagem_capa && livro.imagem_capa.trim()) {
      // Remover qualquer versão anterior (com ?v=)
      let capa = normalizarUrlMidia(livro.imagem_capa).split("?")[0];

      // Adicionar cache-buster novo
      capa += "?v=" + Date.now();

      console.log(
        "[carregarDadosLivroAvaliacao] URL final com cache-buster:",
        capa,
      );

      document.getElementById("capaLivro").src = capa;
    }

    livroAtualId = livroId;
    atualizarAcaoInformacoesAvaliacao();

    // Mostra botÃµes apenas para bibliotecárias
    if (isBibliotecariaLogada()) {
      const acoesDiv = document.getElementById("acoesLivro");
      if (acoesDiv) {
        acoesDiv.style.display = "flex";
      }
    }

    // Se usuário logado, buscar dados
    if (token && usuarioId) {
      // Carregar status current da biblioteca
      try {
        const resposta = await fetch(
          apiUrl(`/biblioteca/usuario/${usuarioId}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (resposta.ok) {
          const data = await resposta.json();
          const biblioteca = data.status || [];
          const livroStatus = biblioteca.find(
            (l) => l.livro_id === parseInt(livroId),
          );

          if (livroStatus) {
            const select = document.getElementById("statusLivro");
            if (select) {
              select.value = livroStatus.progresso;
              console.log(
                "[carregarDadosLivroAvaliacao] Status carregado:",
                livroStatus.progresso,
              );
            }
          }
        }
      } catch (e) {
        console.log(
          "[carregarDadosLivroAvaliacao] Livro ainda não está na biblioteca",
        );
      }

      try {
        const respostaResenha = await fetch(
          apiUrl(`/resenha/usuario/${usuarioId}/livro/${livroId}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (respostaResenha.ok) {
          const dataResenha = await respostaResenha.json();
          if (dataResenha.resenha) {
            const textoResenha = obterTextoSecao(dataResenha.resenha.texto);
            aplicarTextoOuPadrao(
              document.getElementById("resenhaTexto"),
              textoResenha,
              TEXTO_PADRAO_RESENHA,
            );
            document.getElementById("resenhaInput").value = textoResenha;
          } else {
            document.getElementById("resenhaTexto").textContent =
              TEXTO_PADRAO_RESENHA;
          }
        }
      } catch (e) {
        console.log("Sem resenha salva");
        document.getElementById("resenhaTexto").textContent =
          TEXTO_PADRAO_RESENHA;
      }

      await carregarFavoritaLivro(usuarioId, livroId, token);

      try {
        const respostaAvaliacao = await fetch(
          apiUrl(`/avaliacoes/usuario/${usuarioId}/livro/${livroId}`),
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (respostaAvaliacao.ok) {
          const dataAvaliacao = await respostaAvaliacao.json();
          if (dataAvaliacao.avaliacao) {
            avaliacaoAtual = dataAvaliacao.avaliacao.estrelas || 0;
            atualizarEstrelas(avaliacaoAtual);
          }
        }
      } catch (e) {
        console.log("Sem avaliação salva");
      }
    }

    setupEstrelasListeners();
  } catch (erro) {
    console.error("Erro ao carregar livro:", erro);
    await exibirAlertaApp({
      icon: "error",
      title: "Erro ao carregar livro",
      text: erro.message || "Não foi possível carregar os dados do livro.",
    });
  } finally {
    hideAvaliacaoSkeleton();
  }
}

// Setup de listeners das estrelas
function setupEstrelasListeners() {
  const estrelas = document.querySelectorAll("#avaliacaoEstrelas .star");

  estrelas.forEach((star) => {
    star.style.cursor = "pointer";
    star.addEventListener("click", function () {
      const valor = parseInt(this.dataset.value);
      salvarAvaliacao(valor);
    });

    star.addEventListener("mouseover", function () {
      const valor = parseInt(this.dataset.value);
      atualizarEstrelas(valor);
    });
  });

  document
    .getElementById("avaliacaoEstrelas")
    .addEventListener("mouseleave", function () {
      atualizarEstrelas(avaliacaoAtual);
    });
}

// Atualiza visualmente as estrelas
function atualizarEstrelas(valor) {
  const estrelas = document.querySelectorAll("#avaliacaoEstrelas .star");
  estrelas.forEach((star, index) => {
    if (index < valor) {
      star.style.opacity = "1";
    } else {
      star.style.opacity = "0.3";
    }
  });
}

// Salva avaliação no servidor
async function salvarAvaliacao(estrelas) {
  try {
    const token = getToken();
    const usuarioId = getUsuarioLogadoId();

    if (!token || !usuarioId || !livroAtualId) {
      exibirFeedbackOuAlert(
        "avaliacaoSidebarFeedback",
        "Você precisa estar logado.",
        "error",
      );
      return;
    }

    atualizarFeedbackFormulario(
      "avaliacaoSidebarFeedback",
      "Salvando avaliação...",
      "loading",
    );

    const payload = {
      usuario_id: parseInt(usuarioId),
      livro_id: parseInt(livroAtualId),
      estrelas: estrelas,
    };

    const response = await fetch(apiUrl("/avaliacoes/cadastrar"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      avaliacaoAtual = estrelas;
      atualizarEstrelas(estrelas);
      atualizarFeedbackFormulario(
        "avaliacaoSidebarFeedback",
        "Avaliação salva!",
        "success",
      );
      console.log("Avaliação salva!");
    }
  } catch (erro) {
    console.error("Erro ao salvar avaliação:", erro);
    exibirFeedbackOuAlert(
      "avaliacaoSidebarFeedback",
      "Erro ao salvar avaliação: " + (erro.message || erro),
      "error",
    );
  }
}

// Atualiza status na biblioteca ao mudar o select
async function atualizarStatusBibliotecaOuSalvar() {
  const select = document.getElementById("statusLivro");
  const progresso = select.value;

  if (!progresso) {
    console.log(
      "[atualizarStatusBibliotecaOuSalvar] Nenhum status selecionado",
    );
    return;
  }

  const usuarioId = getUsuarioLogadoId();
  const livroId = localStorage.getItem("livroAtualId");

  if (!usuarioId || !livroId) {
    exibirFeedbackOuAlert(
      "avaliacaoSidebarFeedback",
      "Usuário ou livro não encontrado.",
      "error",
    );
    return;
  }

  console.log("[atualizarStatusBibliotecaOuSalvar] Atualizando status:", {
    usuarioId,
    livroId,
    progresso,
  });

  const resultado = await salvarStatusBiblioteca(usuarioId, livroId, progresso);

  if (resultado) {
    console.log("[atualizarStatusBibliotecaOuSalvar] Status salvo com sucesso");
    // Manter a seleção no select
    select.value = progresso;

    // Atualizar paginÃ´metro se o livro foi marcado como "lido"
    if (progresso === "lido") {
      await atualizarPaginometro(usuarioId);
    }
  } else {
    // Resetar a seleção se falhar
    select.value = "";
  }
}

// Atualiza o paginÃ´metro após marcar livro como lido
async function atualizarPaginometro(usuarioId) {
  try {
    console.log(
      "[atualizarPaginometro] Atualizando paginômetro para usuário:",
      usuarioId,
    );

    const ranking = await fetchRanking(usuarioId);
    if (ranking) {
      console.log("[atualizarPaginometro] Ranking obtido:", ranking);

      // Atualizar elemento na biblioteca.html (se estiver aberto)
      const pageMeterElem = document.querySelector(
        ".overview-card .paginometro-value",
      );
      if (pageMeterElem) {
        pageMeterElem.textContent = String(ranking.total_paginas || 0);
        console.log(
          "[atualizarPaginometro] Paginómetro atualizado para:",
          ranking.total_paginas,
        );
      } else {
        console.log(
          "[atualizarPaginometro] Elemento do paginómetro não encontrado (pode estar em outra pagina)",
        );
      }

      // Atualizar ranking também
      renderRank(ranking.posicao_ranking || 1, ranking.total_paginas || 0);
      console.log(
        "[atualizarPaginometro] Ranking atualizado para posição:",
        ranking.posicao_ranking,
      );
    }
  } catch (error) {
    console.error(
      "[atualizarPaginometro] Erro ao atualizar paginÃ´metro:",
      error,
    );
  }
}

// Edição de Resenha
function habilitarEdicaoResenha() {
  const p = document.getElementById("resenhaTexto");
  const textarea = document.getElementById("resenhaInput");
  const botoes = document.getElementById("botoesResenha");
  const botaoEditar = document.getElementById("btnEditarResenha");

  textarea.value = ehPlaceholderResenha(p.textContent) ? "" : p.textContent;
  p.style.display = "none";
  textarea.style.display = "block";
  botoes.style.display = "inline-flex";
  botoes.style.visibility = "visible";
  botoes.style.opacity = "1";
  if (botaoEditar) botaoEditar.style.display = "none";
  atualizarFeedbackFormulario("resenhaFeedback");
  textarea.focus();
}

function cancelarResenha() {
  const p = document.getElementById("resenhaTexto");
  const textarea = document.getElementById("resenhaInput");
  const botoes = document.getElementById("botoesResenha");
  const botaoEditar = document.getElementById("btnEditarResenha");

  p.style.display = "block";
  textarea.style.display = "none";
  botoes.style.display = "none";
  if (botaoEditar) botaoEditar.style.display = "inline-block";
}

async function salvarResenha() {
  try {
    const token = getToken();
    const usuarioId = getUsuarioLogadoId();
    const texto = obterTextoSecao(document.getElementById("resenhaInput").value);

    if (!token || !usuarioId || !livroAtualId) {
      exibirFeedbackOuAlert("resenhaFeedback", "Erro ao salvar resenha.", "error");
      return;
    }

    if (!texto) {
      atualizarFeedbackFormulario(
        "resenhaFeedback",
        "Digite uma resenha antes de salvar.",
        "error",
      );
      return;
    }

    atualizarFeedbackFormulario(
      "resenhaFeedback",
      "Salvando resenha...",
      "loading",
    );

    const payload = {
      usuario_id: parseInt(usuarioId),
      livro_id: parseInt(livroAtualId),
      texto: texto,
    };

    const response = await fetch(apiUrl("/resenha/cadastrar"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.mensagem || data.erro || `Erro ${response.status}`);
    }

    if (response.ok) {
      aplicarTextoOuPadrao(
        document.getElementById("resenhaTexto"),
        texto,
        TEXTO_PADRAO_RESENHA,
      );
      cancelarResenha();
      atualizarFeedbackFormulario(
        "resenhaFeedback",
        "Resenha salva!",
        "success",
      );
    }
  } catch (erro) {
    console.error("Erro ao salvar resenha:", erro);
    atualizarFeedbackFormulario(
      "resenhaFeedback",
      "Erro ao salvar resenha: " + (erro.message || erro),
      "error",
    );
  }
}

// Edição de Favorita
function habilitarEdicaoFavorita() {
  const p = document.getElementById("favoritaTexto");
  const textarea = document.getElementById("favoritaInput");
  const botoes = document.getElementById("botoesFavorita");
  const botaoEditar = document.getElementById("btnEditarFavorita");

  textarea.value = ehPlaceholderFavorita(p.textContent) ? "" : p.textContent;
  p.style.display = "none";
  textarea.style.display = "block";
  botoes.style.display = "inline-flex";
  botoes.style.visibility = "visible";
  botoes.style.opacity = "1";
  if (botaoEditar) botaoEditar.style.display = "none";
  atualizarFeedbackFormulario("favoritaFeedback");
  textarea.focus();
}

function cancelarFavorita() {
  const p = document.getElementById("favoritaTexto");
  const textarea = document.getElementById("favoritaInput");
  const botoes = document.getElementById("botoesFavorita");
  const botaoEditar = document.getElementById("btnEditarFavorita");

  p.style.display = "block";
  textarea.style.display = "none";
  botoes.style.display = "none";
  if (botaoEditar) botaoEditar.style.display = "inline-block";
}

async function salvarFavorita() {
  try {
    const token = getToken();
    const usuarioId = getUsuarioLogadoId();
    const texto = obterTextoSecao(document.getElementById("favoritaInput").value);

    if (!token || !usuarioId || !livroAtualId) {
      exibirFeedbackOuAlert("favoritaFeedback", "Erro ao salvar favorita.", "error");
      return;
    }

    if (!texto) {
      document.getElementById("favoritaTexto").textContent =
        TEXTO_PADRAO_FAVORITA;
      cancelarFavorita();
      atualizarFeedbackFormulario("favoritaFeedback");
      return;
    }

    atualizarFeedbackFormulario(
      "favoritaFeedback",
      "Salvando parte favorita...",
      "loading",
    );

    const payload = {
      usuario_id: parseInt(usuarioId),
      livro_id: parseInt(livroAtualId),
      parte_favorita: texto,
    };

    const response = await fetch(
      apiUrl("/livros/favorita/cadastrar"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.mensagem || data.erro || `Erro ${response.status}`);
    }

    await carregarFavoritaLivro(usuarioId, livroAtualId, token);
    cancelarFavorita();
    atualizarFeedbackFormulario(
      "favoritaFeedback",
      "Parte favorita salva!",
      "success",
    );
  } catch (erro) {
    console.error("Erro ao salvar favorita:", erro);
    atualizarFeedbackFormulario(
      "favoritaFeedback",
      "Erro ao salvar favorita: " + (erro.message || erro),
      "error",
    );
  }
}

// ==================== EDITAR LIVRO ====================
function obterElementoLivro(...ids) {
  for (const id of ids) {
    const elemento = document.getElementById(id);
    if (elemento) {
      return elemento;
    }
  }

  return null;
}

function obterTextoLivro(...ids) {
  const elemento = obterElementoLivro(...ids);
  if (!elemento) return "";
  return (elemento.textContent || elemento.innerText || "").trim();
}

function normalizarDadosLivro(livro) {
  return {
    titulo: livro?.titulo || "",
    autor: livro?.autor || "",
    genero: normalizarGeneroLivro(livro?.genero || ""),
    ano: livro?.ano || "",
    numero_paginas: livro?.numero_paginas || "",
    editora: livro?.editora || "",
    descricao: livro?.descricao || "",
    imagem_capa: livro?.imagem_capa || "",
  };
}

function normalizarGeneroLivro(genero) {
  const valor = String(genero || "").trim();

  const mapaGeneros = {
    Romance: "Romance",
    Fantasia: "Fantasia",
    Terror: "Terror",
    Aventura: "Aventura",
    Ficcao_Cientifica: "Ficcao_Cientifica",
    "Ficcao Cientifica": "Ficcao_Cientifica",
    "Ficcao Científica": "Ficcao_Cientifica",
    "Ficção Científica": "Ficcao_Cientifica",
    Drama: "Drama",
    Autoajuda: "Autoajuda",
    Outro: "Outro",
    Outros: "Outro",
  };

  return mapaGeneros[valor] || valor;
}

function obterDadosLivroDaTela() {
  return normalizarDadosLivro({
    titulo: obterTextoLivro("tituloLivro", "tituloInfo"),
    autor: obterTextoLivro("autorInfo").replace(/^Autor:\s*/i, ""),
    genero: obterTextoLivro("generoInfo").replace(/^G\u00eanero:\s*/i, ""),
    ano: obterTextoLivro("anoInfo").replace(/^Ano:\s*/i, ""),
    numero_paginas: obterTextoLivro("paginasInfo").replace(/^P\u00e1ginas:\s*/i, ""),
    editora: obterTextoLivro("editoraInfo").replace(/^Editora:\s*/i, ""),
    descricao: obterTextoLivro("descricaoLivro", "descricaoInfo"),
    imagem_capa:
      obterElementoLivro("capaLivro", "capaCapa")?.getAttribute("src") || "",
  });
}

function preencherFormularioEdicaoLivro(livro) {
  const dados = normalizarDadosLivro(livro);

  const tituloInput = document.getElementById("tituloLivroEdit");
  if (tituloInput) tituloInput.value = dados.titulo;

  const descricaoInput = document.getElementById("descricaoLivroEdit");
  if (descricaoInput) descricaoInput.value = dados.descricao;

  const autorInput = document.getElementById("autorLivroEdit");
  if (autorInput) autorInput.value = dados.autor;

  const generoInput = document.getElementById("generoLivroEdit");
  if (generoInput) generoInput.value = dados.genero;

  const anoInput = document.getElementById("anoLivroEdit");
  if (anoInput) anoInput.value = dados.ano;

  const paginasInput = document.getElementById("paginasLivroEdit");
  if (paginasInput) paginasInput.value = dados.numero_paginas;

  const editoraInput = document.getElementById("editoraLivroEdit");
  if (editoraInput) editoraInput.value = dados.editora;

  const capaInput = document.getElementById("capaLivroFileEdit");
  if (capaInput) capaInput.value = "";
}

function preencherVisualizacaoLivro(livro) {
  const dados = normalizarDadosLivro(livro);

  const tituloEl = obterElementoLivro("tituloLivro", "tituloInfo");
  if (tituloEl) {
    tituloEl.textContent = dados.titulo || "";
  }

  const descricaoEl = obterElementoLivro("descricaoLivro", "descricaoInfo");
  if (descricaoEl) {
    descricaoEl.textContent = dados.descricao || "";
  }

  const autorInfo = document.getElementById("autorInfo");
  if (autorInfo) {
    autorInfo.textContent = dados.autor ? `Autor: ${dados.autor}` : "Autor: N/A";
  }

  const generoInfo = document.getElementById("generoInfo");
  if (generoInfo) {
    generoInfo.textContent = dados.genero
      ? `G\u00eanero: ${dados.genero}`
      : "G\u00eanero: N/A";
  }

  const anoInfo = document.getElementById("anoInfo");
  if (anoInfo) {
    anoInfo.textContent = dados.ano ? `Ano: ${dados.ano}` : "Ano: N/A";
  }

  const paginasInfo = document.getElementById("paginasInfo");
  if (paginasInfo) {
    paginasInfo.textContent = dados.numero_paginas
      ? `P\u00e1ginas: ${dados.numero_paginas}`
      : "P\u00e1ginas: N/A";
  }

  const editoraInfo = document.getElementById("editoraInfo");
  if (editoraInfo) {
    editoraInfo.textContent = dados.editora
      ? `Editora: ${dados.editora}`
      : "Editora: N/A";
  }

  const capaEl = obterElementoLivro("capaLivro", "capaCapa");
  if (capaEl && dados.imagem_capa) {
    let capa = normalizarUrlMidia(dados.imagem_capa).split("?")[0];
    capa += `?v=${Date.now()}`;
    capaEl.src = capa;
  }
}

function atualizarFeedbackEdicaoLivro(mensagem = "", tipo = "") {
  const feedbackEl = document.getElementById("feedbackEdicaoLivro");
  if (!feedbackEl) return;

  feedbackEl.textContent = mensagem;
  feedbackEl.className = "feedback-edicao";

  if (tipo) {
    feedbackEl.classList.add(`is-${tipo}`);
  }
}

function obterTipoFeedbackEdicao(tipo = "") {
  if (tipo === "success" || tipo === "error" || tipo === "loading") {
    return tipo;
  }

  return "";
}

async function exibirFeedbackEdicaoOuAlert(
  mensagem = "",
  tipo = "error",
  options = {},
) {
  const {
    mostrarPopup = false,
    manterFeedback = false,
    title,
    icon,
    ...alertOptions
  } = options;
  const feedbackEl = document.getElementById("feedbackEdicaoLivro");
  const tipoFeedback = obterTipoFeedbackEdicao(tipo);
  const deveMostrarFeedback =
    !!feedbackEl && (tipo === "loading" || !mostrarPopup || manterFeedback);

  if (feedbackEl) {
    if (deveMostrarFeedback) {
      atualizarFeedbackEdicaoLivro(mensagem, tipoFeedback);
    } else {
      atualizarFeedbackEdicaoLivro("");
    }
  }

  if (mensagem && tipo !== "loading" && (!feedbackEl || mostrarPopup)) {
    return exibirAlertaApp({
      icon: icon || obterIconeAlertaPorTipo(tipo),
      title: title || obterTituloAlertaPorTipo(tipo),
      text: mensagem,
      ...alertOptions,
    });
  }

  return null;
}

function definirEstadoSalvarLivro({ carregando = false } = {}) {
  const botaoSalvar = document.getElementById("btnSalvarLivro");
  if (!botaoSalvar) return;

  botaoSalvar.disabled = carregando;
  botaoSalvar.textContent = carregando
    ? "Salvando alterações..."
    : "Salvar Alterações";
}

function alternarModoEdicaoLivro(ativo) {
  const infoVisualizacao = document.getElementById("infoVisualizacao");
  const infoEdicao = document.getElementById("infoEdicao");
  const acoesLivro = document.getElementById("acoesLivro");
  const acoesEdicao = document.getElementById("acoesEdicao");
  const acoesLivroLeitor = document.getElementById("acoesLivroLeitor");
  const capaEdicaoInfo = document.getElementById("capaEdicaoInfo");

  if (infoVisualizacao) {
    infoVisualizacao.style.display = ativo ? "none" : "block";
  }

  if (infoEdicao) {
    infoEdicao.style.display = ativo ? "block" : "none";
  }

  if (capaEdicaoInfo) {
    capaEdicaoInfo.style.display = ativo ? "flex" : "none";
  }

  if (acoesEdicao) {
    acoesEdicao.style.display = ativo ? "flex" : "none";
  }

  if (ativo) {
    if (acoesLivro) acoesLivro.style.display = "none";
    if (acoesLivroLeitor) acoesLivroLeitor.style.display = "none";
    return;
  }

  if (isBibliotecariaLogada()) {
    if (acoesLivro) acoesLivro.style.display = "flex";
    if (acoesLivroLeitor) acoesLivroLeitor.style.display = "none";
  } else {
    if (acoesLivro) acoesLivro.style.display = "none";
    if (acoesLivroLeitor) acoesLivroLeitor.style.display = "flex";
  }
}

function configurarPreviewCapaLivro() {
  const inputCapaFile = document.getElementById("capaLivroFileEdit");
  const imagemCapa = obterElementoLivro("capaLivro", "capaCapa");

  if (!inputCapaFile || !imagemCapa) {
    return;
  }

  if (inputCapaFile.dataset.previewConfigurado === "true") {
    return;
  }

  inputCapaFile.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      imagemCapa.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  inputCapaFile.dataset.previewConfigurado = "true";
}

async function habilitarEdicaoLivro() {
  if (!isBibliotecariaLogada()) {
    await exibirFeedbackEdicaoOuAlert(
      "Acesso negado. Apenas bibliotecarias podem editar livros.",
      "warning",
      {
        mostrarPopup: true,
        title: "Acesso negado",
      },
    );
    return;
  }

  const dadosBase = livroAtualDados || obterDadosLivroDaTela();
  preencherFormularioEdicaoLivro(dadosBase);
  configurarPreviewCapaLivro();
  atualizarFeedbackEdicaoLivro("");
  alternarModoEdicaoLivro(true);

  console.log("[habilitarEdicaoLivro] Modo de edicao ativado");
}

async function salvarAlteracoesLivro() {
  const livroId = localStorage.getItem("livroAtualId");
  if (!livroId) {
    await exibirFeedbackEdicaoOuAlert("Livro nao encontrado.", "error", {
      mostrarPopup: true,
      title: "Livro nao encontrado",
    });
    return;
  }

  const tituloInput = document.getElementById("tituloLivroEdit");
  const descricaoInput = document.getElementById("descricaoLivroEdit");
  const autorInput = document.getElementById("autorLivroEdit");
  const generoInput = document.getElementById("generoLivroEdit");
  const anoInput = document.getElementById("anoLivroEdit");
  const paginasInput = document.getElementById("paginasLivroEdit");
  const editoraInput = document.getElementById("editoraLivroEdit");
  const capaInput = document.getElementById("capaLivroFileEdit");
  const capaFile = capaInput ? capaInput.files[0] : null;

  const titulo = tituloInput ? tituloInput.value.trim() : "";
  const descricao = descricaoInput ? descricaoInput.value.trim() : "";
  const autor = autorInput ? autorInput.value.trim() : null;
  const genero = generoInput ? normalizarGeneroLivro(generoInput.value) : null;
  const anoTexto = anoInput ? anoInput.value.trim() : null;
  const paginasTexto = paginasInput ? paginasInput.value.trim() : null;
  const editora = editoraInput ? editoraInput.value.trim() : null;

  if (!titulo) {
    await exibirFeedbackEdicaoOuAlert("Titulo e obrigatorio.", "error", {
      mostrarPopup: true,
      manterFeedback: true,
      title: "Campo obrigatorio",
    });
    return;
  }

  if (!descricao) {
    await exibirFeedbackEdicaoOuAlert("Descricao e obrigatoria.", "error", {
      mostrarPopup: true,
      manterFeedback: true,
      title: "Campo obrigatorio",
    });
    return;
  }

  const payload = {
    titulo,
    descricao,
  };

  if (autorInput) {
    if (!autor) {
      await exibirFeedbackEdicaoOuAlert("Autor e obrigatorio.", "error", {
        mostrarPopup: true,
        manterFeedback: true,
        title: "Campo obrigatorio",
      });
      return;
    }
    payload.autor = autor;
  }

  if (generoInput) {
    if (!genero) {
      await exibirFeedbackEdicaoOuAlert("Genero e obrigatorio.", "error", {
        mostrarPopup: true,
        manterFeedback: true,
        title: "Campo obrigatorio",
      });
      return;
    }
    payload.genero = genero;
  }

  if (anoInput) {
    const ano = Number(anoTexto);
    const anoAtual = new Date().getFullYear();
    if (!Number.isInteger(ano) || ano < 1000 || ano > anoAtual) {
      await exibirFeedbackEdicaoOuAlert(
        `Ano invalido. Use um ano entre 1000 e ${anoAtual}.`,
        "error",
        {
          mostrarPopup: true,
          manterFeedback: true,
          title: "Ano invalido",
        },
      );
      return;
    }
    payload.ano = ano;
  }

  if (paginasInput) {
    const paginas = Number(paginasTexto);
    if (!Number.isInteger(paginas) || paginas < 1) {
      await exibirFeedbackEdicaoOuAlert(
        "Numero de paginas invalido.",
        "error",
        {
          mostrarPopup: true,
          manterFeedback: true,
          title: "Quantidade invalida",
        },
      );
      return;
    }
    payload.numero_paginas = paginas;
  }

  if (editoraInput && editora) {
    payload.editora = editora;
  }

  try {
    definirEstadoSalvarLivro({ carregando: true });
    atualizarFeedbackEdicaoLivro("Salvando alterações do livro...", "loading");

    const token = getToken();
    if (!token) {
      await exibirFeedbackEdicaoOuAlert(
        "Voce precisa estar logado para editar livros.",
        "warning",
        {
          mostrarPopup: true,
          manterFeedback: true,
          title: "Login necessario",
        },
      );
      return;
    }

    let imagemUrl = null;

    if (capaFile) {
      try {
        imagemUrl = await uploadImagemLivro(capaFile);
        if (!imagemUrl) {
          throw new Error("URL da imagem nao foi retornada");
        }
        console.log("[salvarAlteracoesLivro] Upload realizado:", imagemUrl);
      } catch (erro) {
        await exibirFeedbackEdicaoOuAlert(
          "Erro ao fazer upload da imagem: " + erro.message,
          "error",
          {
            mostrarPopup: true,
            manterFeedback: true,
            title: "Falha no upload",
          },
        );
        return;
      }
    }

    if (imagemUrl) {
      payload.imagem_capa = normalizarUrlMidia(imagemUrl);
    }

    console.log("[salvarAlteracoesLivro] Enviando dados:", payload);

    const response = await fetch(apiUrl(`/livros/${livroId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[salvarAlteracoesLivro] Status HTTP:", response.status);

    const resultData = await response.json().catch(() => ({}));
    console.log("[salvarAlteracoesLivro] Resposta do servidor:", resultData);

    if (!response.ok) {
      const detalhesValidacao = Array.isArray(resultData.detalhes)
        ? resultData.detalhes
            .map((detalhe) => `${detalhe.path || detalhe.param}: ${detalhe.msg}`)
            .join(" | ")
        : "";
      const erro =
        detalhesValidacao ||
        resultData.mensagem ||
        resultData.erro ||
        `Erro ${response.status}`;
      console.error("[salvarAlteracoesLivro] Erro na resposta:", erro);
      throw new Error(erro);
    }

    livroAtualDados = normalizarDadosLivro({
      ...livroAtualDados,
      ...payload,
      imagem_capa: payload.imagem_capa || livroAtualDados?.imagem_capa || "",
    });

    preencherVisualizacaoLivro(livroAtualDados);
    preencherFormularioEdicaoLivro(livroAtualDados);
    cancelarEdicaoLivro();
    await exibirFeedbackEdicaoOuAlert(
      "Alteracoes salvas com sucesso.",
      "success",
      {
        mostrarPopup: true,
        manterFeedback: true,
        title: "Livro atualizado",
        confirmButtonText: "OK",
        allowOutsideClick: false,
        allowEscapeKey: true,
      },
    );

    console.log("[salvarAlteracoesLivro] Recarregando biblioteca...");
    setTimeout(() => {
      atualizarBibliotecaELista();
    }, 500);
  } catch (erro) {
    console.error("[salvarAlteracoesLivro] Erro completo:", erro);
    await exibirFeedbackEdicaoOuAlert(
      `Erro ao salvar alteracoes: ${erro.message}`,
      "error",
      {
        mostrarPopup: true,
        manterFeedback: true,
        title: "Falha ao salvar alteracoes",
      },
    );
  } finally {
    definirEstadoSalvarLivro({ carregando: false });
  }
}

function cancelarEdicaoLivro() {
  const dadosBase = livroAtualDados || obterDadosLivroDaTela();
  preencherVisualizacaoLivro(dadosBase);
  preencherFormularioEdicaoLivro(dadosBase);
  atualizarFeedbackEdicaoLivro("");
  alternarModoEdicaoLivro(false);

  console.log("[cancelarEdicaoLivro] Modo de edicao cancelado");
}

// ==================== DELETAR LIVRO ====================
async function deletarLivro() {
  if (!isBibliotecariaLogada()) {
    alert("Acesso negado. Apenas bibliotecárias podem deletar livros.");
    return;
  }

  const livroId = localStorage.getItem("livroAtualId");
  if (!livroId) {
    alert("Livro não encontrado");
    return;
  }

  // Confirmar deleção
  const confirmar = confirm(
    "Tem certeza que deseja deletar este livro? Esta ação não pode ser desfeita.",
  );
  if (!confirmar) {
    return;
  }

  try {
    const token = getToken();
    if (!token) {
      alert("Você precisa estar logado");
      return;
    }

    console.log("[deletarLivro] Deletando livro ID:", livroId);

    const response = await fetch(apiUrl(`/livros/${livroId}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[deletarLivro] Status HTTP:", response.status);

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(erro.mensagem || `Erro ${response.status}`);
    }

    const resultado = await response.json();
    console.log("[deletarLivro] Livro deletado com sucesso:", resultado);

    alert("Livro deletado com sucesso!");

    // Redireciona para biblioteca após deletar
    setTimeout(() => {
      window.location.href = "/frontend/src/pages/biblioteca.html";
    }, 500);
  } catch (erro) {
    console.error("[deletarLivro] Erro ao deletar livro:", erro);
    alert("Erro ao deletar livro: " + erro.message);
  }
}

// Carrega dados na página de informaçÃµes
async function carregarDadosLivroInformacoes() {
  showInformacoesSkeleton();

  try {
    const livroId = localStorage.getItem("livroAtualId");
    if (!livroId) {
      alert("Livro nao especificado");
      return;
    }

    console.log(
      "[carregarDadosLivroInformacoes] Carregando livro ID:",
      livroId,
    );

    const response = await fetch(apiUrl(`/livros/${livroId}`));
    if (!response.ok) throw new Error("Erro ao buscar livro");

    const data = await response.json();
    const livro = normalizarDadosLivro(data.livro);

    livroAtualDados = livro;
    preencherVisualizacaoLivro(livro);
    preencherFormularioEdicaoLivro(livro);
    configurarPreviewCapaLivro();
    alternarModoEdicaoLivro(false);
  } catch (erro) {
    console.error("Erro ao carregar livro:", erro);
  } finally {
    hideInformacoesSkeleton();
  }
}

// Carrega foto de perfil do usuário no header em todas as páginas
async function carregarFotoPerfilHeader() {
  try {
    const id = getUsuarioLogadoId();
    const token = getToken();

    // Se não estiver logado, não tenta carregar
    if (!id || !token) {
      return;
    }

    const response = await fetch(apiUrl(`/usuario/${id}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    const apelidoHeader = data.usuario?.apelido || data.usuario?.nome || "";
    localStorage.setItem("usuarioLogadoApelido", String(apelidoHeader).trim());
    atualizarApelidoPerfilHeader(apelidoHeader);

    // Atualiza a imagem de perfil no header se houver foto
    if (data.usuario && data.usuario.foto_perfil) {
      const fotoNormalizada = normalizarUrlFoto(data.usuario.foto_perfil);
      
      const imagemHeader = getPerfilHeaderImageElement();
      if (imagemHeader) {
        imagemHeader.src = fotoNormalizada;
        console.log(
          "[carregarFotoPerfilHeader] Foto carregada:",
          fotoNormalizada,
        );
      }

      // Se estiver na página de perfil, atualizar também a foto principal
      const fotoMain = document.getElementById("fotoPerfilMain");
      if (fotoMain) {
        fotoMain.src = fotoNormalizada;
      }
    }
  } catch (erro) {
    console.error("Erro ao carregar foto de perfil:", erro);
  }
}

// Setup de listeners para upload de imagem
function setupImageUpload() {
  // Listener para input do header (inputFotoPerfil)
  const inputFotoPerfil = document.getElementById("inputFotoPerfil");
  if (inputFotoPerfil && !inputFotoPerfil.hasAttribute("data-listener-added")) {
    inputFotoPerfil.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          // Atualiza foto do header
          const fotoHeader = getPerfilHeaderImageElement();
          if (fotoHeader) {
            fotoHeader.src = event.target.result;
          }

          // Atualiza foto principal
          const fotoMain = document.getElementById("fotoPerfilMain");
          if (fotoMain) {
            fotoMain.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    inputFotoPerfil.setAttribute("data-listener-added", "true");
  }

  // Listener para input da página de perfil (inputFoto)
  const inputFoto = document.getElementById("inputFoto");
  if (inputFoto && !inputFoto.hasAttribute("data-listener-added")) {
    inputFoto.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          // Atualiza foto do header
          const fotoHeader = getPerfilHeaderImageElement();
          if (fotoHeader) {
            fotoHeader.src = event.target.result;
          }

          // Atualiza foto principal
          const fotoMain = document.getElementById("fotoPerfilMain");
          if (fotoMain) {
            fotoMain.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    inputFoto.setAttribute("data-listener-added", "true");
  }
}

function setupPerfilDropdownStyles() {
  if (
    !document.head ||
    document.getElementById("perfil-dropdown-style")
  ) {
    return;
  }

  const style = document.createElement("style");
  style.id = "perfil-dropdown-style";
  style.textContent = `
    header,
    .header,
    .info-perfil {
      overflow: visible;
    }

    header {
      position: relative;
      z-index: 40;
    }

    .perfil-dropdown {
      position: relative;
      z-index: 60;
    }

    .perfil-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 50px;
      padding: 8px 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1));
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      letter-spacing: 0.02em;
      box-sizing: border-box;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
      transition:
        transform 180ms ease,
        box-shadow 180ms ease,
        background-color 180ms ease,
        border-color 180ms ease;
    }

    .perfil-btn:hover {
      transform: translateY(-2px);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.14));
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.24);
    }

    .perfil-btn:focus-visible {
      outline: 2px solid rgba(255, 227, 217, 0.95);
      outline-offset: 3px;
    }

    .perfil-btn.active {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.16));
      box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
    }

    .perfil-btn .perfil-img {
      width: 34px;
      height: 34px;
      min-width: 34px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.16);
    }

    .perfil-nome {
      white-space: nowrap;
      color: inherit;
    }

    .perfil-caret {
      width: 10px;
      height: 10px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg) translateY(-1px);
      transition: transform 180ms ease;
      opacity: 0.92;
      flex-shrink: 0;
    }

    .perfil-btn.active .perfil-caret {
      transform: rotate(-135deg) translateY(-1px);
    }

    .perfil-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      display: flex;
      flex-direction: column;
      min-width: 210px;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      background: rgba(20, 17, 17, 0.92);
      backdrop-filter: blur(14px);
      box-sizing: border-box;
      box-shadow: 0 20px 44px rgba(0, 0, 0, 0.34);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      pointer-events: none;
      transition:
        opacity 180ms ease,
        transform 180ms ease,
        visibility 180ms ease;
      z-index: 1200;
    }

    .perfil-dropdown.active .perfil-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }

    .menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      box-sizing: border-box;
      color: #f9f4f2;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition:
        background-color 160ms ease,
        color 160ms ease;
    }

    .menu-item:hover,
    .menu-item:focus-visible {
      background: rgba(255, 255, 255, 0.09);
      color: #fff;
      transform: none;
      outline: none;
    }

    .menu-item.sair:hover,
    .menu-item.sair:focus-visible {
      background: rgba(224, 82, 53, 0.18);
      color: #ffd8cf;
    }
  `;

  document.head.appendChild(style);
}

// Inicializa comportamentos quando a página estiver pronta
// ==================== PERFIL DROPDOWN ====================
function initPerfilDropdown() {
  const perfilDropdowns = document.querySelectorAll(".perfil-dropdown");
  if (!perfilDropdowns.length) {
    return;
  }

  const fecharDropdown = (dropdown) => {
    const botao = dropdown.querySelector(".perfil-btn");
    dropdown.classList.remove("active");

    if (botao) {
      botao.classList.remove("active");
      botao.setAttribute("aria-expanded", "false");
    }
  };

  const fecharTodosDropdowns = () => {
    perfilDropdowns.forEach((dropdown) => fecharDropdown(dropdown));
  };

  const usuarioApelido = localStorage.getItem("usuarioLogadoApelido");
  if (usuarioApelido) {
    document.querySelectorAll(".perfil-nome").forEach((perfilNome) => {
      perfilNome.textContent = usuarioApelido;
    });
  }

  perfilDropdowns.forEach((perfilDropdown) => {
    const perfilBtn = perfilDropdown.querySelector(".perfil-btn");
    const menuItems = perfilDropdown.querySelectorAll(".menu-item");

    if (!perfilBtn) {
      return;
    }

    perfilBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const vaiAbrir = !perfilDropdown.classList.contains("active");

      fecharTodosDropdowns();

      if (vaiAbrir) {
        perfilDropdown.classList.add("active");
        perfilBtn.classList.add("active");
        perfilBtn.setAttribute("aria-expanded", "true");
      }
    });

    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (item.dataset.logout === "true") {
          logout();
        }

        fecharDropdown(perfilDropdown);
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".perfil-dropdown")) {
      fecharTodosDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharTodosDropdowns();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupPageTransitions();
  setupTransitionLinks();
  setupSkeletonStyles();
  setupPerfilDropdownStyles();
  initPerfilDropdown();
  initPasswordToggles();
  void garantirSweetAlert();

  // Identifica qual página está sendo carregada
  const currentPage = window.location.pathname;
  paginasCarregadas.add(currentPage);

  console.log("[DOMContentLoaded] Página carregada:", currentPage);

  // Evita carregar mais de uma vez na mesma página
  if (paginasCarregadas.size > 1) {
    console.log("[DOMContentLoaded] Pagina ja¡ carregada, ignorando...");
    return;
  }

  initCadastroUsuario();
  initLogin();
  initRedefinirSenha();
  initCadastroLivro();
  atualizarAcessoCadastroLivro();
  atualizarAcessoGerenciamentoUsuarios();
  atualizarApelidoPerfilHeader(localStorage.getItem("usuarioLogadoApelido"));

  if (currentPage.includes("/frontend/src/pages/perfil.html")) {
    carregarPerfil();
    alternarModoEdicaoPerfil(false);
  }

  // Apenas inicializa biblioteca se o usuário estiver logado (tem token)
  const token = getToken();
  const usuarioId = getUsuarioLogadoId();

  console.log("[DOMContentLoaded] Verificando biblioteca com:", {
    temToken: !!token,
    usuarioId,
  });

  if (token && usuarioId) {
    console.log("[DOMContentLoaded] Inicializando biblioteca grid...");
    initBibliotecaGrid();
  } else {
    console.warn("[DOMContentLoaded] Usuário não logado ou token ausente!");
  }

  // Carrega dados da página de avaliação
  if (currentPage.includes("/frontend/src/pages/Avaliacao.html")) {
    carregarDadosLivroAvaliacao();
  }

  // Carrega dados da página de informaçÃµes
  if (currentPage.includes("/frontend/src/pages/informacoes.html")) {
    carregarDadosLivroInformacoes();
  }

  // Carrega foto de perfil
  carregarFotoPerfilHeader();

  // Setup de uploads de imagem
  setupImageUpload();
});


