import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeGetAccountShape } from "../../synchronisation";
import wallet from "../../wallet-btc"; // for importFromSerializedAccountSync

import { createFixtureAccount, mockSignerContext } from "../fixtures/common.fixtures";

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
    const result = await getAccountShape(
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

    // storage snapshot should exist (opaque object)
    expect(typeof (result as any).bitcoinResources.walletAccount.xpub.data).toBe("object");

    // --- Deserialize to check runtime Xpub fields ---
    const serialized = (result as any).bitcoinResources.walletAccount;
    const live = wallet.importFromSerializedAccountSync(serialized);

    // spot-check a few runtime properties that only exist on live instances
    // expect(live.xpub.xpub).toBe(XPUB);
    expect(live.xpub.GAP).toBe(20);
    expect(live.xpub.OUTPUT_VALUE_MAX).toBe(Number.MAX_SAFE_INTEGER);
    expect(live.xpub.derivationMode).toBe("Taproot");
    expect(typeof live.xpub.explorer.baseUrl).toBe("string");
  });
});
