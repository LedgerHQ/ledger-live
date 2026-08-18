import BigNumber from "bignumber.js";
import { script } from "bitcoinjs-lib";
import BitcoinLikeWallet from "@ledgerhq/wallet-btc/wallet";
import { Account } from "@ledgerhq/wallet-btc/account";
import { Merge } from "@ledgerhq/wallet-btc/pickingstrategies/Merge";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { buildAccountTx, signAccountTx } from "../../buildAndSign";
import { walletBtcCurrencyById } from "../../walletBtcCurrency";
import { MockBtcSigner } from "../fixtures/mockBtcSigner";

jest.setTimeout(180000);

// Relocated from wallet-btc: buildAccountTx / signAccountTx moved to coin-bitcoin.
// The scan/sync engine still lives in @ledgerhq/wallet-btc and is consumed here.
describe("buildAccountTx / signAccountTx", () => {
  const wallet = new BitcoinLikeWallet();
  let account: Account;

  beforeAll(async () => {
    account = await wallet.generateAccount(
      {
        xpub: "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
        path: "44'/0'",
        index: 0,
        currency: "bitcoin",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      walletBtcCurrencyById("bitcoin"),
    );
    await wallet.syncAccount(account);
  });

  it("should allow to build a transaction", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);

    const txInfo = await buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
    });

    const tx = await signAccountTx({
      btc: new MockBtcSigner(),
      fromAccount: account,
      txInfo,
    });
    expect(Buffer.from(tx, "hex")).toHaveLength(20);
  });

  it("should allow to build a transaction with op_return output", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);

    const { outputs } = await buildAccountTx({
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

    const [opType, message] = script.decompile(opReturnOutput.script) as [number, Buffer];

    expect(opReturnOutput).toMatchObject({
      value: new BigNumber(0),
      isChange: false,
    });
    expect(opType).toEqual(script.OPS.OP_RETURN);
    expect(message.toString()).toEqual("charley loves heidi");

    const [valueTx] = outputs.filter(output => output.value.eq(100000));
    expect(valueTx.address).toBe(receiveAddress.address);
  });

  it("should allow to build a transaction splitting outputs", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    account.xpub.OUTPUT_VALUE_MAX = 60000;
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);
    const txInfo = await buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
    });
    const tx = await signAccountTx({
      btc: new MockBtcSigner(),
      fromAccount: account,
      txInfo,
    });
    expect(Buffer.from(tx, "hex")).toHaveLength(20);
  });

  it("should allow to build a transaction with changeAddress output", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);
    const changeAddress = await wallet.getAccountNewChangeAddress(account);

    const { outputs, changeAddress: changeAddressOutput } = await buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
      changeAddress: changeAddress.address,
    });

    expect(changeAddressOutput).toEqual(changeAddress);

    const [opReturnOutput] = outputs.filter(output => output.address === changeAddress.address);

    expect(opReturnOutput).toMatchObject({
      address: changeAddress.address,
      isChange: true,
    });
  });

  it("should throw error if wrong changeAddress", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(account.xpub.crypto, account.xpub.derivationMode, []);

    await expect(
      buildAccountTx({
        fromAccount: account,
        dest: receiveAddress.address,
        amount: new BigNumber(100000),
        feePerByte: 5,
        utxoPickingStrategy,
        sequence: 0,
        changeAddress: "wrongChangeAddress",
      }),
    ).rejects.toThrow("Invalid change address");
  });
});
