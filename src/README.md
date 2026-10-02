Scenery, styles and Clawd's animations come from the Claude Fables plugin (Luxx1993/Claude-Fables-Plugin, MIT-licensed 3D model by ChetasLua, Monocraft font OFL).
Regenerate assets: copy the plugin, apply `fables-svg.patch` to `hooks/svg.ts`, copy `r1assets.ts` to `scripts/`, run `bun scripts/r1assets.ts <outdir>`, then `render.py` (paths inside) to rasterise, then `python3 src/build.py`.
