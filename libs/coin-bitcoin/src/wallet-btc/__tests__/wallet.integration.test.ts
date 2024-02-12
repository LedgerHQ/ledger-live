import BigNumber from "bignumber.js";
import { script } from "bitcoinjs-lib";
import { DerivationModes } from "../types";
import BitcoinLikeWallet from "../wallet";
import { Account } from "../account";
import { Merge } from "../pickingstrategies/Merge";
import MockBtcSigner from "../../mockBtcSigner";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

jest.setTimeout(180000);

describe("testing wallet", () => {
  const wallet = new BitcoinLikeWallet();
  let account: Account;

  it("should generate an account", async () => {
    account = await wallet.generateAccount(
      {
        xpub: "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
        path: "44'/0'",
        index: 0,
        currency: "bitcoin",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      getCryptoCurrencyById("bitcoin"),
    );

    expect(account.xpub.xpub).toEqual(
      "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
    );
  });

  it("should sync an account", async () => {
    await wallet.syncAccount(account);
    const balance = await wallet.getAccountBalance(account);

    expect(balance.toNumber()).toEqual(109088);
  });

  it("should allow to store and load an account", async () => {
    const serializedAccount = await wallet.exportToSerializedAccount(account);
    const unserializedAccount = await wallet.importFromSerializedAccount(serializedAccount);
    const balance = await wallet.getAccountBalance(unserializedAccount);
    expect(balance.toNumber()).toEqual(109088);
  });

  it("should allow to build a transaction", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);

    const txInfo = await wallet.buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
    });

    const tx = await wallet.signAccountTx({
      btc: new MockBtcSigner(),
      fromAccount: account,
      txInfo,
    });
    expect(Buffer.from(tx, "hex")).toHaveLength(20);
  });

  it("should allow to build a transaction with op_return output", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);

    const { outputs } = await wallet.buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
      opReturnData: Buffer.from("charley loves heidi"),
    });

    expect(outputs.length).toBe(3);

    const [opReturnOutput] = outputs.filter(output => output.address === null);

    expect(opReturnOutput).toBeDefined();

    const [opType, message] = script.decompile(opReturnOutput.script) as [number, Buffer];

    expect(opReturnOutput.isChange).toBe(false);
    expect(opReturnOutput.value.toNumber()).toBe(0);
    expect(opType).toEqual(script.OPS.OP_RETURN);
    expect(message.toString()).toEqual("charley loves heidi");

    const [valueTx] = outputs.filter(output => output.value.eq(100000));
    expect(valueTx).toBeDefined();
    expect(valueTx.address).toBe(receiveAddress.address);
  });

  it("should allow to build a transaction splitting outputs", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    account.xpub.OUTPUT_VALUE_MAX = 60000;
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);
    const txInfo = await wallet.buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
    });
    const tx = await wallet.signAccountTx({
      btc: new MockBtcSigner(),
      fromAccount: account,
      txInfo,
    });
    expect(Buffer.from(tx, "hex")).toHaveLength(20);
  });
});
