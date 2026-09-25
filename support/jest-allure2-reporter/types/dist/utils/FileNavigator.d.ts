import type { FileNavigator as IFileNavigator } from '@support/jest-allure2-reporter';
export declare class FileNavigator implements IFileNavigator {
    #private;
    constructor(content: string);
    getContent(): string;
    getPosition(): [number, number, number];
    getLines(): string[];
    getLineCount(): number;
    getCurrentLine(): number;
    moveUp(count?: number): boolean;
    moveDown(count?: number): boolean;
    jump(lineIndex: number): boolean;
    jumpToPosition(position: number): boolean;
    readLine(lineNumber?: number): string;
}
