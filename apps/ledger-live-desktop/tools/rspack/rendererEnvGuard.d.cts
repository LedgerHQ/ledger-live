type EnvUses = { reads: { index: number; key: string }[]; opaque: number[] };

declare class RendererEnvGuard {
  apply(compiler: unknown): void;
  static findEnvUses(code: string): EnvUses;
  static findWithheld(code: string): { index: number; key: string }[];
}

export = RendererEnvGuard;
