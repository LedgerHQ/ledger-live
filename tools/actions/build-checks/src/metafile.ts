/**
 * Metafile parsing utilities for both esbuild and rspack formats
 * Isolated for easier testing
 */

// esbuild metafile format
export interface EsbuildFileImport {
  path: string;
  kind: string;
  original?: string;
  external?: boolean;
}

export interface EsbuildFileBytes {
  bytes: number;
  imports: EsbuildFileImport[];
  format?: string;
}

export interface EsbuildOutputFile {
  imports: EsbuildFileImport[];
  exports: string[];
  inputs: { [key: string]: { bytesInOutput: number } };
  bytes: number;
  entryPoint?: string;
}

export interface EsbuildMetafile {
  inputs: { [key: string]: EsbuildFileBytes };
  outputs: { [key: string]: EsbuildOutputFile };
}

// rspack/webpack metafile format
export interface RspackAsset {
  name: string;
  size: number;
}

export interface RspackModuleReason {
  userRequest?: string;
  resolvedModule?: string;
}

export interface RspackModule {
  name?: string;
  identifier?: string;
  size?: number;
  reasons?: RspackModuleReason[];
}

export interface RspackMetafile {
  assets: RspackAsset[];
  modules?: RspackModule[];
  chunks?: unknown[];
}

// Union type for both formats
export type Metafile = EsbuildMetafile | RspackMetafile;

/**
 * Type guard to check if metafile is rspack format
 */
export function isRspackMetafile(metafile: Metafile): metafile is RspackMetafile {
  return "assets" in metafile && Array.isArray(metafile.assets);
}

/**
 * Type guard to check if metafile is esbuild format
 */
export function isEsbuildMetafile(metafile: Metafile): metafile is EsbuildMetafile {
  return "outputs" in metafile && typeof metafile.outputs === "object";
}

/**
 * Extract bundle size from a metafile for a given slug (e.g., "renderer", "main")
 */
export function extractBundleSize(metafile: Metafile, slug: string): number | undefined {
  // rspack/webpack format: { assets: [{ name, size }] }
  if (isRspackMetafile(metafile)) {
    // Find the main bundle (e.g., "renderer.bundle.js")
    const mainAsset = metafile.assets.find(a => a.name === `${slug}.bundle.js`);
    return mainAsset?.size;
  }

  // esbuild format: { outputs: { ".webpack/renderer.bundle.js": { bytes } } }
  if (isEsbuildMetafile(metafile)) {
    return metafile.outputs[`.webpack/${slug}.bundle.js`]?.bytes;
  }

  return undefined;
}

/**
 * Extract duplicate packages from a metafile (supports both esbuild and rspack)
 */
export function extractDuplicates(metafile: Metafile): string[] {
  if (isRspackMetafile(metafile)) {
    return extractDuplicatesFromRspack(metafile);
  }

  if (isEsbuildMetafile(metafile)) {
    return extractDuplicatesFromEsbuild(metafile);
  }

  return [];
}

/**
 * Extract duplicates from rspack metafile by analyzing module paths
 * Looks for packages with multiple versions in node_modules/.pnpm/
 * This matches the pnpm structure where each version has its own folder
 */
function extractDuplicatesFromRspack(metafile: RspackMetafile): string[] {
  const modules = metafile.modules;
  if (!modules || !Array.isArray(modules)) {
    return [];
  }

  // Regex to extract package name and version from pnpm paths
  // Handles both scoped and non-scoped packages:
  // - "node_modules/.pnpm/lodash@4.17.21/..." -> lodash@4.17.21
  // - "node_modules/.pnpm/@noble+hashes@1.3.0/..." -> @noble/hashes@1.3.0
  const pnpmRegex = /node_modules\/\.pnpm\/(@?[^@/]+(?:\+[^@/]+)?)@([^_/]+)/;

  const packageVersions: Record<string, Set<string>> = {};

  for (const mod of modules) {
    // Use identifier (absolute path) or name (relative path)
    const modulePath = mod.identifier || mod.name;
    if (!modulePath || typeof modulePath !== "string") continue;

    const match = modulePath.match(pnpmRegex);
    if (match) {
      // Convert pnpm scoped package format: @noble+hashes -> @noble/hashes
      const pkg = match[1].replace("+", "/");
      const version = match[2];

      if (!packageVersions[pkg]) {
        packageVersions[pkg] = new Set();
      }
      packageVersions[pkg].add(version);
    }
  }

  // Return packages with more than one version
  const duplicates: string[] = [];
  for (const pkg in packageVersions) {
    if (packageVersions[pkg].size > 1) {
      duplicates.push(pkg);
    }
  }

  return duplicates.sort();
}

/**
 * Extract duplicates from esbuild metafile by analyzing import resolution
 */
function extractDuplicatesFromEsbuild(metafile: EsbuildMetafile): string[] {
  const all: string[] = [];
  const inputs = metafile.inputs;
  const resolvedPaths: Record<string, string[]> = {};

  for (const i in inputs) {
    const input = inputs[i];
    for (const record of input.imports) {
      if (record.original && record.original[0] !== ".") {
        const array = resolvedPaths[record.original] || (resolvedPaths[record.original] = []);
        if (!array.includes(record.path)) array.push(record.path);
      }
    }
  }

  for (const original in resolvedPaths) {
    const array = resolvedPaths[original];
    if (array.length > 1) {
      all.push(original);
    }
  }

  return all.sort();
}

/**
 * Get the format of a metafile
 */
export function getMetafileFormat(metafile: Metafile): "rspack" | "esbuild" | "unknown" {
  if (isRspackMetafile(metafile)) return "rspack";
  if (isEsbuildMetafile(metafile)) return "esbuild";
  return "unknown";
}

