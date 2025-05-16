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

  it("should not store the same transaction twice if it's both pending and confirmed", async () => {
    const fakeTx = {
      id: "duplicate-tx",
      inputs: [],
      outputs: [],
      account: 0,
      index: 0,
      address: "address1",
      received_at: new Date().toISOString(),
      block: null,
    };

    const confirmedTx = {
      ...fakeTx,
      block: {
        hash: "some-block-hash",
        height: 123,
        time: new Date().toISOString(),
      },
    };

    // Let sync run
    const xpub = mockAccount.xpub;
    xpub.GAP = 1;

    // Mock getBlockByHeight to match highestBlockHash check
    xpub.explorer.getBlockByHeight = jest.fn().mockResolvedValue(confirmedTx.block);

    // Force synced block height
    xpub.currentBlockHeight = 123;
    xpub.syncedBlockHeight = -1;

    // Mock unique address for sync
    xpub.crypto.getAddress = jest.fn().mockImplementation((_mode, _xpub, account, index) => {
      if (account === 0 && index === 0) return "address1";
      return `unused-${account}-${index}`;
    });
    // xpub.crypto.getAddress = jest.fn().mockResolvedValue("address1");
    xpub.getXpubAddresses = jest
      .fn()
      .mockResolvedValue([{ address: "address1", account: 0, index: 0 }]);

    // Mock explorer tx fetch
    xpub.explorer.getTxsSinceBlockheight = jest
      .fn()
      .mockImplementation((_size, addr, _from, _to, isPending, _token) => {
        if (addr.address === "address1") {
          if (isPending) {
            return Promise.resolve({ txs: [fakeTx], nextPageToken: null });
          } else {
            return Promise.resolve({ txs: [confirmedTx], nextPageToken: null });
          }
        }
        return Promise.resolve({ txs: [], nextPageToken: null });
      });

    await xpub.sync();

    // ✅ Ensure wallet returns only that one deduplicated transaction
    const transactions = await wallet.getAccountTransactions(mockAccount);
    const txsFromWallet = transactions.txs.filter(tx => tx.id === "duplicate-tx");
    expect(txsFromWallet).toHaveLength(1);
    expect(txsFromWallet[0].block).toEqual(confirmedTx.block);
  });

  it("should replace pending tx with confirmed one if both are fetched over two syncs", async () => {
    const now = new Date().toISOString();
    const pendingTx = {
      id: "duplicate-tx",
      inputs: [],
      outputs: [],
      account: 0,
      index: 0,
      address: "address1",
      received_at: now,
      block: null,
    };

    const confirmedTx = {
      ...pendingTx,
      block: {
        hash: "some-block-hash",
        height: 123,
        time: now,
      },
    };

    const xpub = mockAccount.xpub;
    xpub.GAP = 1;
    xpub.currentBlockHeight = 123;
    xpub.syncedBlockHeight = -1;

    xpub.crypto.getAddress = jest.fn().mockImplementation((_mode, _xpub, account, index) => {
      if (account === 0 && index === 0) return "address1";
      return `unused-${account}-${index}`;
    });

    xpub.getXpubAddresses = jest
      .fn()
      .mockResolvedValue([{ address: "address1", account: 0, index: 0 }]);

    xpub.explorer.getBlockByHeight = jest.fn().mockResolvedValue(confirmedTx.block);

    // Simulate first sync returning only pending
    let syncRound = 0;
    xpub.explorer.getTxsSinceBlockheight = jest
      .fn()
      .mockImplementation((_size, addr, _from, _to, isPending, _token) => {
        if (addr.address !== "address1") return Promise.resolve({ txs: [], nextPageToken: null });

        if (syncRound === 0) {
          return isPending
            ? Promise.resolve({ txs: [pendingTx], nextPageToken: null })
            : Promise.resolve({ txs: [], nextPageToken: null });
        } else {
          return isPending
            ? Promise.resolve({ txs: [pendingTx], nextPageToken: null })
            : Promise.resolve({ txs: [confirmedTx], nextPageToken: null });
        }
      });

    const appendSpy = jest.spyOn(xpub.storage, "appendTxs");

    // First sync with pending only
    await xpub.sync();
    expect(appendSpy).toHaveBeenCalled();

    // Clear calls and simulate next sync with both versions
    appendSpy.mockClear();
    syncRound = 1;
    await xpub.sync();

    // Optional: check wallet.getAccountTransactions reflects correct result
    const transactions = await wallet.getAccountTransactions(mockAccount);
    const txsFromWallet = transactions.txs.filter(tx => tx.id === "duplicate-tx");
    expect(txsFromWallet).toHaveLength(1);
    expect(txsFromWallet[0].block).toEqual(confirmedTx.block);
  });

  it("should remove the pending tx after it gets confirmed on resync", async () => {
    const now = new Date().toISOString();

    const pendingTx = {
      id: "tx-duplicate",
      inputs: [],
      outputs: [],
      account: 0,
      index: 0,
      address: "some-address",
      received_at: now,
      block: null,
    };

    const confirmedTx = {
      ...pendingTx,
      block: {
        hash: "block123",
        height: 42,
        time: now,
      },
    };

    const xpub = mockAccount.xpub;
    xpub.GAP = 1;
    xpub.getXpubAddresses = jest
      .fn()
      .mockResolvedValue([{ address: "some-address", account: 0, index: 0 }]);
    xpub.crypto.getAddress = jest.fn().mockImplementation(() => "some-address");
    xpub.currentBlockHeight = 42;
    xpub.syncedBlockHeight = -1;

    xpub.explorer.getBlockByHeight = jest.fn().mockResolvedValue(confirmedTx.block);

    let syncRound = 0;

    xpub.explorer.getTxsSinceBlockheight = jest
      .fn()
      .mockImplementation((_size, addr, _from, _to, isPending) => {
        if (addr.address === "some-address") {
          if (syncRound === 0) {
            return Promise.resolve({ txs: [pendingTx], nextPageToken: null });
          } else {
            return Promise.resolve({
              txs: isPending ? [pendingTx] : [confirmedTx],
              nextPageToken: null,
            });
          }
        }
        return Promise.resolve({ txs: [], nextPageToken: null });
      });

    const appendSpy = jest.spyOn(xpub.storage, "appendTxs");

    // First sync with only pending
    await xpub.sync();
    expect(appendSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ block: null })]),
    );

    // Second sync, simulate confirmed coming in
    syncRound = 1;
    await xpub.sync();

    // Check that storage doesn't hold both
    const storedTxs = xpub.storage.getTxs();
    const duplicates = storedTxs.filter(tx => tx.id === "tx-duplicate");
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].block).toEqual(confirmedTx.block);
  });

  describe("estimateAccountMaxSpendable", () => {
    const addresses = [{ address: "address1", account: 0, index: 0 }] as Address[];

    const UTXO_VALUES = {
      utxo1: 500,
      utxo2: 200,
      utxo3: 100,
    };
    const utxos: Output[] = [
      {
        value: `${UTXO_VALUES.utxo1}`,
        address: "address1",
        output_hash: "hash1",
        output_index: 0,
        block_height: 1000,
      },
    ] as Output[];

    beforeEach(() => {
      // Set up mocks for addresses and UTXOs
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
    });

    it("estimate fees for one utxo", async () => {
      // NOTE: setting the feePerByte to 0 to avoid the fee calculation
      const maxSpendable = await wallet.estimateAccountMaxSpendable(mockAccount, 0, []);

      expect(mockAccount.xpub.getXpubAddresses).toHaveBeenCalled();
      expect(mockAccount.xpub.getAccountAddresses).toHaveBeenCalledWith(1);
      expect(maxSpendable.toNumber()).toEqual(UTXO_VALUES.utxo1);
    });

    it("estimate fees when one of the utxos is a change address", async () => {
      // NOTE: unconfirmed utxos with an address in the account's change addresses set are usable
      const utxosWithChangeAddress = [
        ...utxos,
        {
          value: `${UTXO_VALUES.utxo2}`,
          address: "address2", // change address, the utxo will be usable
          output_hash: "hash2",
          output_index: 1,
          block_height: null,
        },
      ] as Output[];

      mockAccount.xpub.storage.getAddressUnspentUtxos = jest
        .fn()
        .mockResolvedValue(utxosWithChangeAddress);
      const maxSpendableWithChangeAddressUtxo = await wallet.estimateAccountMaxSpendable(
        mockAccount,
        0,
        [],
      );
      expect(maxSpendableWithChangeAddressUtxo.toNumber()).toEqual(
        UTXO_VALUES.utxo1 + UTXO_VALUES.utxo2,
      );
    });

    it("estimate fees when one of the utxos is unconfirmed", async () => {
      const utxosWithUnconfirmedTx = [
        ...utxos,
        {
          value: `${UTXO_VALUES.utxo3}`,
          address: "address3notchange", // not a change address
          output_hash: "hash3",
          output_index: 3,
          block_height: null,
        },
      ] as Output[];
      mockAccount.xpub.storage.getAddressUnspentUtxos = jest
        .fn()
        .mockResolvedValue(utxosWithUnconfirmedTx);
      const maxSpendableWithUnconfirmedTx = await wallet.estimateAccountMaxSpendable(
        mockAccount,
        0,
        [],
      );
      expect(maxSpendableWithUnconfirmedTx.toNumber()).toEqual(UTXO_VALUES.utxo1);
    });
  });
});
