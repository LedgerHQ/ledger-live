export interface Keyring {
  name: string;
  broadcaster: boolean;
  signTransaction(
    transaction: unknown,
    options?: unknown
  ): Promise<{ r: string; s: string; v: string } | string>;
  getAddress(): Promise<{ address: string }>;
}
