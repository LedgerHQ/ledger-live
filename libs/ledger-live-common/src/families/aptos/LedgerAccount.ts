import { sha3_256 as sha3Hash } from "@noble/hashes/sha3";
import Transport from "@ledgerhq/hw-transport";
import HwAptos from "./hw-app-aptos";
import {
  AptosAccount,
  HexString,
  MaybeHexString,
  TransactionBuilder,
  TxnBuilderTypes,
  BCS,
} from "aptos";

export default class LedgerAccount {
  private readonly hdPath: string;

  private client?: HwAptos;
  private publicKey: Buffer = Buffer.from([]);
  private accountAddress: HexString = new HexString("");

  static async fromLedgerConnection(
    transport: Transport,
    path: string
  ): Promise<LedgerAccount> {
    const account = new LedgerAccount(path);
    await account.init(transport);
    return account;
  }

  toAptosAccount(): AptosAccount {
    return this as unknown as AptosAccount;
  }

  constructor(path: string, pubKey?: string) {
    this.hdPath = path;
    if (pubKey) {
      this.publicKey = Buffer.from(HexString.ensure(pubKey).toUint8Array());
      this.accountAddress = this.authKey();
    }
  }

  async init(transport: Transport, display = false): Promise<void> {
    this.client = new HwAptos(transport);
    const response = await this.client.getAddress(this.hdPath, display);
    this.accountAddress = new HexString(response.address);
    this.publicKey = response.publicKey;
  }

  hdWalletPath(): string {
    return this.hdPath;
  }

  address(): HexString {
    return this.accountAddress;
  }

  authKey(): HexString {
    const hash = sha3Hash.create();
    hash.update(this.publicKey);
    hash.update("\x00");
    return HexString.fromBuffer(hash.digest());
  }

  pubKey(): HexString {
    return HexString.fromBuffer(this.publicKey);
  }

  async asyncSignBuffer(buffer: Uint8Array): Promise<HexString> {
    if (!this.client) {
      throw new Error("LedgerAccount not initialized");
    }
    const response = await this.client.signTransaction(
      this.hdPath,
      Buffer.from(buffer)
    );
    return HexString.fromBuffer(response.signature);
  }

  async asyncSignHexString(hexString: MaybeHexString): Promise<HexString> {
    const toSign = HexString.ensure(hexString).toUint8Array();
    return this.asyncSignBuffer(toSign);
  }

  async rawToSigned(
    rawTxn: TxnBuilderTypes.RawTransaction
  ): Promise<TxnBuilderTypes.SignedTransaction> {
    const signingMessage = TransactionBuilder.getSigningMessage(rawTxn);
    const sigHexStr = await this.asyncSignBuffer(signingMessage);
    const signature = new TxnBuilderTypes.Ed25519Signature(
      sigHexStr.toUint8Array()
    );
    const authenticator = new TxnBuilderTypes.TransactionAuthenticatorEd25519(
      new TxnBuilderTypes.Ed25519PublicKey(this.publicKey),
      signature
    );

    return new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
  }

  async signTransaction(
    rawTxn: TxnBuilderTypes.RawTransaction
  ): Promise<Uint8Array> {
    return BCS.bcsToBytes(await this.rawToSigned(rawTxn));
  }
}
