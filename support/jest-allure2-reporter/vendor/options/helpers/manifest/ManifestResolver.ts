/* eslint-disable @typescript-eslint/no-explicit-any */
import pkgUp from 'pkg-up';
import type { ManifestHelper, ManifestHelperExtractor } from '@support/jest-allure2-reporter';

import { get } from '../../../utils';
import { log } from '../../../logger';

export type ImportModuleFunction = (
  path: string,
) => Record<string, any> | Promise<Record<string, any>>;

export class ManifestResolver {
  private readonly cwd: string;
  private readonly importFn: ImportModuleFunction;

  constructor(cwd: string, importFunction: ImportModuleFunction) {
    this.cwd = cwd;
    this.importFn = importFunction;
  }

  public extract: ManifestHelper = async (
    maybePackageName: unknown,
    maybeExtractor?: unknown,
    maybeDefaultValue?: unknown,
  ): Promise<any> => {
    let packageName: string | undefined;
    let extractor: ManifestHelperExtractor<unknown> | string[] | string | undefined;
    let defaultValue: unknown;

    if (typeof maybePackageName === 'function' || Array.isArray(maybePackageName)) {
      packageName = undefined;
      extractor = maybePackageName as ManifestHelperExtractor<unknown> | string[];
      defaultValue = maybeExtractor;
    } else {
      packageName = maybePackageName as string;
      extractor = maybeExtractor as typeof extractor;
      defaultValue = maybeDefaultValue;
    }

    const manifestPath = await this.resolveManifestPath(packageName);
    if (!manifestPath) {
      return defaultValue;
    }

    try {
      const manifest = await this.importFn(manifestPath);

      if (typeof extractor === 'function') {
        return extractor(manifest as any) ?? defaultValue;
      }

      if (typeof extractor === 'string' || Array.isArray(extractor)) {
        return get(manifest, extractor, defaultValue);
      }

      return manifest;
    } catch {
      return defaultValue;
    }
  };

  private async resolveManifestPath(packageName?: string) {
    return packageName ? this.resolveCJS(packageName) : await pkgUp({ cwd: this.cwd });
  }

  private resolveCJS(packageName: string) {
    try {
      return require.resolve(packageName + '/package.json');
    } catch (error: unknown) {
      log.trace(error, `Failed to resolve package.json for "${packageName}"`);
      return;
    }
  }
}
