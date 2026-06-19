import { build } from "esbuild";

// Builds the e2e command bundle. Run only for e2e (not in live-common's normal
// build), so live-common stays untouched by this concern.
//
// Bundles from TS source (the @ledgerhq/source condition), so no lib-es build is
// required. esbuild resolves at build time the things that make the published
// lib-es non-Node-runnable: extensionless imports, lodash/* deep CJS imports, and
// raw require() calls. Native .node addons can't be inlined and stay external.
await build({
  entryPoints: ["src/commands-entry.ts"],
  outfile: "lib/commands.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  conditions: ["@ledgerhq/source"],
  external: ["*.node", "@ledgerhq/zcash-utils"],
  banner: {
    js: "import{createRequire as __cr}from'module';const require=__cr(import.meta.url);",
  },
  logLevel: "info",
});
