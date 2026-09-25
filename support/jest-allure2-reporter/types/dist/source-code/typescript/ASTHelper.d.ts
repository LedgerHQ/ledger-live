import type TypeScript from 'typescript';
export declare class ASTHelper {
    #private;
    constructor(ts: typeof TypeScript);
    findNodeInAST(ast: TypeScript.SourceFile, lineNumber: number, columnNumber: number): TypeScript.Node;
    getAST(fileName: string): TypeScript.SourceFile | undefined;
    parseAST(fileName: string, content: string): TypeScript.SourceFile;
}
