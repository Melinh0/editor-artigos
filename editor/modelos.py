from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MODELOS_DIR = RAIZ / "modelos"


def listar_modelos() -> list[dict]:
    modelos = []
    if not MODELOS_DIR.is_dir():
        return modelos
    for pasta in sorted(MODELOS_DIR.iterdir()):
        arquivo = pasta / "modelo.json"
        if arquivo.is_file():
            with open(arquivo, "r", encoding="utf-8") as f:
                dados = json.load(f)
            modelos.append(dados)
    return modelos


def obter_modelo(nome: str) -> dict | None:
    arquivo = MODELOS_DIR / nome / "modelo.json"
    if not arquivo.is_file():
        return None
    with open(arquivo, "r", encoding="utf-8") as f:
        return json.load(f)


def caminho_modelo(nome: str) -> Path:
    return MODELOS_DIR / nome
