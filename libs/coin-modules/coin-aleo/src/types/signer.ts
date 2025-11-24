export interface AleoSigner {
  signTransaction(path: string, transaction: Buffer): Promise<Buffer>;
  getAddress: (path: string, display?: boolean) => Promise<Buffer>;
}
