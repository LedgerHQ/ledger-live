import path from 'node:path';
import fs from 'node:fs/promises';
import type { SourceMapPayload } from 'node:module';

import { log } from '../logger';

import { FileNavigator } from './index';

export class FileNavigatorCache {
  #cache = new Map<string, Promise<FileNavigator | undefined>>();
  #scannedSourcemaps = new Set<string>();

  resolve = (filePath: string): Promise<FileNavigator | undefined> => {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    if (!this.#cache.has(absolutePath)) {
      this.#cache.set(absolutePath, this.#createNavigator(absolutePath));
    }

    return this.#cache.get(absolutePath)!;
  };

  hasScannedSourcemap = (filePath: string): boolean => {
    const sourceMapPath = `${filePath}.map`;
    return this.#scannedSourcemaps.has(sourceMapPath);
  };

  scanSourcemap = async (filePath: string): Promise<void> => {
    if (this.hasScannedSourcemap(filePath)) return;

    const sourceMapPath = `${filePath}.map`;
    this.#scannedSourcemaps.add(sourceMapPath);

    const doesNotExist = await fs.access(sourceMapPath).catch(() => true);
    if (doesNotExist) return;

    const sourceMapRaw = await fs.readFile(sourceMapPath, 'utf8').catch((error) => {
      log.error(error, `Failed to read sourcemap for: ${filePath}`);
    });
    if (sourceMapRaw == null) return;

    let sourceMap: SourceMapPayload | undefined;
    try {
      sourceMap = JSON.parse(sourceMapRaw);
    } catch (error) {
      log.error(error, `Failed to parse sourcemap for: ${filePath}`);
    }
    if (!sourceMap) return;

    const { sourceRoot, sources, sourcesContent } = sourceMap;
    if (!sources || !sourcesContent) return;

    const baseDirectory =
      sourceRoot && path.isAbsolute(sourceRoot) ? sourceRoot : path.dirname(filePath);
    for (const [index, content] of sourcesContent.entries()) {
      const source = sources[index];
      if (!content || !source) continue;

      const sourcePath = path.isAbsolute(source) ? source : path.resolve(baseDirectory, source);
      if (this.#cache.has(sourcePath)) continue;

      const navigator = new FileNavigator(content);
      this.#cache.set(sourcePath, Promise.resolve(navigator));
    }
  };

  #createNavigator = async (filePath: string) => {
    const sourceCode = await fs.readFile(filePath, 'utf8').catch(() => void 0);
    return sourceCode == null ? undefined : new FileNavigator(sourceCode);
  };

  clear() {
    this.#cache.clear();
  }

  static readonly instance = new FileNavigatorCache();
}
