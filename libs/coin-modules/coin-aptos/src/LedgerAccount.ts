import {
  Account,
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
import getAddress from "./signer";
import { GetAddressFn } from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { AptosSigner } from "./types";

export default class LedgerAccount {
  private readonly hdPath: string;

  private client?: GetAddressFn;
  private publicKey: Buffer = Buffer.from([]);
  private accountAddress: AccountAddress = new AccountAddress(
    new Uint8Array(AccountAddress.LENGTH),
  );

  // static async fromLedgerConnection(transport: Transport, path: string): Promise<LedgerAccount> {
  //   const account = new LedgerAccount(path);
  //   await account.init(transport);
  //   return account;
  // }

  toAptosAccount(): Account {
    return this as unknown as Account;
  }

  constructor(path: string, pubKey?: string) {
    this.hdPath = path;
    if (pubKey) {
      this.publicKey = Buffer.from(AccountAddress.from(pubKey).toUint8Array());
      this.accountAddress = this.authKey();
    }
  }

  async init(
    signerContext: SignerContext<AptosSigner>,
    deviceId: string,
    display = false,
  ): Promise<void> {
    const resolver = getAddress(signerContext);
    const address = await resolver(deviceId, {});
    if (!resolver.publicKey.length && !display) {
      const response = await this.client.getAddress(this.hdPath, display);
      this.accountAddress = AccountAddress.from(response.address);
      this.publicKey = response.publicKey;
    }
  }

  hdWalletPath(): string {
    return this.hdPath;
  }

  address(): AccountAddress {
    return this.accountAddress;
  }

  authKey(): AccountAddress {
    const hash = sha3Hash.create();
    hash.update(this.publicKey.toString("hex"));
    hash.update("\x00");
    return AccountAddress.from(hash.digest());
  }

  pubKey(): AccountAddress {
    return AccountAddress.from(this.publicKey.toString("hex"));
  }

  async asyncSignBuffer(buffer: Uint8Array): Promise<Hex> {
    if (!this.client) {
      throw new Error("LedgerAccount not initialized");
    }
    const response = await this.client.signTransaction(this.hdPath, Buffer.from(buffer));
    return new Hex(new Uint8Array(response.signature));
  }

  async asyncSignHexString(hexString: AccountAddress): Promise<Hex> {
    const isValidAddress = AccountAddress.isValid({ input: hexString });
    if (!isValidAddress) throw new Error("Invalid account address");
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
      new Ed25519PublicKey(this.publicKey.toString("hex")),
      signature,
    );

    return generateSignedTransaction({
      transaction: { rawTransaction: rawTxn } as SimpleTransaction,
      senderAuthenticator: authenticator,
    });
  }
}
