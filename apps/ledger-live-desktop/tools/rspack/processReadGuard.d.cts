type Hit = { index: number; property: string };

declare class ProcessReadGuard {
  apply(compiler: unknown): void;
  static findUnguarded(code: string): Hit[];
  static findUnguardedGlobals(code: string): Hit[];
}

export = ProcessReadGuard;
