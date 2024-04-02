export type SolanaAddress = {
  address: Buffer;
};
export type SolanaSignature = {
  signature: Buffer;
};
// enum PubKeyDisplayMode {
//   LONG,
//   SHORT,
// }
// type AppConfig = {
//   blindSigningEnabled: boolean;
//   pubKeyDisplayMode: PubKeyDisplayMode;
//   version: string;
// };
export interface SolanaSigner {
  getAddress(path: string, display?: boolean): Promise<SolanaAddress>;
  sign(path: string, txBuffer: Buffer): Promise<SolanaSignature>;
  // signOffchainMessage(path: string, msgBuffer: Buffer): Promise<SolanaSignature>;
  // getAppConfiguration(): Promise<AppConfig>;
}
