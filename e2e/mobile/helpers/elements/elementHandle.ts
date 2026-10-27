/** The actions every element handle offers, native or web: same names, same wait-then-act contract. */
export interface ElementHandle {
  waitVisible(timeout?: number): Promise<void>;
  tap(timeout?: number): Promise<void>;
  replaceText(text: string, timeout?: number): Promise<void>;
  getText(timeout?: number): Promise<string>;
}
