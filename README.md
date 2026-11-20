# COR SEM LICENÇA · portfólio fotográfico

Ensaio de moda em estúdio com estética anos 2000. Trabalho da disciplina de Fotografia na Web (2026).
Site estático: `index.html` + `style.css` + `script.js`, sem framework e sem build.

## Fotos
- Originais em `fotos/` · versões otimizadas em `fotos/web/` (640, 1280 e 1920 px, .webp).
- Ao adicionar ou trocar uma foto, rode `python3 scripts/gerar_webp.py` (precisa de `pip install pillow`).
- Se alguma foto sair da pasta, o site a esconde automaticamente e o contador do lightbox se ajusta sozinho.

## Rodar localmente
    python3 -m http.server 8080
e abra http://localhost:8080

## Publicar
**Netlify:** entre em app.netlify.com/drop e arraste a pasta inteira. Pronto.

**GitHub Pages:**
1. Crie um repositório público e envie todos os arquivos desta pasta.
2. Em Settings → Pages, escolha "Deploy from a branch", branch `main`, pasta `/ (root)`.
3. Em 1 ou 2 minutos o site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
