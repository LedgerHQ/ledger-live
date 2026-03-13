declare module "bip32-path" {
  export type BIPPath = {
    toPathArray: () => Array<number>;
  };

  export function fromString(string): BIPPath;
}
