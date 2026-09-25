import type { FileNavigator as IFileNavigator } from '@support/jest-allure2-reporter';

export class FileNavigator implements IFileNavigator {
  readonly #content: string;
  #cursor = 0;
  #line = 1;
  #lines: string[] | null = null;
  #countOfLines = Number.NaN;

  constructor(content: string) {
    this.#content = content;
  }

  getContent(): string {
    return this.#content;
  }

  getPosition(): [number, number, number] {
    return [this.#line, 1, this.#cursor];
  }

  getLines(): string[] {
    if (this.#lines === null) {
      this.#lines = this.#content.split('\n');
    }

    return this.#lines;
  }

  getLineCount(): number {
    if (Number.isNaN(this.#countOfLines)) {
      if (this.#lines === null) {
        let count = 1;
        let index = 0;
        while ((index = this.#content.indexOf('\n', index)) !== -1) {
          count++;
          index++;
        }

        this.#countOfLines = count;
      } else {
        this.#countOfLines = this.#lines.length;
      }
    }

    return this.#countOfLines;
  }

  getCurrentLine(): number {
    return this.#line;
  }

  moveUp(count = 1): boolean {
    for (let index = 0; index < count; index++) {
      if (!this.#prev()) return false;
    }

    return true;
  }

  moveDown(count = 1): boolean {
    for (let index = 0; index < count; index++) {
      if (!this.#next()) return false;
    }

    return true;
  }

  jump(lineIndex: number): boolean {
    while (this.#line > lineIndex) {
      if (!this.#prev()) return false;
    }

    while (this.#line < lineIndex) {
      if (!this.#next()) return false;
    }

    return true;
  }

  jumpToPosition(position: number): boolean {
    while (this.#cursor < position) {
      if (!this.#next()) break;
    }

    while (this.#cursor > position) {
      if (!this.#prev()) break;
    }

    return position >= 0 && position < this.#content.length && this.#cursor <= position;
  }

  readLine(lineNumber = this.#line): string {
    if (!this.jump(lineNumber)) return '';

    const nextIndex = this.#content.indexOf('\n', this.#cursor);
    if (nextIndex === -1) {
      return this.#content.slice(this.#cursor);
    }

    return this.#content.slice(this.#cursor, nextIndex);
  }

  #next(): boolean {
    const next = this.#content.indexOf('\n', this.#cursor);
    if (next === -1) {
      return false;
    }

    this.#cursor = next + 1;
    this.#line++;

    return true;
  }

  #prev(): boolean {
    if (this.#cursor === 0) return false;

    this.#cursor = this.#content.lastIndexOf('\n', this.#cursor - 2) + 1;
    this.#line--;
    return true;
  }
}
