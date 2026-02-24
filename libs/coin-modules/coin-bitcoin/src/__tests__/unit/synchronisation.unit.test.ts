import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { firstValueFrom } from "rxjs";
import { makeGetAccountShape } from "../../synchronisation";

import { createFixtureAccount, mockSignerContext } from "../../fixtures/common.fixtures";
import { BitcoinAccount } from "../../types";

jest.setTimeout(10000);

describe("synchronisation", () => {
  it("should return a function", () => {
    const result = makeGetAccountShape(mockSignerContext);
    expect(typeof result).toBe("function");
  });

  it("should return an account shape with the correct properties", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext);
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
    const getAccountShape = makeGetAccountShape(mockSignerContext);
    const observable = getAccountShape(
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

  it("returns an Observable that emits exactly one value then completes", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext);
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
