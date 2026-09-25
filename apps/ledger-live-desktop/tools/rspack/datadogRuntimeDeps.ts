import fs from "fs";
import path from "path";
import { createRequire } from "module";
import type { Compiler } from "@rspack/core";

const nodeRequire = createRequire(__filename);

function resolvePackageDir(pkg: string, fromDir?: string): string {
  const entry = nodeRequire.resolve(pkg, fromDir ? { paths: [fromDir] } : undefined);
  let dir = path.dirname(entry);
  while (dir !== path.dirname(dir) && !fs.existsSync(path.join(dir, "package.json"))) {
    dir = path.dirname(dir);
  }
  return dir;
}

// Copies each package into its own parent's node_modules (mirroring the real resolved tree)
// instead of a shared flat namespace, so two different versions of the same package name
// (e.g. multiple node-gyp-build majors pulled in by different native/WASM deps) don't collide.
// `ancestors` guards against a genuine dependency cycle on the current branch only, so the same
// package name at a different version elsewhere in the tree is still copied correctly.
function copyPackageTree(
  pkg: string,
  destNodeModules: string,
  ancestors: ReadonlySet<string>,
  fromDir?: string,
  optional = false,
): void {
  if (ancestors.has(pkg)) return;

  let pkgDir: string;
  try {
    pkgDir = resolvePackageDir(pkg, fromDir);
  } catch (e) {
    // Platform-specific native/WASM packages, and anything under an optional subtree (its own
    // "required" deps may legitimately be missing too, e.g. a types-only package never actually
    // required at runtime), may be absent; anything on the mandatory chain must fail the build.
    if (optional) return;
    throw new Error(`[datadog] Failed to resolve required package '${pkg}' for build output: ${e}`);
  }

  // The package genuinely exists on disk past this point, so a failure copying or reading it is
  // a real bug, not a "maybe not installed" situation — never swallowed, optional or not.
  const destDir = path.join(destNodeModules, pkg);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(path.dirname(destDir), { recursive: true });
    // Excludes the package's own node_modules: pnpm sometimes places it as a real nested
    // directory of symlinks (rather than a flat sibling), and fs.cpSync copies symlinks as-is,
    // which would produce dangling links once moved into the output tree. The recursive walk
    // below already copies each dependency correctly, so nothing is lost by excluding it here.
    const ownNodeModules = path.join(pkgDir, "node_modules");
    fs.cpSync(pkgDir, destDir, {
      recursive: true,
      filter: src => src !== ownNodeModules,
    });
  }
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
  const childNodeModules = path.join(destDir, "node_modules");
  const nextAncestors = new Set(ancestors).add(pkg);
  for (const dep of Object.keys(pkgJson.dependencies ?? {})) {
    // Inherits `optional`: a dependency of an optional package is itself best-effort, since the
    // whole subtree is only needed for a feature this integration may not even exercise.
    copyPackageTree(dep, childNodeModules, nextAncestors, pkgDir, optional);
  }
  for (const dep of Object.keys(pkgJson.optionalDependencies ?? {})) {
    copyPackageTree(dep, childNodeModules, nextAncestors, pkgDir, true);
  }
}

// Replaces DatadogWebpackPlugin's copyRuntimeDependencies, which assumes a hoisted node_modules.
export class DatadogRuntimeDepsPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.afterEmit.tap("DatadogRuntimeDepsPlugin", compilation => {
      const outputPath = compilation.outputOptions.path;
      if (!outputPath) return;
      const destModules = path.join(outputPath, "node_modules");
      copyPackageTree("@datadog/electron-sdk", destModules, new Set());
    });
  }
}
