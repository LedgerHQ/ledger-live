import type {
  AllureTestItemSourceLocation,
  SourceCodePluginCustomizer,
} from '@support/jest-allure2-reporter';
import { extract, parseWithComments } from 'jest-docblock';

import { autoIndent, importFrom } from '../../utils';
import { detectJS } from '../common';

import { ASTHelper } from './ASTHelper';

export interface TypescriptPluginOptions {
  enabled: boolean;
  extractDocblock: boolean;
}

function resolveOptions(value: unknown): TypescriptPluginOptions {
  if (typeof value === 'boolean') {
    return { enabled: value, extractDocblock: value };
  }

  return {
    enabled: true,
    extractDocblock: false,
    ...(value as TypescriptPluginOptions | undefined),
  };
}

export const typescript: SourceCodePluginCustomizer = async ({ globalConfig, $, value }) => {
  const options = resolveOptions(value);
  const ts = options.enabled
    ? await importFrom('typescript', globalConfig.rootDir).then(
        (resolution) => resolution.exports,
        () => null,
      )
    : null;

  function canProcess(
    location: AllureTestItemSourceLocation,
  ): location is Required<AllureTestItemSourceLocation> {
    const { fileName, lineNumber, columnNumber } = location;
    return Boolean(fileName && lineNumber && columnNumber && detectJS(fileName));
  }

  const helper = new ASTHelper(ts);
  return {
    name: 'typescript',

    extractSourceCode(location, includeComments) {
      return ts && canProcess(location)
        ? $.getFileNavigator(location.fileName).then((navigator) => {
            if (!navigator) return;
            if (!navigator.jump(location.lineNumber)) return;
            const lineNumber = location.lineNumber;
            const columnNumber = Math.min(location.columnNumber, navigator.readLine().length);

            const ast =
              helper.getAST(location.fileName) ||
              helper.parseAST(location.fileName, navigator.getContent());
            const expression = helper.findNodeInAST(ast, lineNumber, columnNumber);
            const codeStart = includeComments ? expression.getFullStart() : expression.getStart();
            const code = autoIndent(ast.text.slice(codeStart, expression.getEnd()).trim());
            navigator.jumpToPosition(codeStart);
            const [startLine] = navigator.getPosition();
            navigator.jumpToPosition(expression.getEnd());
            const [endLine] = navigator.getPosition();

            return {
              code,
              language: detectJS(location.fileName),
              fileName: location.fileName,
              startLine,
              endLine,
            };
          })
        : undefined;
    },

    extractDocblock(context) {
      return ts && options.extractDocblock && canProcess(context)
        ? $.getFileNavigator(context.fileName).then((navigator) => {
            if (!navigator) return;
            if (!navigator.jump(context.lineNumber)) return;
            const lineNumber = context.lineNumber;
            const columnNumber = Math.min(context.columnNumber, navigator.readLine().length);

            const ast =
              helper.getAST(context.fileName) ||
              helper.parseAST(context.fileName, navigator.getContent());
            const expression = helper.findNodeInAST(ast, lineNumber, columnNumber);
            const fullStart = expression.getFullStart();
            const start = expression.getStart();
            const docblock = extract(ast.text.slice(fullStart, start).trim());
            return docblock ? parseWithComments(docblock) : undefined;
          })
        : undefined;
    },
  };
};
