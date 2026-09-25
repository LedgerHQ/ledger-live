// eslint-disable-next-line node/no-unpublished-import
import type TypeScript from 'typescript';

export class ASTHelper {
  #sourceFiles = new Map<string, TypeScript.SourceFile>();
  #nodes = new Map<string, TypeScript.Node>();
  #ts: typeof TypeScript;

  constructor(ts: typeof TypeScript) {
    this.#ts = ts;
  }

  findNodeInAST(
    ast: TypeScript.SourceFile,
    lineNumber: number,
    columnNumber: number,
  ): TypeScript.Node {
    const id = `${ast.fileName}:${lineNumber}:${columnNumber}`;

    if (!this.#nodes.has(id)) {
      const ts = this.#ts;
      const pos = ast.getPositionOfLineAndCharacter(lineNumber - 1, columnNumber - 1);

      // TODO: find a non-private API for `getTouchingToken`
      const token = (ts as any).getTouchingToken(ast, pos) as TypeScript.Node;

      let node = token;
      while (node.kind !== ts.SyntaxKind.CallExpression) {
        node = node.parent;
      }

      this.#nodes.set(id, node);
      return node;
    }

    return this.#nodes.get(id)!;
  }

  getAST(fileName: string): TypeScript.SourceFile | undefined {
    return this.#sourceFiles.get(fileName);
  }

  parseAST(fileName: string, content: string): TypeScript.SourceFile {
    const ts = this.#ts;
    const ast = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
    this.#sourceFiles.set(ast.fileName, ast);
    return ast;
  }
}
