jest.mock("../../cache", () => ({ calculateFees: jest.fn() }));
jest.mock("../../getWalletAccount", () => ({ getWalletAccount: jest.fn() }));

import { BigNumber } from "bignumber.js";
import { Psbt, Transaction as BtcTransaction } from "bitcoinjs-lib";
import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { DerivationModes, type TransactionInfo } from "@ledgerhq/wallet-btc/types";
import { TEST_CONFIG, TEST_LOGGER } from "../fixtures/coinConfig";
import { calculateFees } from "../../cache";
import { sha256 } from "../../crypto-util";
import { getWalletAccount } from "../../getWalletAccount";
import type { Transaction } from "../../types";
import { buildScanPsbt, getTransactionCheckPayload } from "../../transactionCheck";

const mockedCalculateFees = jest.mocked(calculateFees);
const mockedGetWalletAccount = jest.mocked(getWalletAccount);

const XPUB =
  "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB";
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

const makeAccount = (currencyId: string) => ({ currency: { id: currencyId } }) as Account;

describe("getTransactionCheckPayload", () => {
  const walletAccount = makeWalletAccount(DerivationModes.NATIVE_SEGWIT);
  const transaction = {} as Transaction;

  beforeEach(() => {
    mockedCalculateFees.mockReset();
    mockedGetWalletAccount.mockReturnValue(walletAccount);
  });

  it("serializes the PSBT spending the whole balance to the recipient", async () => {
    const walletTx = await makeTxInfo(DerivationModes.NATIVE_SEGWIT);
    mockedCalculateFees.mockResolvedValue({
      fees: new BigNumber(walletTx.fee),
      txInputs: [],
      txOutputs: [],
      walletTx,
    });
    const account = makeAccount("bitcoin");

    const payload = await getTransactionCheckPayload(
      TEST_CONFIG,
      TEST_LOGGER,
      account,
      transaction,
    );

    const { psbt } = (await buildScanPsbt(walletAccount, walletTx))!;
    expect(payload).toEqual({
      chain: "bitcoin",
      from: walletTx.inputs[0]!.address,
      raw: psbt.toString("base64"),
      txHash: sha256(psbt).toString("hex"),
    });
    expect(mockedCalculateFees).toHaveBeenCalledWith(TEST_CONFIG, TEST_LOGGER, {
      account,
      transaction: { ...transaction, useAllAmount: true },
    });
  });

  it("returns null when the transaction cannot be built", async () => {
    mockedCalculateFees.mockRejectedValue(new Error("NotEnoughBalance"));

    await expect(
      getTransactionCheckPayload(TEST_CONFIG, TEST_LOGGER, makeAccount("bitcoin"), transaction),
    ).resolves.toBeNull();
  });
});
