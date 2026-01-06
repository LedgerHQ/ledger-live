# Debugging the JavaScript bundle

Analyze the renderer bundle to identify large dependencies, duplicates, or optimization opportunities.

```bash
GENERATE_METAFILES=1 pnpm desktop build:js
```

Then drop `metafile.renderer.json` into [statoscope.tech](https://statoscope.tech/)
