/**
 * prettier@2 ships no types and `@types/prettier` is not used in this repo.
 * Only the surface these tests need is declared, and only for the tests —
 * the tool itself does not depend on prettier at runtime.
 */
declare module "prettier" {
  type Options = Record<string, unknown>;

  const prettier: {
    resolveConfig(filePath: string): Promise<Options | null>;
    format(source: string, options?: Options): string;
  };

  export default prettier;
}
