import type { SourceCodePluginCustomizer } from '@support/jest-allure2-reporter';
import { extract, parseWithComments } from 'jest-docblock';

import { detectJS } from '../common';
import { AllureRuntimeError } from '../../errors';

import { extractDocblockAbove } from './extractDocblockAbove';

export interface JavaScriptSourceCodePluginOptions {
  docblockPosition?: 'inside' | 'outside';
}

export const javascript: SourceCodePluginCustomizer = ({ $, value = {} }) => {
  const options = value as JavaScriptSourceCodePluginOptions;
  const extractDocblockFromLine =
    options.docblockPosition === 'inside' ? notImplemented : extractDocblockAbove;

  return {
    name: 'javascript',

    extractDocblock: ({ fileName, lineNumber }) => {
      if (fileName && detectJS(fileName)) {
        return $.getFileNavigator(fileName).then((navigator) => {
          if (!navigator) return;

          let docblock = lineNumber
            ? extractDocblockFromLine(navigator, lineNumber)
            : extract(navigator.getContent());
          docblock = docblock.trim();

          return docblock ? parseWithComments(docblock) : undefined;
        });
      }

      return;
    },
  };
};

function notImplemented(): string {
  throw new AllureRuntimeError(
    'Extracting docblock inside JavaScript source code is not implemented yet',
  );
}
