import path from 'node:path';

import type { KeyedHelperCustomizer } from '@support/jest-allure2-reporter';

import { FileNavigatorCache } from '../../../utils';

export const getFileNavigator: KeyedHelperCustomizer<'getFileNavigator'> = () => {
  const cache = FileNavigatorCache.instance;

  return (maybeSegmentedFilePath) => {
    const filePath = Array.isArray(maybeSegmentedFilePath)
      ? maybeSegmentedFilePath.join(path.sep)
      : maybeSegmentedFilePath;

    return cache.resolve(filePath);
  };
};
