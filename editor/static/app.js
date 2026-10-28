
const temaAtual = () => document.documentElement.dataset.tema || "escuro";

const editor = CodeMirror(document.getElementById("editor"), {
  mode: "stex",
  theme: temaAtual() === "claro" ? "default" : "material-darker",
  lineNumbers: true,
  lineWrapping: true,
  indentUnit: 2,
  autofocus: true,
});

const listaEl = document.getElementById("lista-artigos");
const atualEl = document.getElementById("artigo-atual");
const statusEl = document.getElementById("resumo-status");
const indicadorEl = document.getElementById("indicador");
const btnSalvar = document.getElementById("btn-salvar");
const btnCompilar = document.getElementById("btn-compilar");
const btnPrevia = document.getElementById("btn-previa");
const btnTema = document.getElementById("btn-tema");
const btnDeletarArtigoEl = document.getElementById("btn-deletar-artigo");
const painelPrevia = document.getElementById("painel-previa");
const divisores = {
  lateral: document.getElementById("divisor-lateral"),
  previa: document.getElementById("divisor-previa"),
};
const lateralEl = document.getElementById("lateral");
const areaPrincipal = document.getElementById("area-principal");
const visualizadorPdf = document.getElementById("visualizador-pdf");
const paginasPdfEl = document.getElementById("paginas-pdf");
const estadoPdfEl = document.getElementById("estado-pdf");
const infoPdfEl = document.getElementById("info-pdf");
const btnZoomMenos = document.getElementById("btn-zoom-menos");
const btnZoomMais = document.getElementById("btn-zoom-mais");
const btnZoomAjustar = document.getElementById("btn-zoom-ajustar");
const btnBaixar = document.getElementById("btn-baixar");
const btnPdfClaro = document.getElementById("btn-pdf-claro");
const btnPdfEscuro = document.getElementById("btn-pdf-escuro");
const painelLog = document.getElementById("painel-log");
const logEl = document.getElementById("log");
const modalNovo = document.getElementById("modal-novo");
const selectModelo = document.getElementById("novo-modelo");

let eventoAtual = null;
let anoAtual = null;
let slugAtual = null;
let sujo = false;
let compilando = false;
let urlPrevia = null;
let pdfAtual = null;
let totalPaginas = 0;
let geracaoPdf = 0;
let geracaoDesenho = 0;
let tarefasDesenho = [];
let ajustarPdf = true;
let zoomPdf = 1;
let timerDesenho = null;
let pdfPaginas = [];
let timerDestaquePdf = null;
let timerDestaqueLinha = null;
let linhaDestaque = null;
let sincronizando = false;

// Painel de arquivos
const painelArquivos = document.getElementById("painel-arquivos");
const listaArquivos = document.getElementById("lista-arquivos");
const msgVazioArquivos = document.getElementById("msg-vazio-arquivos");
const btnNovaPasta = document.getElementById("btn-nova-pasta");
const btnUploadArquivo = document.getElementById("btn-upload-arquivo");
const inputUploadArquivo = document.getElementById("input-upload-arquivo");
const btnVoltarPasta = document.getElementById("btn-voltar-pasta");
const caminhoArquivosEl = document.getElementById("breadcrumb-arquivos");
const buscaArquivosEl = document.getElementById("busca-arquivos");
const dropZoneEl = document.getElementById("drop-zone");

const modalImagem = document.getElementById("modal-imagem");
const btnFecharImagem = document.getElementById("btn-fechar-imagem");
const imagemModal = document.getElementById("imagem-modal");
const infoImagemModal = document.getElementById("info-imagem-modal");
const btnBaixarImagem = document.getElementById("btn-baixar-imagem");
const tituloImagemModal = document.getElementById("titulo-imagem-modal");

// Modais customizados (substituem confirm() e prompt() nativos)
const modalConfirmar = document.getElementById("modal-modal");
const btnConfirmar = document.getElementById("modal-confirmar");
const btnCancelarConfirmar = document.getElementById("modal-cancelar");
const modalTitulo = document.getElementById("modal-titulo");
const modalMensagem = document.getElementById("modal-mensagem");

const modalPrompt = document.getElementById("modal-prompt");
const btnConfirmarPrompt = document.getElementById("prompt-confirmar");
const btnCancelarPrompt = document.getElementById("prompt-cancelar");
const promptTitulo = document.getElementById("prompt-titulo");
const promptMensagem = document.getElementById("prompt-mensagem");
const promptValor = document.getElementById("prompt-valor");

let pastaAtual = null;
let historicoPastas = [];
let todosArquivos = [];

let confirmResolve = null;
let promptResolve = null;
let urlImagemAtual = null;

const ARQUIVOS_PROTEGIDOS = ["artigo.tex", "artigo.meta.json"];

const SVG_PASTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
const SVG_TEXTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>';
const SVG_IMAGEM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>';
const SVG_OUTRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
const SVG_CADEADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

function mostrarConfirmar(titulo, mensagem) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    modalTitulo.textContent = titulo || "Confirmação";
    modalMensagem.textContent = mensagem;
    modalConfirmar.classList.remove("oculto");
  });
}

function mostrarPrompt(titulo, mensagem, valorPadrao = "") {
  return new Promise((resolve) => {
    promptResolve = resolve;
    promptTitulo.textContent = titulo || "Digite o nome";
    promptMensagem.textContent = mensagem || "";
    promptValor.value = valorPadrao;
    modalPrompt.classList.remove("oculto");
    promptValor.focus();
    promptValor.select();
  });
}

function fecharModalConfirmar() {
  modalConfirmar.classList.add("oculto");
  confirmResolve = null;
}

function fecharModalPrompt() {
  modalPrompt.classList.add("oculto");
  promptResolve = null;
}

async function api(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const detalhe = dados.detail;
    const texto = Array.isArray(detalhe)
      ? detalhe.map((d) => d.msg || JSON.stringify(d)).join("; ")
      : detalhe || `Erro ${resposta.status}`;
    throw new Error(texto);
  }
  return dados;
}

function indicador(texto, ocupado = false) {
  indicadorEl.textContent = texto;
  indicadorEl.classList.toggle("ocupado", ocupado);
  indicadorEl.classList.toggle("oculto", !texto);
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  editor.setOption("theme", tema === "claro" ? "default" : "material-darker");
  btnTema.textContent = tema === "claro" ? "Tema: claro" : "Tema: escuro";
  try {
    localStorage.setItem("tema", tema);
  } catch (e) {}
  aplicarTemaPdf(temaPdfAtual());
}

function alternarTema() {
  aplicarTema(temaAtual() === "claro" ? "escuro" : "claro");
}

function temaPdfAtual() {
  try {
    return localStorage.getItem("tema-pdf") || temaAtual();
  } catch (e) {
    return temaAtual();
  }
}

function aplicarTemaPdf(tema, persistir = false) {
  paginasPdfEl.classList.toggle("invertido", tema === "escuro");
  btnPdfClaro.classList.toggle("ativo", tema === "claro");
  btnPdfEscuro.classList.toggle("ativo", tema === "escuro");
  if (persistir) {
    try {
      localStorage.setItem("tema-pdf", tema);
    } catch (e) {}
  }
}

const LATERAL_PADRAO = 280;
const LATERAL_MIN = 210;
const LATERAL_MAX = 520;
const PREVIA_MIN = 300;
const EDITOR_MIN = 260;

function lerNumero(chave) {
  try {
    const valor = parseInt(localStorage.getItem(chave), 10);
    return Number.isFinite(valor) ? valor : null;
  } catch (e) {
    return null;
  }
}

function salvarNumero(chave, valor) {
  try {
    localStorage.setItem(chave, String(Math.round(valor)));
  } catch (e) {}
}

function limitarLateral(px) {
  const max = Math.min(LATERAL_MAX, Math.max(LATERAL_MIN, window.innerWidth * 0.45));
  return Math.round(Math.min(max, Math.max(LATERAL_MIN, px)));
}

function definirLarguraLateral(px, persistir = false) {
  const largura = limitarLateral(px);
  document.body.style.setProperty("--largura-lateral", `${largura}px`);
  if (persistir) salvarNumero("largura-lateral", largura);
  return largura;
}

function limitarPrevia(px) {
  const area = areaPrincipal.getBoundingClientRect().width;
  const max = Math.max(PREVIA_MIN, area - 6 - EDITOR_MIN);
  return Math.round(Math.min(max, Math.max(PREVIA_MIN, px)));
}

function definirLarguraPrevia(px, persistir = false) {
  const largura = limitarPrevia(px);
  document.body.style.setProperty("--largura-previa", `${largura}px`);
  if (persistir) salvarNumero("largura-previa", largura);
  return largura;
}

function larguraLateralAtual() {
  return Math.round(lateralEl.getBoundingClientRect().width);
}

function larguraPreviaAtual() {
  return Math.round(painelPrevia.getBoundingClientRect().width);
}

function aplicarLarguraPreviaSalva() {
  const salva = lerNumero("largura-previa");
  if (salva) definirLarguraPrevia(salva);
}

function tornarArrastavel(divisor, opcoes) {
  const { lerBase, mover, finalizar, restaurar, inverter = false } = opcoes;

  divisor.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0) return;
    evento.preventDefault();
    const base = lerBase();
    const xInicial = evento.clientX;
    divisor.setPointerCapture(evento.pointerId);
    divisor.classList.add("arrastando");
    document.body.classList.add("redimensionando");

    const aoMover = (e) => {
      const delta = e.clientX - xInicial;
      mover(base + (inverter ? -delta : delta));
    };
    const aoSoltar = () => {
      divisor.removeEventListener("pointermove", aoMover);
      divisor.removeEventListener("pointerup", aoSoltar);
      divisor.removeEventListener("pointercancel", aoSoltar);
      divisor.classList.remove("arrastando");
      document.body.classList.remove("redimensionando");
      finalizar();
    };

    divisor.addEventListener("pointermove", aoMover);
    divisor.addEventListener("pointerup", aoSoltar);
    divisor.addEventListener("pointercancel", aoSoltar);
  });

  divisor.addEventListener("dblclick", () => {
    restaurar();
    finalizar();
  });

  divisor.addEventListener("keydown", (evento) => {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    evento.preventDefault();
    const passo = evento.shiftKey ? 40 : 12;
    const direcao = evento.key === "ArrowLeft" ? -1 : 1;
    const valor = lerBase() + (inverter ? -direcao : direcao) * passo;
    mover(valor);
    finalizar();
  });
}

tornarArrastavel(divisores.lateral, {
  lerBase: larguraLateralAtual,
  mover: (px) => {
    definirLarguraLateral(px);
    if (!painelPrevia.classList.contains("oculto")) {
      definirLarguraPrevia(larguraPreviaAtual());
    }
  },
  restaurar: () => definirLarguraLateral(LATERAL_PADRAO),
  finalizar: () => {
    salvarNumero("largura-lateral", larguraLateralAtual());
    editor.refresh();
  },
});

tornarArrastavel(divisores.previa, {
  lerBase: larguraPreviaAtual,
  mover: (px) => definirLarguraPrevia(px),
  inverter: true,
  restaurar: () => definirLarguraPrevia(areaPrincipal.clientWidth / 2),
  finalizar: () => {
    salvarNumero("largura-previa", larguraPreviaAtual());
    editor.refresh();
  },
});

const observadorPrevia = new ResizeObserver(() => {
  if (!pdfAtual || sincronizando || painelPrevia.classList.contains("oculto")) return;
  agendarDesenho();
});
observadorPrevia.observe(painelPrevia);

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    definirLarguraLateral(larguraLateralAtual());
    if (!painelPrevia.classList.contains("oculto")) {
      definirLarguraPrevia(larguraPreviaAtual());
    }
  }
  editor.refresh();
});

function estadoPdf(texto) {
  estadoPdfEl.textContent = texto || "";
  estadoPdfEl.classList.toggle("oculto", !texto);
}

function atualizarInfoPdf() {
  if (!totalPaginas) {
    infoPdfEl.textContent = "";
    return;
  }
  const partes = [totalPaginas === 1 ? "1 página" : `${totalPaginas} páginas`];
  if (!ajustarPdf) partes.push(`${Math.round(zoomPdf * 100)}%`);
  infoPdfEl.textContent = partes.join(" · ");
}

function larguraPaginaPdf() {
  const estilo = getComputedStyle(visualizadorPdf);
  const espacamento =
    parseFloat(estilo.paddingLeft) + parseFloat(estilo.paddingRight);
  if (ajustarPdf) {
    return Math.max(240, visualizadorPdf.clientWidth - espacamento);
  }
  return Math.max(240, 794 * zoomPdf);
}

function cancelarDesenhos() {
  geracaoDesenho += 1;
  for (const tarefa of tarefasDesenho) {
    try {
      tarefa.cancel();
    } catch (e) {}
  }
  tarefasDesenho = [];
}

async function carregarPdf(url) {
  const geracao = ++geracaoPdf;
  cancelarDesenhos();
  paginasPdfEl.innerHTML = "";
  pdfPaginas = [];
  totalPaginas = 0;
  atualizarInfoPdf();
  estadoPdf("Carregando PDF…");

  if (!window.pdfjsLib) {
    estadoPdf("Visualizador de PDF indisponível neste navegador. Use o botão Baixar PDF.");
    return;
  }

  try {
    const resposta = await fetch(url, { cache: "no-store" });
    if (!resposta.ok) throw new Error(`não foi possível abrir o PDF (${resposta.status})`);
    const dados = await resposta.arrayBuffer();
    if (geracao !== geracaoPdf) return;

    if (pdfAtual) {
      pdfAtual.destroy();
      pdfAtual = null;
    }
    const documento = await pdfjsLib.getDocument({ data: dados }).promise;
    if (geracao !== geracaoPdf) {
      documento.destroy();
      return;
    }
    pdfAtual = documento;
    totalPaginas = documento.numPages;
    atualizarInfoPdf();
    await desenharPdf(geracao);
  } catch (erro) {
    if (geracao !== geracaoPdf) return;
    estadoPdf(`Não foi possível mostrar o PDF: ${erro.message}`);
  }
}

async function desenharPdf(geracao = geracaoPdf) {
  if (!pdfAtual || geracao !== geracaoPdf) return;
  const desenho = ++geracaoDesenho;
  for (const tarefa of tarefasDesenho) {
    try {
      tarefa.cancel();
    } catch (e) {}
  }
  tarefasDesenho = [];

  const percorrivel = Math.max(0, visualizadorPdf.scrollHeight - visualizadorPdf.clientHeight);
  const proporcao = percorrivel > 0 ? visualizadorPdf.scrollTop / percorrivel : 0;

  paginasPdfEl.innerHTML = "";
  pdfPaginas = [];
  estadoPdf("");
  const largura = larguraPaginaPdf();
  const densidade = Math.min(window.devicePixelRatio || 1, 1.5);

  try {
    for (let numero = 1; numero <= pdfAtual.numPages; numero++) {
      if (desenho !== geracaoDesenho || geracao !== geracaoPdf) return;
      const pagina = await pdfAtual.getPage(numero);
      const base = pagina.getViewport({ scale: 1 });
      const escala = (largura / base.width) * densidade;
      const viewport = pagina.getViewport({ scale: escala });

      const moldura = document.createElement("div");
      moldura.className = "pagina-pdf";
      moldura.style.width = `${largura}px`;
      moldura.dataset.pagina = String(numero);
      moldura.dataset.baseWidth = String(base.width);
      moldura.dataset.baseHeight = String(base.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      moldura.appendChild(canvas);
      paginasPdfEl.appendChild(moldura);
      pdfPaginas.push({
        numero,
        moldura,
        baseWidth: base.width,
        baseHeight: base.height,
      });

      const tarefa = pagina.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
      });
      tarefasDesenho.push(tarefa);
      try {
        await tarefa.promise;
      } catch (erro) {
        if (erro.name !== "RenderingCancelledException") throw erro;
        return;
      }
    }

    if (desenho !== geracaoDesenho || geracao !== geracaoPdf) return;
    await new Promise((resolver) => {
      requestAnimationFrame(() => {
        const novo = Math.max(
          0,
          visualizadorPdf.scrollHeight - visualizadorPdf.clientHeight,
        );
        visualizadorPdf.scrollTop = proporcao * novo;
        resolver();
      });
    });
  } catch (erro) {
    if (desenho !== geracaoDesenho) return;
    estadoPdf(`Não foi possível mostrar o PDF: ${erro.message}`);
  }
}

function agendarDesenho() {
  clearTimeout(timerDesenho);
  timerDesenho = setTimeout(() => desenharPdf(), 180);
}

function limparDestaquesPdf() {
  clearTimeout(timerDestaquePdf);
  paginasPdfEl.querySelectorAll(".destaque-synctex").forEach((el) => el.remove());
}

function destacarCaixasPdf(caixas) {
  limparDestaquesPdf();
  if (!Array.isArray(caixas)) return;
  for (const caixa of caixas) {
    const meta = pdfPaginas.find((p) => p.numero === Number(caixa.pagina));
    if (!meta) continue;
    const destaque = document.createElement("div");
    destaque.className = "destaque-synctex";
    destaque.style.left = `${(Number(caixa.h) / meta.baseWidth) * 100}%`;
    destaque.style.top = `${(Number(caixa.v) / meta.baseHeight) * 100}%`;
    destaque.style.width = `${(Number(caixa.W) / meta.baseWidth) * 100}%`;
    destaque.style.height = `${(Number(caixa.H) / meta.baseHeight) * 100}%`;
    meta.moldura.appendChild(destaque);
  }
  timerDestaquePdf = setTimeout(limparDestaquesPdf, 2600);
}

function rolarParaCaixaPdf(caixa) {
  if (!caixa) return;
  const meta = pdfPaginas.find((p) => p.numero === Number(caixa.pagina));
  if (!meta) return;
  const rect = meta.moldura.getBoundingClientRect();
  const topoPagina =
    rect.top - visualizadorPdf.getBoundingClientRect().top + visualizadorPdf.scrollTop;
  const topoCaixa = (Number(caixa.v) / meta.baseHeight) * rect.height;
  const margem = Math.min(120, visualizadorPdf.clientHeight * 0.2);
  visualizadorPdf.scrollTo({
    top: Math.max(0, topoPagina + topoCaixa - margem),
    behavior: "smooth",
  });
}

function destacarLinhaEditor(linha) {
  const zero = Math.max(0, Number(linha) - 1);
  editor.setCursor({ line: zero, ch: 0 });
  editor.scrollIntoView({ line: zero, ch: 0 }, 120);
  editor.focus();
  if (linhaDestaque !== null) {
    editor.removeLineClass(linhaDestaque, "background", "linha-synctex");
  }
  editor.addLineClass(zero, "background", "linha-synctex");
  linhaDestaque = zero;
  clearTimeout(timerDestaqueLinha);
  timerDestaqueLinha = setTimeout(() => {
    editor.removeLineClass(zero, "background", "linha-synctex");
    if (linhaDestaque === zero) linhaDestaque = null;
  }, 2600);
}

async function sincronizarEditorParaPdf() {
  if (!slugAtual || sincronizando) return;
  if (!urlPrevia) {
    indicador("Compile o artigo para sincronizar.");
    setTimeout(() => indicador(""), 2500);
    return;
  }
  sincronizando = true;
  try {
    if (painelPrevia.classList.contains("oculto") || !pdfAtual) {
      await mostrarPrevia(urlPrevia);
    }
    if (!pdfPaginas.length) await desenharPdf();
    if (!pdfPaginas.length) {
      indicador("Prévia do PDF indisponível.");
      setTimeout(() => indicador(""), 2500);
      return;
    }
    const cursor = editor.getCursor();
    const dados = await api(
      `/api/artigos/${eventoAtual}/${anoAtual}/${slugAtual}/synctex/ida?linha=${cursor.line + 1}&coluna=${cursor.ch + 1}`,
    );
    if (!dados.ok) {
      indicador(dados.mensagem || "Sem correspondência no PDF.");
      setTimeout(() => indicador(""), 3000);
      return;
    }
    destacarCaixasPdf(dados.caixas || []);
    rolarParaCaixaPdf((dados.caixas || [])[0]);
    indicador("PDF sincronizado");
    setTimeout(() => indicador(""), 1200);
  } catch (erro) {
    indicador("");
    alert(erro.message);
  } finally {
    sincronizando = false;
  }
}

async function sincronizarPdfParaEditor(evento) {
  if (!slugAtual || sincronizando) return;
  const moldura = evento.target.closest(".pagina-pdf");
  if (!moldura) return;
  const pagina = Number(moldura.dataset.pagina);
  const baseWidth = Number(moldura.dataset.baseWidth);
  const baseHeight = Number(moldura.dataset.baseHeight);
  const rect = moldura.getBoundingClientRect();
  if (!pagina || !baseWidth || !baseHeight || !rect.width || !rect.height) return;
  const x = ((evento.clientX - rect.left) / rect.width) * baseWidth;
  const y = ((evento.clientY - rect.top) / rect.height) * baseHeight;
  sincronizando = true;
  try {
    const dados = await api(
      `/api/artigos/${eventoAtual}/${anoAtual}/${slugAtual}/synctex/volta?pagina=${pagina}&x=${x.toFixed(2)}&y=${y.toFixed(2)}`,
    );
    if (!dados.ok) {
      indicador(dados.mensagem || "Sem correspondência no texto.");
      setTimeout(() => indicador(""), 3000);
      return;
    }
    destacarLinhaEditor(dados.linha);
    indicador("Texto sincronizado");
    setTimeout(() => indicador(""), 1200);
  } catch (erro) {
    indicador("");
    alert(erro.message);
  } finally {
    sincronizando = false;
  }
}

function aplicarZoom(ajustar, fator) {
  ajustarPdf = ajustar;
  zoomPdf = Math.max(0.5, Math.min(3, fator));
  btnZoomAjustar.classList.toggle("ativo", ajustarPdf);
  atualizarInfoPdf();
  if (pdfAtual) desenharPdf();
}

function zoomRelativo(passo) {
  const larguraAtual = ajustarPdf ? larguraPaginaPdf() : 794 * zoomPdf;
  aplicarZoom(false, (larguraAtual + passo) / 794);
}

function mostrarPrevia(url) {
  const urlMudou = url !== urlPrevia;
  urlPrevia = url;
  btnBaixar.href = url + (url.includes("?") ? "&" : "?") + "download=1";
  painelPrevia.classList.remove("oculto");
  divisores.previa.classList.remove("oculto");
  btnPrevia.classList.remove("oculto");
  aplicarLarguraPreviaSalva();

  if (urlMudou || !pdfAtual) {
    return carregarPdf(url);
  }
  return desenharPdf();
}

function fecharPrevia() {
  painelPrevia.classList.add("oculto");
  divisores.previa.classList.add("oculto");
  editor.refresh();
}

function limparPrevia() {
  urlPrevia = null;
  fecharPrevia();
  btnPrevia.classList.add("oculto");
  geracaoPdf += 1;
  cancelarDesenhos();
  limparDestaquesPdf();
  if (pdfAtual) {
    pdfAtual.destroy();
    pdfAtual = null;
  }
  paginasPdfEl.innerHTML = "";
  pdfPaginas = [];
  totalPaginas = 0;
  atualizarInfoPdf();
  estadoPdf("Compile o artigo para ver o PDF aqui.");
}

async function carregarStatus() {
  try {
    const s = await api("/api/status");
    statusEl.textContent = `${s.artigos} artigos · pdflatex ${s.pdflatex ? "ok" : "ausente"} · ${s.synctex ? "sincronia ok" : "sincronia ausente"}`;
  } catch (e) {
    statusEl.textContent = "sem conexão com a API";
  }
}

async function carregarModelos() {
  try {
    const modelos = await api("/api/modelos");
    selectModelo.innerHTML = "";
    for (const m of modelos) {
      const opcao = document.createElement("option");
      opcao.value = m.nome;
      opcao.textContent = `${m.nome} — ${m.descricao}`;
      selectModelo.appendChild(opcao);
    }
  } catch (e) {
    selectModelo.innerHTML = "<option>Erro ao carregar modelos</option>";
  }
}

async function carregarLista() {
  const artigos = await api("/api/artigos");
  listaEl.innerHTML = "";
  if (!artigos.length) {
    listaEl.innerHTML = "<li style='color: var(--texto-fraco); font-style: italic;'>Nenhum artigo encontrado.</li>";
    return;
  }
  for (const a of artigos) {
    const li = document.createElement("li");
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "item-lista";
    botao.dataset.evento = a.evento;
    botao.dataset.ano = a.ano;
    botao.dataset.slug = a.slug;
    if (a.slug === slugAtual && a.evento === eventoAtual && a.ano === anoAtual) botao.classList.add("ativo");
    const titulo = document.createElement("span");
    titulo.className = "titulo-item";
    titulo.textContent = a.titulo || a.slug;
    const rotulo = document.createElement("small");
    rotulo.textContent = `${a.evento}/${a.ano} · ${a.modelo || "-"} · ${a.slug}`;
    botao.append(titulo, rotulo);
    botao.addEventListener("click", () => abrirArtigo(a.evento, a.ano, a.slug));
    li.appendChild(botao);
    listaEl.appendChild(li);
  }
}

function marcarAtivo() {
  listaEl.querySelectorAll(".item-lista").forEach((b) => {
    b.classList.toggle("ativo", b.dataset.slug === slugAtual && b.dataset.evento === eventoAtual && b.dataset.ano === anoAtual);
  });
}

function resetarNavegacaoArquivos() {
  pastaAtual = null;
  historicoPastas = [];
}

function urlArquivos(caminhoRelativo = "") {
  const base = `/api/artigos/${eventoAtual}/${anoAtual}/${slugAtual}/files`;
  return caminhoRelativo ? `${base}/${caminhoRelativo}` : base;
}

function atualizarBreadcrumb() {
  if (!caminhoArquivosEl) return;
  caminhoArquivosEl.innerHTML = "";
  const raiz = document.createElement("button");
  raiz.type = "button";
  raiz.className = "trecho-breadcrumb";
  raiz.textContent = "Artigo";
  raiz.addEventListener("click", () => navegarPara(""));
  caminhoArquivosEl.appendChild(raiz);
  if (pastaAtual) {
    const partes = pastaAtual.split("/");
    partes.forEach((parte, indice) => {
      const separador = document.createElement("span");
      separador.className = "separador-breadcrumb";
      separador.textContent = "/";
      caminhoArquivosEl.appendChild(separador);
      const trecho = document.createElement("button");
      trecho.type = "button";
      trecho.className = "trecho-breadcrumb";
      trecho.textContent = parte;
      if (indice === partes.length - 1) trecho.classList.add("atual");
      trecho.addEventListener("click", () => navegarPara(partes.slice(0, indice + 1).join("/")));
      caminhoArquivosEl.appendChild(trecho);
    });
  }
  if (btnVoltarPasta) btnVoltarPasta.disabled = historicoPastas.length === 0;
}

function navegarPara(caminho) {
  if ((pastaAtual || "") === caminho) return;
  historicoPastas.push(pastaAtual);
  pastaAtual = caminho || null;
  carregarArquivos();
}

function filtrarArquivos() {
  const termo = (buscaArquivosEl ? buscaArquivosEl.value : "").trim().toLowerCase();
  if (!termo) {
    renderizarArquivos(todosArquivos);
    return;
  }
  renderizarArquivos(todosArquivos.filter((item) => item.nome.toLowerCase().includes(termo)));
}

async function carregarArquivos() {
  if (!slugAtual) {
    if (painelArquivos) painelArquivos.classList.add("oculto");
    return;
  }
  try {
    const itens = await api(urlArquivos(pastaAtual || ""));
    todosArquivos = itens;
    filtrarArquivos();
    atualizarBreadcrumb();
  } catch (e) {
    indicador("");
    alert(e.message);
  }
}

function renderizarArquivos(itens) {
  if (!listaArquivos) return;
  listaArquivos.innerHTML = "";
  if (msgVazioArquivos) msgVazioArquivos.classList.toggle("oculto", itens.length > 0);

  for (const item of itens) {
    const li = document.createElement("li");
    li.className = "item-arquivo";

    const tipo = item.tipo === "pasta" ? "pasta" : (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(item.nome.toLowerCase().split(".").pop()) ? "imagem" : (esTipoTexto(item.nome) ? "texto" : "outro"));

    const icone = document.createElement("span");
    icone.className = `icone icone-${tipo}`;
    icone.innerHTML = tipo === "pasta" ? SVG_PASTA : tipo === "imagem" ? SVG_IMAGEM : tipo === "texto" ? SVG_TEXTO : SVG_OUTRO;

    const info = document.createElement("div");
    info.className = "info-arquivo";

    const nome = document.createElement("span");
    nome.className = "nome-arquivo";
    nome.textContent = item.nome;

    const meta = document.createElement("span");
    meta.className = "meta-arquivo";
    if (item.tipo === "pasta") {
      meta.textContent = "pasta";
    } else {
      const kb = (item.tamanho / 1024).toFixed(1);
      meta.textContent = `${kb} KB`;
    }

    info.append(icone, nome, meta);

    const acoes = document.createElement("div");
    acoes.className = "acoes-item";

    if (item.tipo === "pasta") {
      const btnAbrir = document.createElement("button");
      btnAbrir.type = "button";
      btnAbrir.className = "btn-menu";
      btnAbrir.textContent = "Abrir";
      btnAbrir.addEventListener("click", (e) => {
        e.stopPropagation();
        historicoPastas.push(pastaAtual);
        pastaAtual = item.caminho;
        carregarArquivos();
      });
      acoes.appendChild(btnAbrir);
    } else {
      if (tipo === "texto") {
        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn-menu";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", (e) => {
          e.stopPropagation();
          editarArquivoTexto(item.caminho);
        });
        acoes.appendChild(btnEditar);
      } else if (tipo === "imagem") {
        const btnVer = document.createElement("button");
        btnVer.type = "button";
        btnVer.className = "btn-menu";
        btnVer.textContent = "Visualizar";
        btnVer.addEventListener("click", (e) => {
          e.stopPropagation();
          abrirModalImagem(item.caminho, item.tamanho);
        });
        acoes.appendChild(btnVer);
      }

      const btnBaixar = document.createElement("button");
      btnBaixar.type = "button";
      btnBaixar.className = "btn-menu";
      btnBaixar.textContent = "Baixar";
      btnBaixar.addEventListener("click", (e) => {
        e.stopPropagation();
        baixarArquivo(item.caminho);
      });
      acoes.appendChild(btnBaixar);

      const btnRenomear = document.createElement("button");
      btnRenomear.type = "button";
      btnRenomear.className = "btn-menu";
      btnRenomear.textContent = "Renomear";
      btnRenomear.addEventListener("click", (e) => {
        e.stopPropagation();
        renomearItem(item.caminho);
      });
      acoes.appendChild(btnRenomear);

      const btnDeletar = document.createElement("button");
      btnDeletar.type = "button";
      btnDeletar.className = "btn-menu deletar";
      btnDeletar.textContent = "Deletar";
      btnDeletar.addEventListener("click", (e) => {
        e.stopPropagation();
        deletarItem(item.caminho, item.tipo);
      });
      acoes.appendChild(btnDeletar);
    }

    li.append(info, acoes);
    listaArquivos.appendChild(li);
  }
}

function esTipoTexto(nome) {
  const ext = nome.toLowerCase().split(".").pop();
  return ["tex", "bib", "json", "txt", "md", "cls", "bst", "sty"].includes(ext);
}

async function criarPasta() {
  const nome = await mostrarPrompt("Nova pasta", "Nome da nova pasta:");
  if (!nome) return;
  try {
    await api(urlArquivos(), {
      method: "POST",
      body: JSON.stringify({ nome }),
    });
    await carregarArquivos();
  } catch (e) {
    alert(e.message);
  }
}

async function enviarArquivosArrastados(files) {
  for (const f of files) {
    const formData = new FormData();
    formData.append("arquivo", f);
    const resposta = await fetch(urlArquivos(pastaAtual || ""), {
      method: "PUT",
      body: formData,
    });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.detail || "Erro ao enviar arquivo.");
    }
  }
  await carregarArquivos();
}

async function uploadArquivos() {
  const files = inputUploadArquivo.files;
  if (!files || files.length === 0) return;
  try {
    await enviarArquivosArrastados(files);
    inputUploadArquivo.value = "";
  } catch (e) {
    alert(e.message);
  }
}

async function baixarArquivo(caminho) {
  window.location.href = urlArquivos(caminho);
}

async function deletarItem(caminho, tipo) {
  const confirmado = await mostrarConfirmar(
    tipo === "pasta" ? "Deletar pasta" : "Deletar arquivo",
    tipo === "pasta"
      ? `Tem certeza que deseja deletar a pasta "${caminho}"? Ela precisa estar vazia.`
      : `Tem certeza que deseja deletar o arquivo "${caminho}"?`
  );
  if (!confirmado) return;
  try {
    await api(urlArquivos(caminho), { method: "DELETE" });
    await carregarArquivos();
  } catch (e) {
    alert(e.message);
  }
}

async function renomearItem(caminhoAntigo) {
  const nomeAtual = caminhoAntigo.split("/").pop();
  const novoNome = await mostrarPrompt("Renomear", "Novo nome:", nomeAtual);
  if (!novoNome || novoNome === nomeAtual) return;
  const partes = caminhoAntigo.split("/");
  partes.pop();
  partes.push(novoNome);
  try {
    await api(urlArquivos("move"), {
      method: "POST",
      body: JSON.stringify({ origem: caminhoAntigo, destino: partes.join("/") }),
    });
    await carregarArquivos();
  } catch (e) {
    alert(e.message);
  }
}

async function abrirModalImagem(caminho, tamanho) {
  try {
    const url = urlArquivos(caminho);
    const resposta = await fetch(url, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Não foi possível carregar a imagem.");
    const blob = await resposta.blob();
    if (urlImagemAtual) URL.revokeObjectURL(urlImagemAtual);
    urlImagemAtual = URL.createObjectURL(blob);
    imagemModal.src = urlImagemAtual;
    tituloImagemModal.textContent = caminho.split("/").pop();
    btnBaixarImagem.href = url;
    const kb = (tamanho / 1024).toFixed(1);
    infoImagemModal.textContent = `${kb} KB · ${caminho}`;
    modalImagem.classList.remove("oculto");
  } catch (e) {
    alert(e.message);
  }
}

function fecharModalImagem() {
  modalImagem.classList.add("oculto");
  imagemModal.removeAttribute("src");
  if (urlImagemAtual) {
    URL.revokeObjectURL(urlImagemAtual);
    urlImagemAtual = null;
  }
}

async function editarArquivoTexto(caminho) {
  try {
    if (sujo) {
      const confirmado = await mostrarConfirmar(
        "Alterações não salvas",
        "Há alterações não salvas no editor. Abrir este arquivo mesmo assim?"
      );
      if (!confirmado) return;
    }
    const resposta = await fetch(urlArquivos(caminho));
    if (!resposta.ok) throw new Error("Não foi possível ler o arquivo.");
    const conteudo = await resposta.text();
    editor.setValue(conteudo);
    sujo = false;
    btnSalvar.disabled = true;
    btnCompilar.disabled = false;
    limparPrevia();
    fecharLog();
    marcarAtivo();
    indicador(`Editando: ${caminho}`);
    setTimeout(() => indicador(""), 1500);
  } catch (e) {
    alert(e.message);
  }
}

async function abrirArtigo(evento, ano, slug) {
  if (sujo) {
    const confirmado = await mostrarConfirmar(
      "Alterações não salvas",
      "Há alterações não salvas no editor. Abrir outro artigo mesmo assim?"
    );
    if (!confirmado) return;
  }
  try {
    indicador("carregando…", true);
    const dados = await api(`/api/artigos/${evento}/${ano}/${slug}`);
    eventoAtual = dados.evento;
    anoAtual = dados.ano;
    slugAtual = dados.slug;
    editor.setValue(dados.conteudo);
    sujo = false;
    atualEl.textContent = dados.titulo || dados.slug;
    btnSalvar.disabled = true;
    btnCompilar.disabled = false;
    if (btnDeletarArtigoEl) btnDeletarArtigoEl.disabled = false;
    limparPrevia();
    fecharLog();
    marcarAtivo();
    resetarNavegacaoArquivos();
    if (painelArquivos) painelArquivos.classList.remove("oculto");
    carregarArquivos();
    indicador("");
  } catch (e) {
    indicador("");
    alert(e.message);
  }
}

async function salvar() {
  if (!slugAtual) return;
  try {
    indicador("salvando…", true);
    await api(`/api/artigos/${eventoAtual}/${anoAtual}/${slugAtual}`, {
      method: "PUT",
      body: JSON.stringify({ conteudo: editor.getValue() }),
    });
    sujo = false;
    btnSalvar.disabled = true;
    indicador("salvo");
    setTimeout(() => indicador(""), 1500);
    carregarLista();
  } catch (e) {
    indicador("");
    alert(e.message);
  }
}

async function deletarArtigo() {
  if (!slugAtual) return;
  const confirmado = await mostrarConfirmar(
    "Deletar artigo",
    `Tem certeza que deseja deletar o artigo "${atualEl.textContent}"? Todos os arquivos também serão removidos. Esta ação não pode ser desfeita.`
  );
  if (!confirmado) return;
  try {
    indicador("deletando…", true);
    await api(`/api/artigos/${eventoAtual}/${anoAtual}/${slugAtual}`, { method: "DELETE" });
    eventoAtual = null;
    anoAtual = null;
    slugAtual = null;
    if (atualEl) atualEl.textContent = "Nenhum artigo aberto";
    if (editor) editor.setValue("");
    sujo = false;
    if (btnSalvar) btnSalvar.disabled = true;
    if (btnCompilar) btnCompilar.disabled = true;
    if (btnDeletarArtigoEl) btnDeletarArtigoEl.disabled = true;
    if (painelArquivos) painelArquivos.classList.add("oculto");
    limparPrevia();
    fecharLog();
    carregarLista();
    indicador("");
    setTimeout(() => indicador("Artigo deletado"), 1500);
  } catch (e) {
    indicador("");
    alert(e.message);
  }
}

function mostrarLog(dados) {
  const partes = [];
  if (dados.mensagem) partes.push(dados.mensagem);
  if (dados.erros && dados.erros.length) {
    partes.push("Erros:\n" + dados.erros.join("\n\n"));
  }
  if (dados.log) partes.push(dados.log);
  logEl.textContent = partes.join("\n\n") || "Sem saída.";
  painelLog.classList.remove("oculto");
}

function fecharLog() {
  painelLog.classList.add("oculto");
}

async function compilar() {
  if (!slugAtual || compilando) return;
  if (sujo) await salvar();
  try {
    compilando = true;
    indicador("compilando…", true);
    btnCompilar.disabled = true;
    const dados = await api(`/api/artigos/${eventoAtual}/${anoAtual}/${slugAtual}/compilar`, { method: "POST" });
    mostrarLog(dados);
    if (dados.ok && dados.pdf) {
      await mostrarPrevia(dados.pdf);
      indicador("PDF pronto");
    } else {
      limparPrevia();
      indicador("falhou");
    }
  } catch (e) {
    indicador("");
    alert(e.message);
  } finally {
    compilando = false;
    btnCompilar.disabled = false;
  }
}

function abrirModal() {
  document.getElementById("novo-slug").value = "";
  document.getElementById("novo-titulo").value = "";
  document.getElementById("erro-novo").classList.add("oculto");
  carregarModelos();
  modalNovo.classList.remove("oculto");
  document.getElementById("novo-slug").focus();
}

function fecharModal() {
  modalNovo.classList.add("oculto");
}

async function criarArtigo() {
  const modelo = document.getElementById("novo-modelo").value;
  const slug = document.getElementById("novo-slug").value.trim().toLowerCase();
  const titulo = document.getElementById("novo-titulo").value.trim();
  const erroEl = document.getElementById("erro-novo");
  try {
    await api("/api/artigos", {
      method: "POST",
      body: JSON.stringify({ modelo, slug, titulo: titulo || "Novo artigo" }),
    });
    fecharModal();
    await carregarLista();
  } catch (e) {
    erroEl.textContent = e.message;
    erroEl.classList.remove("oculto");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    aplicarTema(temaAtual());
    aplicarTemaPdf(temaPdfAtual());
    await carregarStatus();
    await carregarModelos();
    await carregarLista();
    const artigos = await api("/api/artigos");
    statusEl.textContent = artigos.length
      ? `${artigos.length} artigo(s) carregado(s)`
      : "Nenhum artigo encontrado.";
    if (artigos.length) await abrirArtigo(artigos[0].evento, artigos[0].ano, artigos[0].slug);
  } catch (e) {
    statusEl.textContent = "Erro: " + e.message;
    listaEl.innerHTML = `<li style='color: var(--erro);'>Erro: ${e.message}</li>`;
    console.error(e);
  }
});

editor.on("change", () => {
  sujo = true;
  btnSalvar.disabled = false;
});

editor.getWrapperElement().addEventListener("click", (evento) => {
  if (evento.button !== 0) return;
  if (!evento.target.closest(".CodeMirror-lines")) return;
  sincronizarEditorParaPdf();
});
visualizadorPdf.addEventListener("click", sincronizarPdfParaEditor);

btnTema.addEventListener("click", alternarTema);
btnPdfClaro.addEventListener("click", () => aplicarTemaPdf("claro", true));
btnPdfEscuro.addEventListener("click", () => aplicarTemaPdf("escuro", true));
btnZoomMenos.addEventListener("click", () => zoomRelativo(-80));
btnZoomMais.addEventListener("click", () => zoomRelativo(80));
btnZoomAjustar.addEventListener("click", () => aplicarZoom(true, zoomPdf));
document.getElementById("btn-salvar").addEventListener("click", salvar);
document.getElementById("btn-deletar-artigo").addEventListener("click", deletarArtigo);
document.getElementById("btn-compilar").addEventListener("click", compilar);
document.getElementById("btn-fechar-log").addEventListener("click", fecharLog);
document.getElementById("btn-fechar-previa").addEventListener("click", fecharPrevia);
btnPrevia.addEventListener("click", () => {
  if (urlPrevia) mostrarPrevia(urlPrevia);
});
document.getElementById("btn-novo").addEventListener("click", abrirModal);
document.getElementById("btn-cancelar-novo").addEventListener("click", fecharModal);
document.getElementById("btn-criar-novo").addEventListener("click", criarArtigo);
modalNovo.addEventListener("click", (e) => {
  if (e.target === modalNovo) fecharModal();
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    salvar();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    compilar();
  }
});

window.addEventListener("beforeunload", (e) => {
  if (sujo) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// Event listeners do painel de arquivos
btnNovaPasta.addEventListener("click", criarPasta);
btnUploadArquivo.addEventListener("click", () => inputUploadArquivo.click());
inputUploadArquivo.addEventListener("change", uploadArquivos);
btnVoltarPasta.addEventListener("click", async () => {
  if (historicoPastas.length === 0) return;
  pastaAtual = historicoPastas.pop();
  await carregarArquivos();
});

btnFecharImagem.addEventListener("click", fecharModalImagem);
modalImagem.addEventListener("click", (e) => {
  if (e.target === modalImagem) fecharModalImagem();
});

buscaArquivosEl.addEventListener("input", filtrarArquivos);

if (painelArquivos) {
  painelArquivos.addEventListener("dragover", (e) => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes("Files")) return;
    e.preventDefault();
    dropZoneEl.classList.add("ativo");
  });
  painelArquivos.addEventListener("dragleave", (e) => {
    if (painelArquivos.contains(e.relatedTarget)) return;
    dropZoneEl.classList.remove("ativo");
  });
  painelArquivos.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZoneEl.classList.remove("ativo");
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || files.length === 0) return;
    enviarArquivosArrastados(files).catch((erro) => alert(erro.message));
  });
}
btnConfirmar.addEventListener("click", () => {
  if (confirmResolve) {
    confirmResolve(true);
    fecharModalConfirmar();
  }
});

btnCancelarConfirmar.addEventListener("click", () => {
  if (confirmResolve) {
    confirmResolve(false);
    fecharModalConfirmar();
  }
});

modalConfirmar.addEventListener("click", (e) => {
  if (e.target === modalConfirmar && confirmResolve) {
    confirmResolve(false);
    fecharModalConfirmar();
  }
});

btnConfirmarPrompt.addEventListener("click", () => {
  if (promptResolve) {
    promptResolve(promptValor.value.trim() || null);
    fecharModalPrompt();
  }
});

btnCancelarPrompt.addEventListener("click", () => {
  if (promptResolve) {
    promptResolve(null);
    fecharModalPrompt();
  }
});

modalPrompt.addEventListener("click", (e) => {
  if (e.target === modalPrompt && promptResolve) {
    promptResolve(null);
    fecharModalPrompt();
  }
});

promptValor.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && promptResolve) {
    promptResolve(promptValor.value.trim() || null);
    fecharModalPrompt();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!modalImagem.classList.contains("oculto")) {
    fecharModalImagem();
  } else if (!modalConfirmar.classList.contains("oculto")) {
    if (confirmResolve) confirmResolve(false);
    fecharModalConfirmar();
  } else if (!modalPrompt.classList.contains("oculto")) {
    if (promptResolve) promptResolve(null);
    fecharModalPrompt();
  }
});

const btnToggleLateral = document.getElementById("btn-toggle-lateral");
if (btnToggleLateral) {
  btnToggleLateral.addEventListener("click", () => {
    const oculto = lateralEl.classList.toggle("oculto");
    btnToggleLateral.textContent = oculto ? "☰" : "✕";
    btnToggleLateral.title = oculto ? "Mostrar painel lateral" : "Ocultar painel lateral";
    editor.refresh();
  });
}