from __future__ import annotations

import json
import mimetypes
import re
import shutil
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .compiler import (
    ARQUIVO_ARTIGO,
    ARTIGOS_DIR,
    BUILD_DIR,
    compilar,
    extrair_titulo,
    pdflatex_disponivel,
    sincronizar_fonte,
    sincronizar_pdf,
    synctex_disponivel,
)
from .modelos import caminho_modelo, listar_modelos, obter_modelo

STATIC_DIR = Path(__file__).resolve().parent / "static"
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
EVENTO_ANO_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")

app = FastAPI(title="Editor de Artigos", version="0.1.0")


class ArtigoNovo(BaseModel):
    modelo: str = Field(min_length=1, max_length=80)
    slug: str = Field(min_length=3, max_length=80)
    titulo: str = Field(default="Novo artigo", max_length=300)


class ArtigoConteudo(BaseModel):
    conteudo: str = Field(min_length=1)


def _validar_slug(slug: str) -> str:
    if not SLUG_RE.fullmatch(slug):
        raise HTTPException(status_code=400, detail="Slug invalido.")
    return slug


def _validar_evento_ano(evento: str, ano: str) -> tuple[str, str]:
    if not EVENTO_ANO_RE.fullmatch(evento):
        raise HTTPException(status_code=400, detail="Evento invalido.")
    if not ano.isdigit() or len(ano) != 4:
        raise HTTPException(status_code=400, detail="Ano invalido.")
    return evento, ano


def _caminho_artigo(evento: str, ano: str, slug: str) -> Path:
    return ARTIGOS_DIR / f"{evento}-{ano}" / slug / ARQUIVO_ARTIGO


def _ler_texto(caminho: Path) -> str:
    with open(caminho, "r", encoding="utf-8", newline="") as arquivo:
        return arquivo.read()


def _escrever_texto(caminho: Path, conteudo: str) -> None:
    with open(caminho, "w", encoding="utf-8", newline="") as arquivo:
        arquivo.write(conteudo)


def _ler_meta(evento: str, ano: str, slug: str) -> dict:
    caminho = ARTIGOS_DIR / f"{evento}-{ano}" / slug / "artigo.meta.json"
    if not caminho.is_file():
        raise HTTPException(status_code=404, detail="Metadados nao encontrados.")
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def _caminho_pasta_artigo(evento: str, ano: str, slug: str) -> Path:
    return ARTIGOS_DIR / f"{evento}-{ano}" / slug


ARQUIVOS_PROTEGIDOS = {"artigo.tex", "artigo.meta.json"}


def _resolver_caminho_seguro(
    evento: str, ano: str, slug: str, caminho_relativo: str
) -> Path:
    pasta = _caminho_pasta_artigo(evento, ano, slug)
    if not pasta.is_dir():
        raise HTTPException(status_code=404, detail="Pasta do artigo nao encontrada.")
    alvo = (pasta / caminho_relativo).resolve()
    try:
        alvo.relative_to(pasta.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Caminho invalido.")
    return alvo


def _listar_arquivos(pasta: Path, prefixo: str = "") -> list[dict]:
    itens: list[dict] = []
    for entrada in sorted(pasta.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
        rel = f"{prefixo}{entrada.name}"
        try:
            stat = entrada.stat()
        except OSError:
            continue
        if entrada.is_dir():
            itens.append(
                {
                    "nome": rel,
                    "caminho": rel,
                    "tipo": "pasta",
                    "tamanho": 0,
                    "modificado": int(stat.st_mtime),
                }
            )
        else:
            itens.append(
                {
                    "nome": rel,
                    "caminho": rel,
                    "tipo": "arquivo",
                    "tamanho": stat.st_size,
                    "modificado": int(stat.st_mtime),
                }
            )
    return itens


def _ler_artigo(evento: str, ano: str, slug: str) -> str:
    caminho = _caminho_artigo(evento, ano, slug)
    if not caminho.is_file():
        raise HTTPException(status_code=404, detail="Artigo nao encontrado.")
    return _ler_texto(caminho)


@app.get("/", response_class=HTMLResponse)
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/status")
def status() -> dict:
    quantidade = 0
    if ARTIGOS_DIR.is_dir():
        for pasta_evento in ARTIGOS_DIR.iterdir():
            if not pasta_evento.is_dir():
                continue
            for pasta_artigo in pasta_evento.iterdir():
                if pasta_artigo.is_dir() and (pasta_artigo / ARQUIVO_ARTIGO).is_file():
                    quantidade += 1
    return {
        "pdflatex": pdflatex_disponivel(),
        "synctex": synctex_disponivel(),
        "artigos": quantidade,
    }


@app.get("/api/modelos")
def listar_modelos_api() -> list[dict]:
    return listar_modelos()


@app.get("/api/modelos/{nome}")
def obter_modelo_api(nome: str) -> dict:
    dados = obter_modelo(nome)
    if dados is None:
        raise HTTPException(status_code=404, detail="Modelo nao encontrado.")
    return dados


@app.get("/api/artigos")
def listar_artigos() -> list[dict]:
    artigos = []
    if not ARTIGOS_DIR.is_dir():
        return artigos
    for pasta_evento in sorted(ARTIGOS_DIR.iterdir()):
        if not pasta_evento.is_dir():
            continue
        nome_evento = pasta_evento.name
        if "-" not in nome_evento:
            continue
        evento, _, ano = nome_evento.rpartition("-")
        for pasta in sorted(pasta_evento.iterdir()):
            arquivo = pasta / ARQUIVO_ARTIGO
            if not arquivo.is_file():
                continue
            conteudo = _ler_texto(arquivo)
            meta = {}
            meta_caminho = pasta / "artigo.meta.json"
            if meta_caminho.is_file():
                with open(meta_caminho, "r", encoding="utf-8") as f:
                    meta = json.load(f)
            artigos.append(
                {
                    "evento": evento,
                    "ano": ano,
                    "slug": pasta.name,
                    "titulo": meta.get("titulo") or extrair_titulo(conteudo) or pasta.name,
                    "modelo": meta.get("modelo", ""),
                    "atualizado": int(arquivo.stat().st_mtime),
                }
            )
    return artigos


@app.get("/api/artigos/{evento}/{ano}/{slug}")
def obter_artigo(evento: str, ano: str, slug: str) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    conteudo = _ler_artigo(evento, ano, slug)
    meta = _ler_meta(evento, ano, slug)
    return {
        "evento": evento,
        "ano": ano,
        "slug": slug,
        "titulo": meta.get("titulo") or extrair_titulo(conteudo),
        "modelo": meta.get("modelo", ""),
        "conteudo": conteudo,
    }


@app.delete("/api/artigos/{evento}/{ano}/{slug}")
def deletar_artigo(evento: str, ano: str, slug: str) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    pasta = _caminho_pasta_artigo(evento, ano, slug)
    if not pasta.is_dir():
        raise HTTPException(status_code=404, detail="Pasta do artigo nao encontrada.")
    shutil.rmtree(str(pasta))
    return {"ok": True, "evento": evento, "ano": ano, "slug": slug}


@app.get("/api/artigos/{evento}/{ano}/{slug}/files")
def listar_arquivos(evento: str, ano: str, slug: str) -> list[dict]:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    pasta = _caminho_pasta_artigo(evento, ano, slug)
    if not pasta.is_dir():
        raise HTTPException(status_code=404, detail="Pasta do artigo nao encontrada.")
    return _listar_arquivos(pasta)


@app.get("/api/artigos/{evento}/{ano}/{slug}/files/{caminho:path}")
def baixar_ou_listar(evento: str, ano: str, slug: str, caminho: str):
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    alvo = _resolver_caminho_seguro(evento, ano, slug, caminho)
    if not alvo.exists():
        raise HTTPException(status_code=404, detail="Arquivo ou pasta nao encontrado.")
    if alvo.is_dir():
        return _listar_arquivos(alvo, prefixo=f"{caminho.rstrip('/')}/")
    return FileResponse(
        alvo,
        filename=alvo.name,
        media_type=mimetypes.guess_type(str(alvo))[0] or "application/octet-stream",
    )


async def _salvar_upload(
    evento: str, ano: str, slug: str, caminho: str, arquivo: UploadFile
) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    alvo = _resolver_caminho_seguro(evento, ano, slug, caminho)
    if not caminho or alvo.is_dir():
        nome = Path(arquivo.filename or "").name
        if not nome:
            raise HTTPException(status_code=400, detail="Nome de arquivo invalido.")
        alvo = alvo / nome
    if alvo.name in ARQUIVOS_PROTEGIDOS and alvo.parent == _caminho_pasta_artigo(
        evento, ano, slug
    ).resolve():
        raise HTTPException(
            status_code=403, detail="Arquivo protegido nao pode ser sobrescrito via upload."
        )
    alvo.parent.mkdir(parents=True, exist_ok=True)
    conteudo = await arquivo.read()
    if alvo.suffix.lower() in {".tex", ".bib", ".json", ".txt", ".md", ".cls", ".bst", ".sty"}:
        try:
            texto = conteudo.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400, detail="Arquivo nao e UTF-8 valido."
            )
        with open(alvo, "w", encoding="utf-8", newline="") as f:
            f.write(texto)
    else:
        with open(alvo, "wb") as f:
            f.write(conteudo)
    raiz = _caminho_pasta_artigo(evento, ano, slug).resolve()
    return {"ok": True, "caminho": str(alvo.relative_to(raiz))}


@app.put("/api/artigos/{evento}/{ano}/{slug}/files")
async def upload_arquivo_raiz(
    evento: str, ano: str, slug: str, arquivo: UploadFile = File(...)
) -> dict:
    return await _salvar_upload(evento, ano, slug, "", arquivo)


@app.put("/api/artigos/{evento}/{ano}/{slug}/files/{caminho:path}")
async def upload_arquivo(
    evento: str, ano: str, slug: str, caminho: str, arquivo: UploadFile = File(...)
) -> dict:
    return await _salvar_upload(evento, ano, slug, caminho, arquivo)


@app.post("/api/artigos/{evento}/{ano}/{slug}/files")
def criar_pasta_arquivo(
    evento: str, ano: str, slug: str, dados: dict
) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    nome = dados.get("nome", "").strip()
    if not nome or "/" in nome or "\\" in nome or nome in {".", ".."}:
        raise HTTPException(status_code=400, detail="Nome de pasta invalido.")
    pasta = _caminho_pasta_artigo(evento, ano, slug)
    alvo = pasta / nome
    if alvo.exists():
        raise HTTPException(status_code=409, detail="Pasta ja existe.")
    alvo.mkdir(parents=True, exist_ok=True)
    return {"ok": True, "caminho": nome}


@app.delete("/api/artigos/{evento}/{ano}/{slug}/files/{caminho:path}")
def deletar_arquivo(evento: str, ano: str, slug: str, caminho: str) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    alvo = _resolver_caminho_seguro(evento, ano, slug, caminho)
    if not alvo.exists():
        raise HTTPException(status_code=404, detail="Arquivo ou pasta nao encontrado.")
    if alvo.name in ARQUIVOS_PROTEGIDOS and alvo.parent == _caminho_pasta_artigo(
        evento, ano, slug
    ).resolve():
        raise HTTPException(status_code=403, detail="Arquivo protegido nao pode ser deletado.")
    if alvo.is_dir():
        if any(alvo.iterdir()):
            raise HTTPException(
                status_code=400, detail="Pasta nao esta vazia."
            )
        alvo.rmdir()
    else:
        alvo.unlink()
    return {"ok": True}


class MoverArquivo(BaseModel):
    origem: str
    destino: str


@app.post("/api/artigos/{evento}/{ano}/{slug}/files/move")
def mover_arquivo(
    evento: str, ano: str, slug: str, dados: MoverArquivo
) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    pasta = _caminho_pasta_artigo(evento, ano, slug)
    origem = _resolver_caminho_seguro(evento, ano, slug, dados.origem)
    destino = _resolver_caminho_seguro(evento, ano, slug, dados.destino)
    if not origem.exists():
        raise HTTPException(status_code=404, detail="Origem nao encontrada.")
    if origem.name in ARQUIVOS_PROTEGIDOS and origem.parent == pasta.resolve():
        raise HTTPException(status_code=403, detail="Arquivo protegido nao pode ser movido.")
    if destino.exists():
        raise HTTPException(status_code=409, detail="Destino ja existe.")
    destino.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(origem), str(destino))
    return {"ok": True, "origem": dados.origem, "destino": dados.destino}


@app.put("/api/artigos/{evento}/{ano}/{slug}")
def salvar_artigo(evento: str, ano: str, slug: str, artigo: ArtigoConteudo) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    caminho = _caminho_artigo(evento, ano, slug)
    if not caminho.is_file():
        raise HTTPException(status_code=404, detail="Artigo nao encontrado.")
    caminho.parent.mkdir(parents=True, exist_ok=True)
    _escrever_texto(caminho, artigo.conteudo)
    meta_caminho = caminho.parent / "artigo.meta.json"
    if meta_caminho.is_file():
        with open(meta_caminho, "r", encoding="utf-8") as f:
            meta = json.load(f)
        meta["atualizado_em"] = time.strftime("%Y-%m-%d")
        with open(meta_caminho, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    return {"ok": True, "salvo_em": int(time.time())}


@app.post("/api/artigos", status_code=201)
def criar_artigo(artigo: ArtigoNovo) -> dict:
    modelo = artigo.modelo.strip()
    slug = artigo.slug.strip().lower()
    titulo = artigo.titulo.strip() or "Novo artigo"
    _validar_slug(slug)

    dados_modelo = obter_modelo(modelo)
    if dados_modelo is None:
        raise HTTPException(status_code=404, detail="Modelo nao encontrado.")

    evento = dados_modelo["nome"].rsplit("-", 1)[0]
    ano = dados_modelo["nome"].rsplit("-", 1)[1]

    destino = _caminho_artigo(evento, ano, slug)
    if destino.exists():
        raise HTTPException(status_code=409, detail="Ja existe um artigo com esse slug.")

    modelo_caminho = caminho_modelo(modelo)
    arquivo_modelo = modelo_caminho / dados_modelo["arquivo_fonte"]
    if not arquivo_modelo.is_file():
        raise HTTPException(status_code=404, detail="Arquivo do modelo nao encontrado.")

    with open(arquivo_modelo, "r", encoding="utf-8") as f:
        conteudo_modelo = f.read()

    conteudo = conteudo_modelo.replace("{TITULO}", titulo).replace(
        "{AUTORES}", "Nome do autor \\\\ Universidade"
    )

    destino.parent.mkdir(parents=True, exist_ok=True)
    _escrever_texto(destino, conteudo)

    meta = {
        "modelo": modelo,
        "titulo": titulo,
        "atualizado_em": time.strftime("%Y-%m-%d"),
    }
    meta_caminho = destino.parent / "artigo.meta.json"
    with open(meta_caminho, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return {"ok": True, "evento": evento, "ano": ano, "slug": slug, "titulo": titulo}


@app.post("/api/artigos/{evento}/{ano}/{slug}/compilar")
def compilar_artigo(evento: str, ano: str, slug: str) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    resultado = compilar(evento, ano, slug)
    resposta = {
        "ok": resultado.ok,
        "mensagem": resultado.mensagem,
        "erros": resultado.erros,
        "log": resultado.log,
        "pdf": None,
    }
    if resultado.ok and resultado.pdf is not None:
        versao = int(resultado.pdf.stat().st_mtime)
        resposta["pdf"] = f"/api/artigos/{evento}/{ano}/{slug}/pdf?v={versao}"
    return resposta


@app.get("/api/artigos/{evento}/{ano}/{slug}/synctex/ida")
def synctex_ida(evento: str, ano: str, slug: str, linha: int, coluna: int = 1) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    return sincronizar_fonte(evento, ano, slug, linha, coluna)


@app.get("/api/artigos/{evento}/{ano}/{slug}/synctex/volta")
def synctex_volta(evento: str, ano: str, slug: str, pagina: int, x: float, y: float) -> dict:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    return sincronizar_pdf(evento, ano, slug, pagina, x, y)


@app.get("/api/artigos/{evento}/{ano}/{slug}/pdf")
def servir_pdf(evento: str, ano: str, slug: str, download: bool = False) -> FileResponse:
    _validar_evento_ano(evento, ano)
    _validar_slug(slug)
    pdf = BUILD_DIR / f"{evento}-{ano}" / slug / "artigo.pdf"
    if not pdf.is_file():
        raise HTTPException(status_code=404, detail="PDF ainda nao foi compilado.")
    return FileResponse(
        pdf,
        media_type="application/pdf",
        filename=f"{slug}.pdf",
        content_disposition_type="attachment" if download else "inline",
    )


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
