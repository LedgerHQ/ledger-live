import type { KeyedHelperCustomizer } from '@support/jest-allure2-reporter';
import importFrom from 'import-from';

import { ManifestResolver } from './ManifestResolver';

export const manifest: KeyedHelperCustomizer<'manifest'> = ({ globalConfig }) => {
  const cwd = globalConfig.rootDir;
  const resolver = new ManifestResolver(
    cwd,
    (modulePath) => importFrom(cwd, modulePath) as Record<string, any>,
  );

  return resolver.extract;
};
