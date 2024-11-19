export abstract class Keyring {
  abstract getAddress(derivationPath: string, options: unknown): Promise<unknown>;
  abstract signTransaction(
    derivationPath: string,
    transaction: unknown,
    options: unknown,
  ): Promise<unknown>;
  abstract signMessage(
    derivationPath: string,
    message: unknown,
    options: unknown,
  ): Promise<unknown>;
}
