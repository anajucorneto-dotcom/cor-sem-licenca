"""Gera versões .webp otimizadas de ./fotos em ./fotos/web (640, 1280 e 1920 px de largura).
Os originais não são alterados. Uso:  python3 scripts/gerar_webp.py   (requer: pip install pillow)"""
from pathlib import Path
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM, DESTINO = RAIZ / "fotos", RAIZ / "fotos" / "web"
LARGURAS = (640, 1280, 1920)

def tirar_tarja_preta(img):
    """Remove faixas totalmente pretas nas bordas (ex.: tarja no topo de uma foto)."""
    cinza = img.convert("L").point(lambda p: 255 if p > 18 else 0)
    caixa = cinza.getbbox()
    return img.crop(caixa) if caixa else img

DESTINO.mkdir(parents=True, exist_ok=True)
for foto in sorted(ORIGEM.iterdir()):
    if foto.suffix.lower() not in (".jpg", ".jpeg", ".png"):
        continue
    img = tirar_tarja_preta(ImageOps.exif_transpose(Image.open(foto)).convert("RGB"))
    for w in LARGURAS:
        alvo = DESTINO / f"{foto.stem}-{w}.webp"
        copia = img if img.width <= w else img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        copia.save(alvo, "WEBP", quality=80, method=6)
    print(f"{foto.name}: {img.width}x{img.height} -> ok")
