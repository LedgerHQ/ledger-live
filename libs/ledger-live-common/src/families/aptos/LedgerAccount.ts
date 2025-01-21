import {
  AccountAddress,
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
  private accountAddress: AccountAddress = new AccountAddress(
    new Uint8Array(AccountAddress.LENGTH),
  );

  constructor(path: string, pubKey?: string) {
    this.hdPath = path;
    if (pubKey) {
      this.publicKey = Buffer.from(AccountAddress.from(pubKey).toUint8Array());
      this.accountAddress = this.authKey();
    }
  }

  async init(transport: Transport, display = false): Promise<void> {
    this.client = new HwAptos(transport);
    if (!this.publicKey.length && !display) {
      const response = await this.client.getAddress(this.hdPath, display);
      this.accountAddress = AccountAddress.from(response.address);
      this.publicKey = response.publicKey;
    }
  }

  authKey(): AccountAddress {
    const hash = sha3Hash.create();
    hash.update(this.publicKey.toString("hex"));
    hash.update("\x00");
    return AccountAddress.from(hash.digest());
  }

  async asyncSignBuffer(buffer: Uint8Array): Promise<Hex> {
    if (!this.client) {
      throw new Error("LedgerAccount not initialized");
    }
    const response = await this.client.signTransaction(this.hdPath, Buffer.from(buffer));
    return new Hex(new Uint8Array(response.signature));
  }

  async signTransaction(rawTxn: RawTransaction): Promise<Uint8Array> {
    const signingMessage = generateSigningMessageForTransaction({
      rawTransaction: rawTxn,
    } as SimpleTransaction);
    const sigHexStr = await this.asyncSignBuffer(signingMessage);
    const signature = new Ed25519Signature(sigHexStr.toUint8Array());
    const authenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(this.publicKey.toString("hex")),
      signature,
    );

    return generateSignedTransaction({
      transaction: { rawTransaction: rawTxn } as SimpleTransaction,
      senderAuthenticator: authenticator,
    });
  }
}
