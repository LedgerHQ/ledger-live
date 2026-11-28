import type { ExpectTextOptions } from "./compareText";

/** The actions every element handle offers, native or web: same names, same wait-then-act contract. */
export interface ElementHandle {
  waitVisible(timeout?: number): Promise<void>;
  waitNotVisible(timeout?: number): Promise<void>;
  tap(timeout?: number): Promise<void>;
  replaceText(text: string, timeout?: number): Promise<void>;
  getText(timeout?: number): Promise<string>;
  isVisible(timeout?: number): Promise<boolean>;
  expectExist(): Promise<void>;
  expectNotExist(): Promise<void>;
  expectText(text: string, options?: ExpectTextOptions): Promise<void>;
}
