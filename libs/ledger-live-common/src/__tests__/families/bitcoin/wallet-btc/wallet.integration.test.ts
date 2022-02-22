import BigNumber from "bignumber.js";
import { DerivationModes } from "../../../../families/bitcoin/wallet-btc/types";
import BitcoinLikeWallet from "../../../../families/bitcoin/wallet-btc/wallet";
import { Account } from "../../../../families/bitcoin/wallet-btc/account";
import { Merge } from "../../../../families/bitcoin/wallet-btc/pickingstrategies/Merge";
import MockBtc from "../../../../mock/Btc";

jest.setTimeout(180000);

describe("testing wallet", () => {
  const wallet = new BitcoinLikeWallet();
  let account: Account;
  it("should generate an account", async () => {
    account = await wallet.generateAccount({
      xpub: "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
      path: "44'/0'",
      index: 0,
      currency: "bitcoin",
      network: "mainnet",
      derivationMode: DerivationModes.LEGACY,
      explorer: "ledgerv3",
      explorerURI: "https://explorers.api.vault.ledger.com/blockchain/v3/btc",
      storage: "mock",
      storageParams: [],
    });

    expect(account.xpub.xpub).toEqual(
      "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP"
    );
  });

  it("should sync an account", async () => {
    await wallet.syncAccount(account);
    const balance = await wallet.getAccountBalance(account);

    expect(balance.toNumber()).toEqual(109088);
  });

  it("should allow to store and load an account", async () => {
    const serializedAccount = await wallet.exportToSerializedAccount(account);
    const unserializedAccount = await wallet.importFromSerializedAccount(
      serializedAccount
    );
    const balance = await wallet.getAccountBalance(unserializedAccount);
    expect(balance.toNumber()).toEqual(109088);
  });

  it("should allow to build a transaction", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    const utxoPickingStrategy = new Merge(
      account.xpub.crypto,
      account.xpub.derivationMode,
      []
    );
    const txInfo = await wallet.buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
    });
    const tx = await wallet.signAccountTx({
      btc: new MockBtc(),
      fromAccount: account,
      txInfo,
    });
    expect(Buffer.from(tx, "hex")).toHaveLength(20);
  });

  it("should allow to build a transaction splitting outputs", async () => {
    const receiveAddress = await wallet.getAccountNewReceiveAddress(account);
    account.xpub.OUTPUT_VALUE_MAX = 60000;
    const utxoPickingStrategy = new Merge(
      account.xpub.crypto,
      account.xpub.derivationMode,
      []
    );
    const txInfo = await wallet.buildAccountTx({
      fromAccount: account,
      dest: receiveAddress.address,
      amount: new BigNumber(100000),
      feePerByte: 5,
      utxoPickingStrategy,
      sequence: 0,
    });
    const tx = await wallet.signAccountTx({
      btc: new MockBtc(),
      fromAccount: account,
      txInfo,
    });
    expect(Buffer.from(tx, "hex")).toHaveLength(20);
  });

  it("should throw during sync if there is an error in explorer", async () => {
    const client = account.xpub.explorer.underlyingClient;
    // eslint-disable-next-line no-underscore-dangle
    const _get = client.get;
    client.get = async () => {
      throw new Error("coucou");
    };
    let thrown = false;
    try {
      await wallet.syncAccount(account);
    } catch (e) {
      thrown = true;
    }
    client.get = _get;
    expect(thrown).toEqual(true);
  });
});
