import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { firstValueFrom } from "rxjs";
import { makeGetAccountShape } from "../../synchronisation";

import {
  createFixtureAccount,
  mockSigner,
  mockSignerContext,
} from "../../fixtures/common.fixtures";
import type { SignerContext } from "../../signer";
import { BitcoinAccount } from "../../types";
import type { CoinConfig } from "../../config";

const coinConfig: CoinConfig = () => ({ info: { status: { type: "active" }, explorerId: "btc" } });

jest.setTimeout(10000);

jest.mock("@ledgerhq/wallet-btc/explorer/index", () => {
  const Actual = jest.requireActual("@ledgerhq/wallet-btc/explorer/index").default;
  return {
    __esModule: true,
    default: class MockBitcoinLikeExplorer extends Actual {
      getCurrentBlock = jest.fn().mockResolvedValue({ height: 0, hash: "0", time: "0" });
      getTxsSinceBlockheight = jest.fn().mockResolvedValue({ txs: [], nextPageToken: null });
    },
  };
});

describe("synchronisation", () => {
  it("should return a function", () => {
    const result = makeGetAccountShape(mockSignerContext, coinConfig);
    expect(typeof result).toBe("function");
  });

  it("should return an account shape with the correct properties", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext, coinConfig);
    const mockAccount = createFixtureAccount();
    mockAccount.id =
      "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:native_segwit";
    const result = await firstValueFrom(
      getAccountShape(
        {
          currency: getCryptoCurrencyById("bitcoin"),
          address: "0x123",
          index: 1,
          derivationPath: "m/44'/0'/0'/0/1",
          derivationMode: "taproot",
          initialAccount: mockAccount,
        },
        { paginationConfig: {} },
      ),
    );
    expect(result).toMatchObject({
      bitcoinResources: {
        utxos: [],
        walletAccount: {
          params: {
            currency: "bitcoin",
            derivationMode: "Taproot",
            index: 1,
            network: "mainnet",
            path: "m/44'",
            xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
          },
          xpub: {
            GAP: 20,
            OUTPUT_VALUE_MAX: 9007199254740991,
            derivationMode: "Taproot",
            explorer: { baseUrl: "https://explorers.api.live.ledger.com/blockchain/v4/btc" },
            freshAddress: "bc1pusjmg6xjpym8t8rvdw5gyx2mxvqj0l439acqzy2ssv546k857svqdnth09",
            freshAddressIndex: 0,
            txsSyncArraySize: 1000,
            xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
          },
        },
      },
      freshAddress: "bc1pusjmg6xjpym8t8rvdw5gyx2mxvqj0l439acqzy2ssv546k857svqdnth09",
      freshAddressPath: "m/44'/1'/0/0",
      id: "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:taproot",
      operations: [],
      operationsCount: 0,
      xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
    });
  });

  it("returns an Observable that errors when deviceId is missing and xpub must be generated", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext, coinConfig);
    const observable = getAccountShape(
      /* @ts-expect-error intentional invalid arg */
      {
        currency: getCryptoCurrencyById("bitcoin"),
        address: "0x123",
        index: 0,
        derivationPath: "m/44'/0'",
        derivationMode: "native_segwit",
        deviceId: undefined,
      },
      { paginationConfig: {} },
    );
    await expect(firstValueFrom(observable)).rejects.toThrow(
      "deviceId required to generate the xpub",
    );
  });

  it.each([
    ["bitcoin", 0x0488_b21e],
    ["bitcoin_testnet", 0x0435_87cf],
    ["litecoin", 0x019d_a462],
  ])(
    "asks the device for a %s xpub with that network's version bytes",
    async (currencyId, expectedXpubVersion) => {
      const getWalletXpub = jest.fn().mockRejectedValue(new Error("stop after xpub request"));
      const signerContext: SignerContext = (_deviceId, _crypto, fn) =>
        fn({ ...mockSigner, getWalletXpub });
      const getAccountShape = makeGetAccountShape(signerContext, coinConfig);

      await expect(
        firstValueFrom(
          getAccountShape(
            {
              currency: getCryptoCurrencyById(currencyId),
              address: "0x123",
              index: 0,
              derivationPath: "m/84'/1'/0'/0/0",
              derivationMode: "native_segwit",
              deviceId: "device",
            },
            { paginationConfig: {} },
          ),
        ),
      ).rejects.toThrow("stop after xpub request");
      expect(getWalletXpub).toHaveBeenCalledWith(
        expect.objectContaining({ xpubVersion: expectedXpubVersion }),
      );
    },
  );

  it("returns an Observable that emits exactly one value then completes", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext, coinConfig);
    const mockAccount = createFixtureAccount();
    mockAccount.id =
      "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:native_segwit";
    const observable = getAccountShape(
      {
        currency: getCryptoCurrencyById("bitcoin"),
        address: "0x123",
        index: 1,
        derivationPath: "m/44'/0'/0'/0/1",
        derivationMode: "taproot",
        initialAccount: mockAccount,
      },
      { paginationConfig: {} },
    );
    const nextCalls: Partial<BitcoinAccount>[] = [];
    let completed = false;
    let error: unknown;
    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: value => nextCalls.push(value),
        complete: () => {
          completed = true;
          resolve();
        },
        error: e => {
          error = e;
          reject(e);
        },
      });
    });
    expect(nextCalls).toHaveLength(1);
    expect(completed).toBe(true);
    expect(error).toBeUndefined();
  });
});
