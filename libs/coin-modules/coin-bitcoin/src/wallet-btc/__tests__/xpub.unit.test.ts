import { BigNumber } from "bignumber.js";

import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

import Xpub from "../xpub";
import { Output } from "../storage/types";
import { DerivationModes } from "../types";
import BitcoinLikeExplorer from "../explorer";

import { mockCrypto, mockStorage } from "./fixtures/common.fixtures";

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  computeDustAmount: jest.fn().mockReturnValue(50),
}));

describe("Xpub", () => {
  let xpub: Xpub;
  const DERIVATION_MODE = DerivationModes.TAPROOT;
  const bitcoinCryptoCurrency = getCryptoCurrencyById("bitcoin");
  const mockExplorer = new BitcoinLikeExplorer({ cryptoCurrency: bitcoinCryptoCurrency });

  beforeEach(() => {
    xpub = new Xpub({
      storage: mockStorage,
      explorer: mockExplorer,
      crypto: mockCrypto,
      xpub: "test-xpub",
      derivationMode: DERIVATION_MODE,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("syncAddress", async () => {
    mockCrypto.getAddress.mockResolvedValue("address1");
    mockStorage.hasPendingTx.mockReturnValue(false);
    mockStorage.hasTx.mockReturnValue(true);

    const result = await xpub.syncAddress(0, 0, false);

    expect(mockCrypto.getAddress).toHaveBeenCalledWith(DERIVATION_MODE, "test-xpub", 0, 0);
    expect(mockStorage.addAddress).toHaveBeenCalled();
    expect(mockStorage.hasPendingTx).toHaveBeenCalled();
    expect(mockStorage.hasTx).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test("checkAddressesBlock", async () => {
    jest.spyOn(xpub, "syncAddress").mockResolvedValue(true);

    const result = await xpub.checkAddressesBlock(0, 0, false);

    expect(xpub.syncAddress).toHaveBeenCalledTimes(xpub.GAP);
    expect(result).toBe(true);
  });

  test("syncAccount", async () => {
    jest
      .spyOn(xpub, "checkAddressesBlock")
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await xpub.syncAccount(0, false);

    expect(xpub.checkAddressesBlock).toHaveBeenCalled();
    expect(result).toBe(xpub.GAP);
  });

  test("sync", async () => {
    mockStorage.getHighestBlockHeightAndHash.mockReturnValue(null);
    jest.spyOn(xpub, "syncAccount").mockResolvedValue(0);
    mockCrypto.getAddress.mockResolvedValue("fresh-address");

    await xpub.sync();

    expect(mockStorage.getHighestBlockHeightAndHash).toHaveBeenCalled();
    expect(xpub.syncAccount).toHaveBeenCalledTimes(2);
    expect(mockCrypto.getAddress).toHaveBeenCalledWith(DERIVATION_MODE, "test-xpub", 0, 0);
    expect(xpub.freshAddress).toBe("fresh-address");
  });

  test("getXpubBalance", async () => {
    const addresses = [{ address: "address1", account: 0, index: 0 }];
    jest.spyOn(xpub, "getXpubAddresses").mockResolvedValue(addresses);
    jest.spyOn(xpub, "getAddressesBalance").mockResolvedValue(new BigNumber(100));

    const balance = await xpub.getXpubBalance();

    expect(xpub.getXpubAddresses).toHaveBeenCalled();
    expect(xpub.getAddressesBalance).toHaveBeenCalledWith(addresses);
    expect(balance.toNumber()).toBe(100);
  });

  test("getAccountBalance", async () => {
    const addresses = [{ address: "address1", account: 0, index: 0 }];
    jest.spyOn(xpub, "getAccountAddresses").mockResolvedValue(addresses);
    jest.spyOn(xpub, "getAddressesBalance").mockResolvedValue(new BigNumber(50));

    const balance = await xpub.getAccountBalance(0);

    expect(xpub.getAccountAddresses).toHaveBeenCalledWith(0);
    expect(xpub.getAddressesBalance).toHaveBeenCalledWith(addresses);
    expect(balance.toNumber()).toBe(50);
  });

  test("getAddressBalance", async () => {
    const address = { address: "address1", account: 0, index: 0 };
    const unspentUtxos: Output[] = [
      { value: "30", address: "", output_hash: "", output_index: 0, block_height: 0, rbf: false },
      { value: "20", address: "", output_hash: "", output_index: 0, block_height: 0, rbf: false },
    ];
    mockStorage.getAddressUnspentUtxos.mockReturnValue(unspentUtxos);

    const balance = await xpub.getAddressBalance(address);

    expect(mockStorage.getAddressUnspentUtxos).toHaveBeenCalledWith(address);
    expect(balance.toNumber()).toBe(50);
  });

  test("getNewAddress", async () => {
    const accountAddresses = [{ address: "address1", account: 0, index: 0 }];
    jest.spyOn(xpub, "getAccountAddresses").mockResolvedValue(accountAddresses);
    mockCrypto.getAddress.mockResolvedValue("new-address");

    const newAddress = await xpub.getNewAddress(0, 1);

    expect(xpub.getAccountAddresses).toHaveBeenCalledWith(0);
    expect(mockCrypto.getAddress).toHaveBeenCalledWith(DERIVATION_MODE, "test-xpub", 0, 1);
    expect(newAddress.address).toBe("new-address");
    expect(newAddress.index).toBe(1);
  });

  it("should build transaction correctly", async () => {
    mockCrypto.toOutputScript = jest.fn().mockReturnValue("outputScript");
    mockExplorer.getTxHex = jest.fn().mockResolvedValue("txHex");
    mockStorage.getTx = jest.fn().mockResolvedValue({ account: 0, index: 0 });

    const tx = await xpub.buildTx({
      destAddress: "destinationAddress",
      amount: new BigNumber(1000),
      feePerByte: 1,
      changeAddress: { address: "changeAddress", account: 0, index: 0 },
      utxoPickingStrategy: {
        crypto: mockCrypto,
        derivationMode: DERIVATION_MODE,
        excludedUTXOs: [],
        selectUnspentUtxosToUse: jest.fn().mockResolvedValue({
          totalValue: new BigNumber(2000),
          unspentUtxos: [
            {
              output_hash: "hash2",
              value: new BigNumber(1500),
              address: "address1",
              output_index: 0,
            },
          ],
          fee: new BigNumber(100),
          needChangeoutput: true,
        }),
      },
      sequence: 0,
      opReturnData: undefined,
    });

    expect(tx.inputs.length).toBe(1);
    expect(tx.outputs.length).toBe(2); // one for destAddres, one for change
    expect(tx.fee).toBe(100);
  });
});
