/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Transport from "@ledgerhq/hw-transport";
import bs58check from "bs58check";
import Btc from "../../src/Btc";
import BtcNew from "../../src/BtcNew";
import { BufferWriter } from "../../src/buffertools";
import { CreateTransactionArg } from "../../src/createTransaction";
import { AddressFormat } from "../../src/getWalletPublicKey";
import { AppClient } from "../../src/newops/appClient";
import {
  DefaultDescriptorTemplate,
  WalletPolicy,
} from "../../src/newops/policy";
import { Transaction } from "../../src/types";
import { CoreInput, CoreTx, spentTxs } from "./testtx";

export async function runSignTransaction(
  testTx: CoreTx,
  testPaths: { ins: string[]; out?: string },
  client: TestingClient,
  transport: Transport
): Promise<string> {
  const btcNew = new BtcNew(client);
  // btc is needed to perform some functions like splitTransaction.
  const btc = new Btc({ transport });
  const accountType = getAccountType(testTx.vin[0], btc);
  const additionals: string[] = [];
  if (accountType == StandardPurpose.p2wpkh) {
    additionals.push("bech32");
  }
  if (accountType == StandardPurpose.p2tr) {
    additionals.push("bech32m");
  }
  const associatedKeysets: string[] = [];
  const yieldSigs = new Map<number, Buffer>();
  const inputs = testTx.vin.map((input, index) => {
    const path = testPaths.ins[index];
    associatedKeysets.push(path);
    const inputData = createInput(input, btc);
    const pubkey = getPubkey(
      index,
      accountType,
      testTx,
      inputData[0],
      inputData[1]
    );
    const mockXpub = creatDummyXpub(pubkey);
    client.mockGetPubkeyResponse(path, mockXpub);
    yieldSigs.set(index, getSignature(input, accountType));
    return inputData;
  });
  const sig0 = yieldSigs.get(0)!;
  let sigHashType: number | undefined = sig0.readUInt8(sig0.length - 1);
  if (sigHashType == 0x01) {
    sigHashType = undefined;
  }
  client.mockSignPsbt(yieldSigs);
  const outputWriter = new BufferWriter();
  outputWriter.writeVarInt(testTx.vout.length);
  testTx.vout.forEach((output) => {
    outputWriter.writeUInt64(
      Number.parseFloat((output.value * 100000000).toFixed(8))
    );
    outputWriter.writeVarSlice(Buffer.from(output.scriptPubKey.hex, "hex"));
  });
  const outputScriptHex = outputWriter.buffer().toString("hex");
  let callbacks = "";
  function logCallback(message: string) {
    callbacks += new Date().toISOString() + " " + message + "\n";
  }
  const arg: CreateTransactionArg = {
    inputs,
    additionals,
    associatedKeysets,
    changePath: testPaths.out,
    outputScriptHex,
    lockTime: testTx.locktime,
    sigHashType,
    segwit: accountType != StandardPurpose.p2pkh,
    onDeviceSignatureGranted: () => logCallback("CALLBACK: signature granted"),
    onDeviceSignatureRequested: () =>
      logCallback("CALLBACK: signature requested"),
    onDeviceStreaming: (arg) => logCallback("CALLBACK: " + JSON.stringify(arg)),
  };
  logCallback("Start createPaymentTransaction");
  const tx = await btcNew.createPaymentTransaction(arg);
  logCallback("Done createPaymentTransaction");
  // console.log(callbacks);
  return tx;
}

export function addressFormatFromDescriptorTemplate(
  descTemp: DefaultDescriptorTemplate
): AddressFormat {
  if (descTemp == "tr(@0)") return "bech32m";
  if (descTemp == "pkh(@0)") return "legacy";
  if (descTemp == "wpkh(@0)") return "bech32";
  if (descTemp == "sh(wpkh(@0))") return "p2sh";
  throw new Error();
}

export enum StandardPurpose {
  p2tr = "86'",
  p2wpkh = "84'",
  p2wpkhInP2sh = "49'",
  p2pkh = "44'",
}

function getPubkey(
  inputIndex: number,
  accountType: StandardPurpose,
  testTx: CoreTx,
  spentTx: Transaction,
  spentOutputIndex: number
): Buffer {
  const scriptSig = Buffer.from(testTx.vin[inputIndex].scriptSig.hex, "hex");
  if (accountType == StandardPurpose.p2pkh) {
    return scriptSig.slice(scriptSig.length - 33);
  }
  if (accountType == StandardPurpose.p2tr) {
    return spentTx.outputs![spentOutputIndex].script.slice(2, 34); // 32 bytes x-only pubkey
  }
  if (
    accountType == StandardPurpose.p2wpkh ||
    accountType == StandardPurpose.p2wpkhInP2sh
  ) {
    return Buffer.from(testTx.vin[inputIndex].txinwitness![1], "hex");
  }
  throw new Error();
}

function getSignature(
  testTxInput: CoreInput,
  accountType: StandardPurpose
): Buffer {
  const scriptSig = Buffer.from(testTxInput.scriptSig.hex, "hex");
  if (accountType == StandardPurpose.p2pkh) {
    return scriptSig.slice(1, scriptSig.length - 34);
  }
  if (accountType == StandardPurpose.p2tr) {
    return Buffer.from(testTxInput.txinwitness![0], "hex");
  }
  if (
    accountType == StandardPurpose.p2wpkh ||
    accountType == StandardPurpose.p2wpkhInP2sh
  ) {
    return Buffer.from(testTxInput.txinwitness![0], "hex");
  }
  throw new Error();
}

function getAccountType(coreInput: CoreInput, btc: Btc): StandardPurpose {
  const spentTx = spentTxs[coreInput.txid];
  if (!spentTx) {
    throw new Error("Spent tx " + coreInput.txid + " unavailable.");
  }
  const splitSpentTx = btc.splitTransaction(spentTx, true);
  const spentOutput = splitSpentTx.outputs![coreInput.vout];
  const script = spentOutput.script;
  if (script.length == 34 && script[0] == 0x51) {
    return StandardPurpose.p2tr;
  }
  if (script.length == 22 && script[0] == 0x00) {
    return StandardPurpose.p2wpkh;
  }
  if (script.length == 23) {
    return StandardPurpose.p2wpkhInP2sh;
  }
  return StandardPurpose.p2pkh;
}

export function creatDummyXpub(pubkey: Buffer): string {
  const xpubDecoded = bs58check.decode(
    "tpubDHcN44A4UHqdHJZwBxgTbu8Cy87ZrZkN8tQnmJGhcijHqe4rztuvGcD4wo36XSviLmiqL5fUbDnekYaQ7LzAnaqauBb9RsyahsTTFHdeJGd"
  );
  const pubkey33 =
    pubkey.length == 33 ? pubkey : Buffer.concat([Buffer.from([2]), pubkey]);
  xpubDecoded.fill(pubkey33, xpubDecoded.length - 33);
  return bs58check.encode(xpubDecoded);
}

function createInput(
  coreInput: CoreInput,
  btc: Btc
): [Transaction, number, string | null, number] {
  const spentTx = spentTxs[coreInput.txid];
  if (!spentTx) {
    throw new Error("Spent tx " + coreInput.txid + " unavailable.");
  }
  const splitSpentTx = btc.splitTransaction(spentTx, true);
  return [splitSpentTx, coreInput.vout, null, coreInput.sequence];
}

export const masterFingerprint = Buffer.from([1, 2, 3, 4]);
export class TestingClient extends AppClient {
  mockGetPubkeyResponse(_pathElements: string, _response: string): void {}
  mockGetWalletAddressResponse(
    _walletPolicy: WalletPolicy,
    _change: number,
    _addressIndex: number,
    _response: string
  ): void {}
  mockSignPsbt(_yieldSigs: Map<number, Buffer>): void {}
}
