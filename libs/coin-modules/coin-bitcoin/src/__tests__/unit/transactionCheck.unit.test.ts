jest.mock("@ledgerhq/live-network/network", () => ({ __esModule: true, default: jest.fn() }));

import { BigNumber } from "bignumber.js";
import { Psbt, Transaction as BtcTransaction } from "bitcoinjs-lib";
import network from "@ledgerhq/live-network/network";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { DerivationModes, type TransactionInfo } from "@ledgerhq/wallet-btc/types";
import { TEST_CONFIG, TEST_LOGGER } from "../fixtures/coinConfig";
import { sha256 } from "../../crypto-util";
import {
  buildScanPsbt,
  checkTransaction,
  parseDescriptor,
  TransactionCheckRisk,
} from "../../transactionCheck";

const mockedNetwork = jest.mocked(network);

const XPUB =
  "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB";
const URL = "https://transaction-checks.test.invalid/v3";
const CONFIG = { ...TEST_CONFIG, transactionChecks: { url: URL } };
const crypto = cryptoFactory("bitcoin");

const makeWalletAccount = (derivationMode: DerivationModes): WalletAccount =>
  ({
    params: { path: "84'/0'", index: 0, currency: "bitcoin", network: "mainnet", derivationMode },
    xpub: { xpub: XPUB, crypto },
  }) as unknown as WalletAccount;

async function makeTxInfo(derivationMode: DerivationModes): Promise<TransactionInfo> {
  const inputAddress = await crypto.getAddress(derivationMode, XPUB, 0, 0);
  const recipientAddress = await crypto.getAddress(derivationMode, XPUB, 0, 1);
  const changeAddress = await crypto.getAddress(derivationMode, XPUB, 1, 0);

  const prevTx = new BtcTransaction();
  prevTx.addInput(Buffer.alloc(32, 1), 0);
  prevTx.addOutput(crypto.toOutputScript(inputAddress), 100000n);

  return {
    inputs: [
      {
        address: inputAddress,
        value: "100000",
        output_hash: prevTx.getId(),
        output_index: 0,
        sequence: 0xfffffffd,
        txHex: prevTx.toHex(),
      },
    ],
    associatedDerivations: [[0, 0]],
    outputs: [
      {
        script: crypto.toOutputScript(recipientAddress),
        value: new BigNumber(60000),
        address: recipientAddress,
        isChange: false,
      },
      {
        script: crypto.toOutputScript(changeAddress),
        value: new BigNumber(39000),
        address: changeAddress,
        isChange: true,
      },
    ],
    fee: 1000,
    changeAddress: { account: 1, index: 0, address: changeAddress },
  };
}

function tlv(tag: number, value: Buffer): Buffer {
  const tagBytes = tag < 0x80 ? Buffer.from([tag]) : Buffer.from([0x81, tag]);
  return Buffer.concat([tagBytes, Buffer.from([value.length]), value]);
}

function makeDescriptor({
  psbt,
  from,
  chainId = 1000,
  risk,
}: {
  psbt: Buffer;
  from: string;
  chainId?: number;
  risk: number;
}): string {
  const chain = Buffer.alloc(8);
  chain.writeBigUInt64BE(BigInt(chainId));
  return (
    "0x" +
    Buffer.concat([
      tlv(0x01, Buffer.from([0x09])),
      tlv(0x02, Buffer.from([0x00, 0x01])),
      tlv(0x23, chain),
      tlv(0x22, Buffer.from(from, "ascii")),
      tlv(0x27, sha256(psbt)),
      tlv(0x80, Buffer.from([risk])),
      tlv(0x81, Buffer.from([risk === 0 ? 0x00 : 0x02])),
      tlv(0x83, Buffer.from("https://bl.kd/abc", "ascii")),
      tlv(0x84, Buffer.from([0x00])),
      tlv(0x15, Buffer.alloc(70, 0x30)),
    ]).toString("hex")
  );
}

describe("buildScanPsbt", () => {
  it("builds a native segwit PSBT without xpub nor master fingerprints", async () => {
    const txInfo = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);
    const scan = await buildScanPsbt(makeWalletAccount(DerivationModes.NATIVE_SEGWIT), txInfo);

    expect(scan?.from).toBe(txInfo.inputs[0]!.address);
    const psbt = Psbt.fromBuffer(scan!.psbt);
    expect(psbt.data.globalMap.globalXpub).toBeUndefined();
    expect(psbt.data.inputs[0]!.witnessUtxo?.value).toBe(100000n);
    expect(psbt.data.inputs[0]!.nonWitnessUtxo).toBeUndefined();
    expect(psbt.data.inputs[0]!.bip32Derivation?.[0]).toMatchObject({
      path: "m/84'/0'/0'/0/0",
      masterFingerprint: new Uint8Array(4),
    });
    expect(psbt.txOutputs.map(o => o.value)).toEqual([60000n, 39000n]);
    expect(psbt.data.outputs[0]!.bip32Derivation).toBeUndefined();
    expect(psbt.data.outputs[1]!.bip32Derivation?.[0]?.path).toBe("m/84'/0'/0'/1/0");
  });

  it("uses the full previous transaction for legacy inputs", async () => {
    const txInfo = await makeTxInfo(DerivationModes.LEGACY);
    const scan = await buildScanPsbt(makeWalletAccount(DerivationModes.LEGACY), txInfo);

    const psbt = Psbt.fromBuffer(scan!.psbt);
    expect(Buffer.from(psbt.data.inputs[0]!.nonWitnessUtxo!).toString("hex")).toBe(
      txInfo.inputs[0]!.txHex,
    );
    expect(psbt.data.inputs[0]!.witnessUtxo).toBeUndefined();
  });

  it("uses x-only taproot derivations", async () => {
    const txInfo = await makeTxInfo(DerivationModes.TAPROOT);
    const scan = await buildScanPsbt(makeWalletAccount(DerivationModes.TAPROOT), txInfo);

    const input = Psbt.fromBuffer(scan!.psbt).data.inputs[0]!;
    expect(input.bip32Derivation).toBeUndefined();
    expect(input.tapBip32Derivation?.[0]?.pubkey).toHaveLength(32);
  });
});

describe("parseDescriptor", () => {
  const psbt = Buffer.from("70736274ff01", "hex");
  const from = "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu";

  it("extracts the risk of a descriptor matching the PSBT", () => {
    const descriptor = makeDescriptor({ psbt, from, risk: TransactionCheckRisk.Threat });

    expect(parseDescriptor(descriptor, { psbt, from, chainId: 1000 })).toEqual({
      risk: TransactionCheckRisk.Threat,
      category: 0x02,
      providerMessage: undefined,
      reportUrl: "https://bl.kd/abc",
    });
  });

  it("rejects a descriptor computed for another PSBT", () => {
    const descriptor = makeDescriptor({ psbt: Buffer.from("other"), from, risk: 2 });

    expect(() => parseDescriptor(descriptor, { psbt, from, chainId: 1000 })).toThrow(
      "descriptor TX_HASH mismatch",
    );
  });

  it("rejects a descriptor computed for another chain", () => {
    const descriptor = makeDescriptor({ psbt, from, chainId: 1001, risk: 2 });

    expect(() => parseDescriptor(descriptor, { psbt, from, chainId: 1000 })).toThrow(
      "descriptor CHAIN_ID mismatch",
    );
  });

  it("rejects a descriptor for another address", () => {
    const descriptor = makeDescriptor({ psbt, from: "bc1qother", risk: 2 });

    expect(() => parseDescriptor(descriptor, { psbt, from, chainId: 1000 })).toThrow(
      "descriptor ADDRESS mismatch",
    );
  });
});

describe("checkTransaction", () => {
  const walletAccount = makeWalletAccount(DerivationModes.NATIVE_SEGWIT);

  beforeEach(() => {
    mockedNetwork.mockReset();
  });

  it("posts the PSBT and returns the risk of the descriptor", async () => {
    const txInfo = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);
    mockedNetwork.mockImplementation(async ({ data }) => {
      const { tx } = data as { tx: { from: string; raw: string } };
      const psbt = Buffer.from(tx.raw, "base64");
      return {
        data: {
          public_key_id: "blockaid",
          descriptor: makeDescriptor({ psbt, from: tx.from, risk: 1 }),
          block: 1,
        },
        status: 200,
      } as Awaited<ReturnType<typeof network>>;
    });

    const result = await checkTransaction(CONFIG, TEST_LOGGER, "bitcoin", walletAccount, txInfo);

    expect(result?.risk).toBe(TransactionCheckRisk.Risk);
    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: `${URL}/bitcoin/scan/tx`,
        data: expect.objectContaining({ chain: 1000 }),
      }),
    );
  });

  it("scans again when the recipient changes", async () => {
    const flagged = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);
    const clean = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);
    const withRecipient = async (txInfo: TransactionInfo, index: number) => {
      const address = await crypto.getAddress(DerivationModes.NATIVE_SEGWIT, XPUB, 0, index);
      txInfo.outputs[0] = {
        ...txInfo.outputs[0]!,
        script: crypto.toOutputScript(address),
        address,
      };
    };
    // recipients unused by the other tests, so that nothing is served from the cache
    await withRecipient(flagged, 5);
    await withRecipient(clean, 6);
    const flaggedScript = flagged.outputs[0]!.script;
    mockedNetwork.mockImplementation(async ({ data }) => {
      const { tx } = data as { tx: { from: string; raw: string } };
      const psbt = Buffer.from(tx.raw, "base64");
      const isFlagged = Psbt.fromBuffer(psbt).txOutputs.some(o =>
        Buffer.from(o.script).equals(flaggedScript),
      );
      return {
        data: {
          public_key_id: "blockaid",
          descriptor: makeDescriptor({ psbt, from: tx.from, risk: isFlagged ? 2 : 0 }),
          block: 1,
        },
        status: 200,
      } as Awaited<ReturnType<typeof network>>;
    });

    const first = await checkTransaction(CONFIG, TEST_LOGGER, "bitcoin", walletAccount, flagged);
    const second = await checkTransaction(CONFIG, TEST_LOGGER, "bitcoin", walletAccount, clean);

    expect(first?.risk).toBe(TransactionCheckRisk.Threat);
    expect(second?.risk).toBe(TransactionCheckRisk.Benign);
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });

  it("returns null when the backend fails", async () => {
    const txInfo = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);
    txInfo.fee = 999; // another PSBT than the cached one
    txInfo.outputs[1]!.value = new BigNumber(39001);
    mockedNetwork.mockRejectedValue(new Error("422"));

    await expect(
      checkTransaction(CONFIG, TEST_LOGGER, "bitcoin", walletAccount, txInfo),
    ).resolves.toBeNull();
  });

  it("does not call the backend when the check is not configured", async () => {
    const txInfo = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);

    await expect(
      checkTransaction(TEST_CONFIG, TEST_LOGGER, "bitcoin", walletAccount, txInfo),
    ).resolves.toBeNull();
    expect(mockedNetwork).not.toHaveBeenCalled();
  });

  it("does not call the backend for a currency without chain id", async () => {
    const txInfo = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);

    await expect(
      checkTransaction(CONFIG, TEST_LOGGER, "litecoin", walletAccount, txInfo),
    ).resolves.toBeNull();
    expect(mockedNetwork).not.toHaveBeenCalled();
  });
});
