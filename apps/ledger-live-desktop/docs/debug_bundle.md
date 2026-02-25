# Debugging the JavaScript bundle

Analyze the renderer bundle to identify large dependencies, duplicates, or optimization opportunities.

## Full mode (for detailed analysis)

Generates complete metafiles with all module information, sourcemaps, and reasons. Use this for detailed analysis with tools like [statoscope.tech](https://statoscope.tech/):

```bash
GENERATE_METAFILES=1 pnpm desktop build:js
```

Then drop `metafile.renderer.json` into [statoscope.tech](https://statoscope.tech/)

## Lite mode (for CI/CD)

Generates minimized metafiles with only essential data (bundle size and duplicate detection). Use this in CI/CD to reduce artifact size:

```bash
GENERATE_METAFILES="lite" pnpm desktop build:js
```
