import type { FileNavigator } from '@support/jest-allure2-reporter';

export function extractDocblockAbove(navigator: FileNavigator, testLineIndex: number): string {
  if (!navigator.jump(testLineIndex)) return '';
  if (!navigator.moveUp()) return '';

  let currentLine = navigator.readLine();
  const docblockEndIndex = getCommentEnd(currentLine);
  if (docblockEndIndex === -1) return '';

  if (isSingleLineDocblock(currentLine, docblockEndIndex)) {
    return currentLine;
  }

  const buffer: string[] = [];
  buffer.unshift(currentLine.slice(0, Math.max(0, docblockEndIndex + 2)));

  while (navigator.moveUp()) {
    currentLine = navigator.readLine();
    buffer.unshift(currentLine);

    const start = getCommentStart(currentLine);
    if (isDocblockStart(currentLine, start)) {
      return buffer.join('\n');
    }

    if (start >= 0) {
      break;
    }
  }

  return '';
}

function isSingleLineDocblock(line: string, end: number): boolean {
  const start = getCommentStart(line);
  if (start < 0) return false;

  return start < end;
}

function getCommentStart(line: string): number {
  const start = line.indexOf('/*');
  if (start <= 0) return start;

  const whitespace = line.slice(0, start);
  return whitespace.trim() ? -1 : start;
}

function getCommentEnd(line: string): number {
  return line.lastIndexOf('*/');
}

function isDocblockStart(line: string, commentIndex: number): boolean {
  return commentIndex >= 0 && line[commentIndex + 2] === '*';
}
