import path from "node:path";
import { git, readBlobs } from "./git.js";
import { join } from "./text.js";

/**
 * @import { CompilerOptions, ModuleResolutionHost, ParseConfigHost } from "typescript"
 * @import { Revision, Target } from "./types.js"
 */

/**
 * A tsconfig file's options, the files its include, exclude and files fields give, and the configs it references,
 * as repository paths.
 * @typedef {{ options: CompilerOptions, fileNames: Set<string>, references: string[] }} Config
 */

/**
 * TypeScript's matching of a config's include and exclude globs against folder entries: internal, but with this
 * signature since TypeScript 2.
 * @typedef {(
 *   path: string,
 *   extensions: readonly string[] | undefined,
 *   excludes: readonly string[] | undefined,
 *   includes: readonly string[] | undefined,
 *   useCaseSensitiveFileNames: boolean,
 *   currentDirectory: string,
 *   depth: number | undefined,
 *   getFileSystemEntries: (path: string) => { files: string[], directories: string[] },
 *   realpath: (path: string) => string,
 * ) => string[]} MatchFiles
 */

/**
 * A commit's files, read from git objects, with a TypeScript resolution host over them. Workspace
 * packages are mapped from node_modules to their folders, so resolution never reads the disk and
 * the same commit always resolves the same way.
 * @param {{ repo: string, rev: string, ts: typeof import("typescript"), stripScope: string }} options
 * @returns {Revision}
 */
export function createRevision({ repo, rev, ts, stripScope }) {
  const files = new Set(
    git(["ls-tree", "-r", "-z", "--name-only", rev], repo).split("\0").filter(Boolean),
  );
  const dirs = new Set([""]);
  for (const file of files) {
    for (
      let dir = path.posix.dirname(file);
      dir !== "." && !dirs.has(dir);
      dir = path.posix.dirname(dir)
    ) {
      dirs.add(dir);
    }
  }
  /** @type {Map<string, string | undefined>} */
  const contents = new Map();
  /** @param {string} rel */
  const read = rel => {
    if (!files.has(rel)) return undefined;
    if (!contents.has(rel)) contents.set(rel, git(["cat-file", "blob", `${rev}:${rel}`], repo));
    return contents.get(rel);
  };

  const packageDirs = workspacePackageDirs(
    workspaceGlobs(read("pnpm-workspace.yaml") ?? ""),
    dirs,
    files,
  );
  prefetch(packageDirs.map(dir => `${dir}/package.json`));
  /** @type {Map<string, string>} */
  const workspace = new Map();
  const packages = new Map([["", { dir: "", label: "workspace root" }]]);
  for (const dir of packageDirs) {
    const name = JSON.parse(/** @type {string} */ (read(`${dir}/package.json`))).name;
    const label = name?.startsWith(stripScope) ? name.slice(stripScope.length) : (name ?? dir);
    packages.set(dir, { dir, label });
    if (name && !workspace.has(name)) workspace.set(name, dir);
  }
  const scopes = new Set(
    [...workspace.keys()].filter(n => n.startsWith("@")).map(n => n.split("/")[0]),
  );
  const matchFiles = /** @type {{ matchFiles: MatchFiles }} */ (/** @type {unknown} */ (ts))
    .matchFiles;
  /** @type {Map<string, { files: string[], directories: string[] }> | undefined} */
  let entries;

  /** @type {ModuleResolutionHost & ParseConfigHost} */
  const host = {
    useCaseSensitiveFileNames: true,
    getCurrentDirectory: () => repo,
    getDirectories: () => [],
    // The files a config includes, matched as TypeScript matches them on disk.
    readDirectory: (root, extensions, excludes, includes, depth) =>
      matchFiles(root, extensions, excludes, includes, true, repo, depth, entriesOf, p => p),
    fileExists: p => {
      const rel = toRepoPath(p);
      return rel !== null && files.has(rel);
    },
    readFile: p => {
      const rel = toRepoPath(p);
      return rel === null ? undefined : read(rel);
    },
    directoryExists: p => {
      const rel = relativeToRepo(p);
      if (rel === null) return false;
      const mapped = mapNodeModules(rel);
      if (!mapped) return dirs.has(rel);
      if (mapped.kind === "node_modules") return true;
      if (mapped.kind === "scope") return scopes.has(mapped.scope);
      return mapped.kind === "workspace" && dirs.has(mapped.rel);
    },
    realpath: p => {
      const rel = toRepoPath(p);
      return rel === null ? p : absolute(rel);
    },
  };
  /** @type {Map<string | null, Config>} */
  const configs = new Map();

  return {
    workspace,
    read,
    packageOf: rel => packageInfo(nearest(path.posix.dirname(rel), dir => packages.has(dir)) ?? ""),
    packageInfo,
    importsOf: rel =>
      ts.preProcessFile(read(rel) ?? "", true, true).importedFiles.map(f => f.fileName),
    resolve: (fromRel, specifier) => {
      /** @type {Set<string>} */
      const rels = new Set();
      for (const options of optionsFor(fromRel)) {
        const { resolvedModule } = ts.resolveModuleName(
          specifier,
          absolute(fromRel),
          options,
          host,
        );
        const rel = resolvedModule ? toRepoPath(resolvedModule.resolvedFileName) : null;
        if (rel !== null) rels.add(rel);
      }
      if (rels.size > 0) return [...rels].map(rel => /** @type {Target} */ ({ kind: "file", rel }));
      // A bare specifier left unresolved names a package: an external one, or a workspace package whose
      // entry point is a build output absent from git.
      const bare = !specifier.startsWith(".") && !specifier.startsWith("/");
      return [{ kind: bare ? "package" : "unresolved" }];
    },
  };

  /** @param {string} dir */
  function packageInfo(dir) {
    return packages.get(dir) ?? { dir, label: dir };
  }

  /** @param {string[]} rels */
  function prefetch(rels) {
    const missing = rels.filter(rel => files.has(rel) && !contents.has(rel));
    readBlobs(
      repo,
      missing.map(rel => `${rev}:${rel}`),
    ).forEach((text, i) => contents.set(missing[i], text));
  }

  /** @param {string} p */
  function relativeToRepo(p) {
    // Without a trailing slash, which TypeScript adds to the folder an import of "." names.
    const normalized = path.posix.normalize(p).replace(/\/+$/, "");
    if (normalized === repo) return "";
    return normalized.startsWith(`${repo}/`) ? normalized.slice(repo.length + 1) : null;
  }

  /** @param {string} rel */
  function absolute(rel) {
    return rel ? `${repo}/${rel}` : repo;
  }

  /**
   * Repository path of a file, following workspace packages through node_modules.
   * @param {string} p
   */
  function toRepoPath(p) {
    const rel = relativeToRepo(p);
    if (rel === null) return null;
    const mapped = mapNodeModules(rel);
    if (!mapped) return rel;
    return mapped.kind === "workspace" ? mapped.rel : null;
  }

  /**
   * @param {string} rel
   * @returns {(
   *   | { kind: "node_modules" | "external" }
   *   | { kind: "scope", scope: string }
   *   | { kind: "workspace", rel: string }
   *   | null
   * )}
   */
  function mapNodeModules(rel) {
    const parts = rel.split("/");
    const at = parts.lastIndexOf("node_modules");
    if (at === -1) return null;
    const rest = parts.slice(at + 1);
    if (rest.length === 0) return { kind: "node_modules" };
    const scoped = rest[0].startsWith("@");
    if (scoped && rest.length === 1) return { kind: "scope", scope: rest[0] };
    const dir = workspace.get(scoped ? `${rest[0]}/${rest[1]}` : rest[0]);
    if (dir === undefined) return { kind: "external" };
    return { kind: "workspace", rel: [dir, ...rest.slice(scoped ? 2 : 1)].join("/") };
  }

  /**
   * Options of the configs building the file: its nearest tsconfig.json when it includes the file, otherwise
   * each config it references that does, such as the tsconfig.web.json and tsconfig.native.json of a package
   * built for both; the nearest tsconfig.json when none does.
   * @param {string} fromRel
   */
  function optionsFor(fromRel) {
    const configDir = nearest(path.posix.dirname(fromRel), dir =>
      files.has(join(dir, "tsconfig.json")),
    );
    const config = configFor(configDir === undefined ? null : join(configDir, "tsconfig.json"));
    if (config.fileNames.has(fromRel)) return [config.options];
    prefetch(config.references);
    const building = config.references
      .map(configFor)
      .filter(reference => reference.fileNames.has(fromRel));
    return (building.length > 0 ? building : [config]).map(({ options }) => options);
  }

  /** @param {string | null} configRel */
  function configFor(configRel) {
    if (!configs.has(configRel)) configs.set(configRel, parseConfig(configRel));
    return /** @type {Config} */ (configs.get(configRel));
  }

  /**
   * @param {string | null} configRel
   * @returns {Config}
   */
  function parseConfig(configRel) {
    /** @type {CompilerOptions} */
    const options = { allowJs: true, resolveJsonModule: true };
    /** @type {string[]} */
    let fileNames = [];
    /** @type {string[]} */
    let references = [];
    if (configRel !== null) {
      const { config } = ts.readConfigFile(absolute(configRel), host.readFile);
      const dir = absolute(path.posix.dirname(configRel));
      const parsed = ts.parseJsonConfigFileContent(
        config ?? {},
        host,
        dir,
        undefined,
        absolute(configRel),
      );
      Object.assign(options, parsed.options, { allowJs: true, resolveJsonModule: true });
      fileNames = parsed.fileNames;
      references = (parsed.projectReferences ?? []).map(reference =>
        ts.resolveProjectReferencePath(reference),
      );
    }
    if (options.moduleResolution === undefined) {
      options.moduleResolution = ts.ModuleResolutionKind.Bundler;
      options.module = ts.ModuleKind.ESNext;
    }
    return {
      options,
      fileNames: new Set(fileNames.flatMap(p => toRepoPath(p) ?? [])),
      references: references.flatMap(p => toRepoPath(p) ?? []).filter(rel => files.has(rel)),
    };
  }

  /**
   * Names of the files and folders in a folder of the commit, none for one outside it.
   * @param {string} p
   */
  function entriesOf(p) {
    if (!entries) {
      entries = new Map([...dirs].map(dir => [dir, { files: [], directories: [] }]));
      for (const file of files) entries.get(parentOf(file))?.files.push(path.posix.basename(file));
      for (const dir of dirs)
        if (dir) entries.get(parentOf(dir))?.directories.push(path.posix.basename(dir));
    }
    const rel = relativeToRepo(p);
    return (rel !== null && entries.get(rel)) || { files: [], directories: [] };
  }

  /**
   * Folder holding a file or folder, the repository root being "".
   * @param {string} rel
   */
  function parentOf(rel) {
    const dir = path.posix.dirname(rel);
    return dir === "." ? "" : dir;
  }

  /**
   * @param {string} startDir
   * @param {(dir: string) => boolean} matches
   */
  function nearest(startDir, matches) {
    for (let dir = startDir === "." ? "" : startDir; ; dir = path.posix.dirname(dir)) {
      if (dir === ".") dir = "";
      if (matches(dir)) return dir;
      if (dir === "") return undefined;
    }
  }
}

/**
 * Globs listed under `packages:` in a pnpm-workspace.yaml.
 * @param {string} yaml
 */
export function workspaceGlobs(yaml) {
  const globs = [];
  let inPackages = false;
  for (const line of yaml.split("\n")) {
    if (/^packages:\s*$/.test(line)) inPackages = true;
    else if (inPackages && /^\S/.test(line)) inPackages = false;
    else if (inPackages) {
      const match = line.match(/^\s+-\s+["']?([^"'#\s]+)["']?/);
      if (match) globs.push(match[1]);
    }
  }
  return globs;
}

/**
 * `*` matches inside a folder name, `**` across folders.
 * @param {string} glob
 */
export function globToRegExp(glob) {
  const pattern = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0/g, ".*");
  return new RegExp(`^${pattern}$`);
}

/**
 * Folders holding a package.json that the globs include and no `!` glob excludes, sorted.
 * @param {string[]} globs
 * @param {Set<string>} dirs
 * @param {Set<string>} files
 */
export function workspacePackageDirs(globs, dirs, files) {
  const include = globs.filter(glob => !glob.startsWith("!")).map(globToRegExp);
  const exclude = globs
    .filter(glob => glob.startsWith("!"))
    .map(glob => globToRegExp(glob.slice(1)));
  return [...dirs]
    .filter(dir => files.has(join(dir, "package.json")))
    .filter(dir => include.some(r => r.test(dir)) && !exclude.some(r => r.test(dir)))
    .sort();
}
