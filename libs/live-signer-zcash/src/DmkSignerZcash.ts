import type {
  AddressFormat,
  BitcoinAddress,
  BitcoinSignature,
  BitcoinSigner,
  CreateTransaction,
  SignerTransaction,
} from "@ledgerhq/coin-bitcoin/signer";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { SignerZcash, SignerZcashBuilder } from "@ledgerhq/device-signer-kit-zcash";
import Transport from "@ledgerhq/hw-transport";
import Btc from "@ledgerhq/hw-app-btc";
import { SignP2SHTransactionArg } from "@ledgerhq/hw-app-btc/signP2SHTransaction";
import type { Transaction } from "@ledgerhq/hw-app-btc/types";

export enum PubKeyDisplayMode {
  LONG,
  SHORT,
}

export type AppConfig = {
  blindSigningEnabled: boolean;
  pubKeyDisplayMode: PubKeyDisplayMode;
  version: string;
};

interface ZcashSigner extends Partial<BitcoinSigner> {
  getViewKey: (path: string) => Promise<Buffer>;
  getAppConfiguration(): Promise<AppConfig>;
}

export class DmkSignerZcash extends Btc implements ZcashSigner {
  private readonly dmkSigner: SignerZcash;

  constructor(
    readonly dmk: DeviceManagementKit,
    readonly sessionId: string,
    transport: Transport,
    currency: string,
  ) {
    super({ transport, currency });

    this.dmkSigner = new SignerZcashBuilder({
      dmk,
      sessionId,
    }).build();
  }

  getViewKey(_path: string): Promise<Buffer> {
    throw new Error("Not implemented yet");
  }

  getAppConfiguration(): Promise<AppConfig> {
    throw new Error("Not implemented yet");
  }

  getWalletXpub(arg: { path: string; xpubVersion: number }): Promise<string> {
    return super.getWalletXpub(arg);
  }

  getWalletPublicKey(
    path: string,
    opts?: { verify?: boolean; format?: AddressFormat },
  ): Promise<BitcoinAddress> {
    return super.getWalletPublicKey(path, opts);
  }

  signMessage(path: string, messageHex: string): Promise<BitcoinSignature> {
    return super.signMessage(path, messageHex);
  }

  createPaymentTransaction(arg: CreateTransaction): Promise<string> {
    return super.createPaymentTransaction(arg);
  }

  signPsbtBuffer(psbtBuffer: Buffer, options: any): Promise<{ psbt: Buffer; tx?: string }> {
    return super.signPsbtBuffer(psbtBuffer, options);
  }

  signP2SHTransaction(arg: SignP2SHTransactionArg): Promise<string[]> {
    return super.signP2SHTransaction(arg);
  }

  splitTransaction(
    transactionHex: string,
    isSegwitSupported?: boolean,
    hasExtraData?: boolean,
    additionals?: Array<string>,
  ): SignerTransaction {
    return super.splitTransaction(transactionHex, isSegwitSupported, hasExtraData, additionals);
  }

  serializeTransactionOutputs(t: Transaction): Buffer {
    return super.serializeTransactionOutputs(t);
  }

  getTrustedInput(
    indexLookup: number,
    transaction: Transaction,
    additionals: Array<string> = [],
  ): Promise<string> {
    return super.getTrustedInput(indexLookup, transaction, additionals);
  }

  getTrustedInputBIP143(
    indexLookup: number,
    transaction: Transaction,
    additionals: Array<string> = [],
  ): string {
    return super.getTrustedInputBIP143(indexLookup, transaction, additionals);
  }
}
