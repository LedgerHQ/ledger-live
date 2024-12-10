import {
  Account,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  Hex,
  RawTransaction,
  SimpleTransaction,
  generateSignedTransaction,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";
import HwAptos from "@ledgerhq/hw-app-aptos";
import Transport from "@ledgerhq/hw-transport";
import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";

export default class LedgerAccount {
  private readonly hdPath: string;

  private client?: HwAptos;
  private publicKey: Buffer = Buffer.from([]);
  private accountAddress: Hex = Hex.fromHexString("");

  static async fromLedgerConnection(transport: Transport, path: string): Promise<LedgerAccount> {
    const account = new LedgerAccount(path);
    await account.init(transport);
    return account;
  }

  toAptosAccount(): Account {
    return this as unknown as Account;
  }

  constructor(path: string, pubKey?: string) {
    this.hdPath = path;
    if (pubKey) {
      this.publicKey = Buffer.from(Hex.fromHexString(pubKey).toUint8Array());
      this.accountAddress = this.authKey();
    }
  }

  async init(transport: Transport, display = false): Promise<void> {
    this.client = new HwAptos(transport);
    if (!this.publicKey.length && !display) {
      const response = await this.client.getAddress(this.hdPath, display);
      this.accountAddress = Hex.fromHexString(response.address);
      this.publicKey = response.publicKey;
    }
  }

  hdWalletPath(): string {
    return this.hdPath;
  }

  address(): Hex {
    return this.accountAddress;
  }

  authKey(): Hex {
    const hash = sha3Hash.create();
    hash.update(this.publicKey.toString());
    hash.update("\x00");
    return Hex.fromHexString(hash.digest().toString());
  }

  pubKey(): Hex {
    return Hex.fromHexString(this.publicKey.toString());
  }

  async asyncSignBuffer(buffer: Uint8Array): Promise<Hex> {
    if (!this.client) {
      throw new Error("LedgerAccount not initialized");
    }
    const response = await this.client.signTransaction(this.hdPath, Buffer.from(buffer));
    return Hex.fromHexString(response.signature.toString());
  }

  async asyncSignHexString(hexString: Hex): Promise<Hex> {
    const toSign = hexString.toUint8Array();
    return this.asyncSignBuffer(toSign);
  }

  async signTransaction(rawTxn: RawTransaction): Promise<Uint8Array> {
    const signingMessage = generateSigningMessageForTransaction({
      rawTransaction: rawTxn,
    } as SimpleTransaction);
    const sigHexStr = await this.asyncSignBuffer(signingMessage);
    const signature = new Ed25519Signature(sigHexStr.toUint8Array());
    const authenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(this.publicKey.toString()),
      signature,
    );

    return generateSignedTransaction({
      transaction: { rawTransaction: rawTxn } as SimpleTransaction,
      senderAuthenticator: authenticator,
    });
  }
}
