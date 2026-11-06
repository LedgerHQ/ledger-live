import path from "node:path";

/** Absolute path of a file next to a preset entry module (`dirname` is `import.meta.dirname`). */
export function joinPresetPath(dirname: string, relative: string): string {
  return path.join(dirname, relative);
}
