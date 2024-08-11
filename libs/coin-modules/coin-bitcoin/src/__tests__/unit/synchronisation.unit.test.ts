import { makeGetAccountShape } from "../../synchronisation";

import { createFixtureAccount, mockCryptoCurrency, mockSignerContext } from "../fixtures/common.fixtures";

// jest.mock("@ledgerhq/live-common/lib/account", () => ({
//   getAccountCurrency: jest.fn(),
//   getAccountUnit: jest.fn(),
// }));

const mockStartSpan = jest.fn().mockReturnValue({
  finish: jest.fn(),
});
describe("synchronisation", () => {
  it("should return a function", () => {
    const result = makeGetAccountShape(mockSignerContext, mockStartSpan);
    expect(typeof result).toBe("function");
  });

  it("should return an account shape with the correct properties", async () => {
    const getAccountShape = makeGetAccountShape(mockSignerContext, mockStartSpan);
    // getAccountCurrency.mockReturnValue({ ticker: "BTC" });
    // getAccountUnit.mockReturnValue({ magnitude: 8 });
    const mockAccount = createFixtureAccount();
    mockAccount.id =
      "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:native_segwit";
    const result = await getAccountShape(
      {
        currency: mockCryptoCurrency,
        address: "0x123",
        index: 1,
        derivationPath: "m/44'/0'/0'/0/1",
        derivationMode: "taproot",
        initialAccount: mockAccount,
      },
      { paginationConfig: {} },
    );
    console.log({ result });
    expect(result).toMatchObject({
      // balance: "0",
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
            // crypto: { network: [Object] },
            // currentBlockHeight: 855786,
            derivationMode: "Taproot",
            explorer: { baseUrl: "https://explorers.api.live.ledger.com/blockchain/v4/btc" },
            freshAddress: "bc1pusjmg6xjpym8t8rvdw5gyx2mxvqj0l439acqzy2ssv546k857svqdnth09",
            freshAddressIndex: 0,
            // storage: {
            //   accountIndex: [Object],
            //   addressCache: [Object],
            //   primaryIndex: [Object],
            //   spentUtxos: [Object],
            //   txs: [Array],
            //   unspentUtxos: [Object],
            // },
            // syncedBlockHeight: 855786,
            txsSyncArraySize: 1000,
            xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
          },
        },
      },
      // blockHeight: 855786,
      freshAddress: "bc1pusjmg6xjpym8t8rvdw5gyx2mxvqj0l439acqzy2ssv546k857svqdnth09",
      freshAddressPath: "m/44'/1'/0/0",
      id: "js:2:bitcoin:xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB:taproot",
      operations: [],
      operationsCount: 0,
      // spendableBalance: "0",
      xpub: "xpub6DM4oxVnZiePFvQMu1RJLQwWUzZQP3UNaLqrGcbJQkAJZYdiRoRivHULWoYN3zBYU4mJRpM3WrGaqo1kS8Q2XFfd9E3QEc9P3MKHwbHz9LB",
    });
  });
});
