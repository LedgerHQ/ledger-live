import BigNumber from "bignumber.js";

import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

import BitcoinLikeWallet from "../wallet";
import { Account } from "../account";
import Xpub from "../xpub";
import { PickingStrategy } from "../pickingstrategies/types";
import { TX, Address, Output } from "../storage/types";
import { DerivationModes, TransactionInfo } from "../types";

import { getMockAccount } from "./fixtures/common.fixtures";
import { mockSigner } from "../../__tests__/fixtures/common.fixtures";

jest.mock("../explorer");
jest.mock("../crypto/factory");

const DERIVATION_MODE = DerivationModes.TAPROOT;

const bitcoinCryptoCurrency = getCryptoCurrencyById("bitcoin");

describe("BitcoinLikeWallet", () => {
  let wallet: BitcoinLikeWallet;
  let mockAccount: Account;

  beforeEach(() => {
    wallet = new BitcoinLikeWallet();
    mockAccount = getMockAccount(DERIVATION_MODE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("generateAccount", async () => {
    const params = {
      xpub: "test-xpub",
      path: "test-path",
      index: 0,
      currency: "bitcoin",
      network: "mainnet",
      derivationMode: DERIVATION_MODE,
    } as const;

    const account = await wallet.generateAccount(params, bitcoinCryptoCurrency);

    expect(account.params).toEqual(params);
    expect(account.xpub).toBeInstanceOf(Xpub);
  });

  test("syncAccount", async () => {
    mockAccount.xpub.sync = jest.fn().mockResolvedValue(undefined);
  });

  test("syncAccount", async () => {
    mockAccount.xpub.sync = jest.fn().mockResolvedValue(undefined);

    await wallet.syncAccount(mockAccount, 1000);

    expect(mockAccount.xpub.sync).toHaveBeenCalled();
    expect(mockAccount.xpub.currentBlockHeight).toBe(1000);
    expect(mockAccount.xpub.syncedBlockHeight).toBe(1000);
  });

  test("getAccountNewReceiveAddress", async () => {
    const newAddress = { address: "new-receive-address", account: 0, index: 1 } as Address;
    mockAccount.xpub.getNewAddress = jest.fn().mockResolvedValue(newAddress);

    const address = await wallet.getAccountNewReceiveAddress(mockAccount);

    expect(mockAccount.xpub.getNewAddress).toHaveBeenCalledWith(0, 1);
    expect(address).toEqual(newAddress);
  });

  test("getAccountNewChangeAddress", async () => {
    const newAddress = { address: "new-change-address", account: 1, index: 1 } as Address;
    mockAccount.xpub.getNewAddress = jest.fn().mockResolvedValue(newAddress);

    const address = await wallet.getAccountNewChangeAddress(mockAccount);

    expect(mockAccount.xpub.getNewAddress).toHaveBeenCalledWith(1, 1);
    expect(address).toEqual(newAddress);
  });

  test("getAccountTransactions", async () => {
    const txs = { txs: [{ hash: "tx1" }, { hash: "tx2" }] as TX[] };
    mockAccount.xpub.storage.export = jest.fn().mockResolvedValue(txs);

    const transactions = await wallet.getAccountTransactions(mockAccount);

    expect(mockAccount.xpub.storage.export).toHaveBeenCalled();
    expect(transactions).toEqual(txs);
  });

  test("getAccountUnspentUtxos", async () => {
    const addresses = [{ address: "address1", account: 0, index: 0 }] as Address[];
    const utxos = [{ value: "10" }] as Output[];
    mockAccount.xpub.getXpubAddresses = jest.fn().mockResolvedValue(addresses);
    mockAccount.xpub.storage.getAddressUnspentUtxos = jest.fn().mockResolvedValue(utxos);

    const unspentUtxos = await wallet.getAccountUnspentUtxos(mockAccount);

    expect(mockAccount.xpub.getXpubAddresses).toHaveBeenCalled();
    expect(mockAccount.xpub.storage.getAddressUnspentUtxos).toHaveBeenCalledWith(addresses[0]);
    expect(unspentUtxos).toEqual(utxos);
  });

  test("estimateAccountMaxSpendable", async () => {
    const addresses = [{ address: "address1", account: 0, index: 0 }] as Address[];
    const utxos = [
      {
        value: "500",
        address: "address1",
        output_hash: "hash1",
        output_index: 0,
        block_height: 1000,
      },
      {
        value: "200",
        address: "address2",
        output_hash: "hash2",
        output_index: 1,
        block_height: null,
      },
    ] as Output[];
    mockAccount.xpub.getXpubAddresses = jest.fn().mockResolvedValue(addresses);
    mockAccount.xpub.getAccountAddresses = jest
      .fn()
      .mockResolvedValue([{ address: "address2", account: 1, index: 1 }] as Address[]);
    mockAccount.xpub.storage.getAddressUnspentUtxos = jest.fn().mockResolvedValue(utxos);
    mockAccount.xpub.crypto.toOutputScript = jest
      .fn()
      .mockReturnValue(Buffer.from("output-script"));
    mockAccount.xpub.crypto.toOpReturnOutputScript = jest
      .fn()
      .mockReturnValue(Buffer.from("op-return-script"));

    const maxSpendable = await wallet.estimateAccountMaxSpendable(mockAccount, 1, []);

    expect(mockAccount.xpub.getXpubAddresses).toHaveBeenCalled();
    expect(mockAccount.xpub.getAccountAddresses).toHaveBeenCalledWith(1);
    expect(maxSpendable.toNumber()).toBeGreaterThan(0);
  });

  test("getAccountBalance", async () => {
    const balance = new BigNumber(100);
    mockAccount.xpub.getXpubBalance = jest.fn().mockResolvedValue(balance);

    const accountBalance = await wallet.getAccountBalance(mockAccount);

    expect(mockAccount.xpub.getXpubBalance).toHaveBeenCalled();
    expect(accountBalance).toEqual(balance);
  });

  test("getAccountPendings", async () => {
    const addresses = [{ address: "address1", account: 0, index: 0 }] as Address[];
    const pendings = [{ hash: "pending1" }, { hash: "pending2" }] as TX[];
    mockAccount.xpub.getXpubAddresses = jest.fn().mockResolvedValue(addresses);
    mockAccount.xpub.explorer.getPendings = jest.fn().mockResolvedValue(pendings);

    const pendingTxs = await wallet.getAccountPendings(mockAccount);

    expect(mockAccount.xpub.getXpubAddresses).toHaveBeenCalled();
    expect(mockAccount.xpub.explorer.getPendings).toHaveBeenCalledWith({
      account: 0,
      address: "address1",
      index: 0,
    });
    expect(pendingTxs).toEqual(pendings);
  });

  test("buildAccountTx", async () => {
    const txInfo = {
      inputs: [],
      outputs: [],
      fee: 0,
      associatedDerivations: [],
      changeAddress: { address: "change-address", account: 1, index: 1 },
    } as TransactionInfo;
    mockAccount.xpub.buildTx = jest.fn().mockResolvedValue(txInfo);
    mockAccount.xpub.getNewAddress = jest
      .fn()
      .mockResolvedValue({ address: "change-address", account: 1, index: 1 } as Address);

    const params = {
      fromAccount: mockAccount,
      dest: "destination-address",
      amount: new BigNumber(10),
      feePerByte: 1,
      utxoPickingStrategy: {} as PickingStrategy,
      sequence: 0,
    };

    const transactionInfo = await wallet.buildAccountTx(params);

    expect(mockAccount.xpub.getNewAddress).toHaveBeenCalledWith(1, 1);
    expect(mockAccount.xpub.buildTx).toHaveBeenCalledWith({
      destAddress: params.dest,
      amount: params.amount,
      feePerByte: params.feePerByte,
      changeAddress: { address: "change-address", account: 1, index: 1 },
      utxoPickingStrategy: params.utxoPickingStrategy,
      sequence: params.sequence,
      opReturnData: undefined,
    });
    expect(transactionInfo).toEqual(txInfo);
  });

  it("should return the signature", async () => {
    const txInfo = {
      inputs: [],
      outputs: [],
      fee: 0,
      associatedDerivations: [],
      changeAddress: { address: "change-address", account: 1, index: 1 },
    } as TransactionInfo;

    const signature = await wallet.signAccountTx({
      btc: mockSigner,
      fromAccount: mockAccount,
      txInfo,
    });

    expect(signature).toBe("createPaymentTransactionReturn");
  });
});
