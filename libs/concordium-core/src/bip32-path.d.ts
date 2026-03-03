declare module "bip32-path" {
  interface BIPPath {
    toPathArray(): number[];
  }
  const BIPPath: {
    fromString(path: string, reqRoot?: boolean): BIPPath;
  };
  export default BIPPath;
}
