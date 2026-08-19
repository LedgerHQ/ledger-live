import {
  type Tree,
  formatFiles,
  names,
  generateFiles,
  writeJson,
  updateJson,
  visitNotIgnoredFiles,
} from "@nx/devkit";
import type { devtoolGeneratorSchema } from "./schema";
import { fileURLToPath } from "url";
import { basename, dirname, join } from "path";

function escapeStr(s: string | undefined, fallback = ""): string {
  return (s ?? fallback).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

const DEVTOOLS_ROOT = "devtools";
const REGISTRY_ROOT = `${DEVTOOLS_ROOT}/registry`;
const REGISTRY_PACKAGE_JSON = `${REGISTRY_ROOT}/package.json`;
const REGISTRY_SRC = `${REGISTRY_ROOT}/src`;
const REGISTRY_FILE = `${REGISTRY_SRC}/registry.ts`;
const REGISTRY_META = `${REGISTRY_SRC}/metadata`;

export type toolMeta = {
  toolName: string;
  team: string;
  hasProps: boolean;
};

type orphanTool = {
  toolName: string;
  team: string;
  filePath: string;
};

type scanResults = {
  tools: toolMeta[];
  orphans: orphanTool[];
};

export function scanRegistry(tree: Tree): scanResults {
  const listOfTools: toolMeta[] = [];
  const orphans: orphanTool[] = [];
  visitNotIgnoredFiles(tree, REGISTRY_META, filePath => {
    if (tree.isFile(filePath)) {
      const team = basename(dirname(filePath));
      const toolName = basename(filePath).split(".")[0];
      if (toolName !== "index") {
        const { fileName } = names(toolName);
        if (!tree.exists(`${DEVTOOLS_ROOT}/${fileName}`)) {
          orphans.push({ toolName: fileName, team, filePath });
          return; // Act as continue
        }

        const hasProps = tree.exists(`${DEVTOOLS_ROOT}/${fileName}/src/types.ts`);
        listOfTools.push({ toolName: fileName, team, hasProps });
      }
    }
  });
  return { tools: listOfTools, orphans };
}

export function createImportsString(tools: toolMeta[]) {
  const teams = [...new Set(tools.map(t => t.team))];
  return (
    teams
      .map(team => `import * as ${names(team).propertyName} from "./metadata/${team}";`)
      .join("\n") + (teams.length ? "\n" : "")
  );
}

export function createToolsString(tools: toolMeta[]) {
  let result = "export const tools = {\n";
  for (const tool of tools) {
    const { fileName, propertyName } = names(tool.toolName);
    const teamName = names(tool.team).propertyName;
    result += `  "${fileName}": ${teamName}.${propertyName},\n`;
  }
  result += "} as const;";
  return result;
}

function createDevtoolsConfigString(): string {
  return `/**
 * Host-supplied configuration passed to the DevTools shell.
 *
 * One entry per tool the host wants to enable, in the order they should appear.
 */
export type DevToolsConfig = Array<DevToolConfig>;`;
}

export function createDevtoolsConfigArrayString(tools: toolMeta[]): string {
  let result = `/**
 * Union of every registered tool's \`{ id, config }\` pair.
 *
 * Each member ties a tool id to the exact props that tool expects, so the
 * host gets type-checked configuration per tool.
 *
 * For propless tools, \`config\` must be \`undefined\` — e.g. \`{ id: "dummy", config: undefined }\`.
 */
export type DevToolConfig =\n`;

  if (tools.length === 0) {
    result += `  never;\n`;
    return result;
  }

  for (const tool of tools) {
    const { fileName, className } = names(tool.toolName);
    const teamName = names(tool.team).propertyName;
    const propString = tool.hasProps ? `${teamName}.${className}ToolProps` : undefined;
    result += `  | { id: "${fileName}"; config: ${propString} }\n`;
  }
  return result.trimEnd() + ";\n";
}

export function rewriteRegistry(tree: Tree) {
  let result = "";
  const { tools, orphans } = scanRegistry(tree);
  const strings: string[] = [
    createImportsString(tools),
    createToolsString(tools),
    createDevtoolsConfigString(),
    createDevtoolsConfigArrayString(tools),
  ];
  for (const s of strings) {
    result += s.trimEnd() + "\n\n";
  }
  tree.write(REGISTRY_FILE, result.trimEnd() + "\n");

  rewriteIndexRegistry(tree, tools);

  // Remove orphans files
  for (const orphan of orphans) {
    tree.delete(orphan.filePath);
    removePackageDepEntry(tree, orphan.toolName);
  }
}

function removePackageDepEntry(tree: Tree, toolName: string) {
  updateJson(tree, REGISTRY_PACKAGE_JSON, json => {
    delete json.dependencies?.[`@devtools/${toolName}`];
    return json;
  });
}

export function rewriteIndexRegistry(tree: Tree, tools: toolMeta[]) {
  for (const name of tree.children(REGISTRY_META)) {
    const indexPath = `${REGISTRY_META}/${name}/index.ts`;
    if (!tree.isFile(`${REGISTRY_META}/${name}`) && tree.exists(indexPath)) {
      tree.delete(indexPath);
    }
  }

  const teamTools = Object.groupBy(tools, tool => tool.team);

  for (const [team, tools] of Object.entries(teamTools)) {
    const content =
      tools!.map(t => `export * from "./${names(t.toolName).fileName}";`).join("\n") + "\n";
    tree.write(`${REGISTRY_META}/${team}/index.ts`, content);
  }
  const teamContent =
    Object.keys(teamTools)
      .map(team => `export * from "./${team}";`)
      .join("\n") + "\n";

  tree.write(`${REGISTRY_META}/index.ts`, teamContent);
}

// Only for reformat script, not used in this file
export async function reformatGenerator(tree: Tree) {
  rewriteRegistry(tree);
  await formatFiles(tree);
}

export default async function devtoolGenerator(tree: Tree, options: devtoolGeneratorSchema) {
  const { className, propertyName, fileName } = names(options.name);
  const projectRoot = `${DEVTOOLS_ROOT}/${fileName}`;

  const __dirname = dirname(fileURLToPath(import.meta.url));

  generateFiles(
    tree, // virtual file system
    join(__dirname, "files"), // path to templates
    projectRoot, // destination path
    { ...options, className, propertyName, fileName, tmpl: "" }, // template variables
  );

  const refs = [];
  if (options.platform !== "native") refs.push({ path: "./tsconfig.web.json" });
  if (options.platform !== "web") refs.push({ path: "./tsconfig.native.json" });

  // Tsconfig
  writeJson(tree, `${projectRoot}/tsconfig.json`, {
    extends: "../../tsconfig.base.json",
    compilerOptions: {
      lib: ["ES2022", "DOM"],
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      noEmit: true,
    },
    files: [],
    references: refs,
  });

  // Tsconfig.web
  if (options.platform !== "native") {
    writeJson(tree, `${projectRoot}/tsconfig.web.json`, {
      extends: "./tsconfig.json",
      compilerOptions: {
        moduleSuffixes: [".web", ""],
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "src/**/*.native.*"],
    });
  }

  //tsconfig.native
  if (options.platform !== "web") {
    writeJson(tree, `${projectRoot}/tsconfig.native.json`, {
      extends: "./tsconfig.json",
      compilerOptions: {
        moduleSuffixes: [".native", ""],
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "src/**/*.web.*"],
    });
  }

  const registryTeamPath = `${REGISTRY_META}/${options.owner}`;

  function appendContent(path: string, content: string) {
    const existing = tree.read(path, "utf-8") ?? "";
    tree.write(path, existing + content);
  }

  tree.write(
    `${registryTeamPath}/${fileName}.ts`,
    `import { Category, type ToolMetadata } from "../../types";
${options.hasProps ? `export type { ${className}ToolProps } from "@${projectRoot}";` : ""}

export const ${propertyName}: ToolMetadata = {
  label: "${escapeStr(options.label)}",
  category: Category.${options.category},
  owner: "${escapeStr(options.owner)}",
  desc: "${escapeStr(options.description)}",
  loader: () => import("@devtools/${fileName}"),${options.platform !== "both" ? `\n  platform: "${options.platform}",` : ""}
};
`,
  );

  // Add package deps in registry
  updateJson(tree, REGISTRY_PACKAGE_JSON, json => {
    json.dependencies ??= {};
    json.dependencies[`@devtools/${fileName}`] = "workspace:*";
    return json;
  });

  // Add types.ts if requested
  if (options.hasProps) {
    const propName = `${className}ToolProps`;
    tree.write(
      `${projectRoot}/src/types.ts`,
      `export interface ${propName} {
  readonly property: unknown;
}`,
    );
    appendContent(`${projectRoot}/src/index.ts`, `export type { ${propName} } from "./types";\n`);
  }

  // Clean up from registry old metadata files in the wrong team
  const allTeams = tree
    .children(REGISTRY_META)
    .filter(name => !tree.isFile(`${REGISTRY_META}/${name}`));

  for (const team of allTeams) {
    if (team !== options.owner) {
      const stale = `${REGISTRY_META}/${team}/${fileName}.ts`;
      if (tree.exists(stale)) tree.delete(stale);
    }
  }

  rewriteRegistry(tree);

  if (options.platform === "web") tree.delete(`${projectRoot}/src/index.native.ts`);

  await formatFiles(tree);
}
