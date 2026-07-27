import storage from "LLM/storage";
import { getTransactionsAlertsAddressKey } from "@ledgerhq/live-common/transactionsAlerts/index";
import {
  clearStoredTransactionsAlertsAddresses,
  createTransactionsAlertsTargets,
  getStoredTransactionsAlertsAddresses,
  getStoredTransactionsAlertsState,
  storeTransactionsAlertsState,
  storeTransactionsAlertsAddresses,
} from "../transactionsAlerts";

const network = {
  ledgerLiveId: "avalanche_c_chain",
  chainwatchId: "avax",
  nbConfirmations: 1,
};

describe("transactions alerts storage", () => {
  beforeEach(async () => {
    await storage.deleteAll();
  });

  it("should persist deduplicated address records", async () => {
    await storeTransactionsAlertsAddresses([
      { currencyId: "ethereum", address: "0xAbCd" },
      { currencyId: "ethereum", address: "0xabcd" },
      { currencyId: "solana", address: "AbCd" },
    ]);

    const storedAddresses = await getStoredTransactionsAlertsAddresses();

    expect(
      storedAddresses
        .map(({ currencyId, address }) => getTransactionsAlertsAddressKey(currencyId, address))
        .sort(),
    ).toEqual(["ethereum:0xabcd", "solana:AbCd"]);
  });

  it("should ignore malformed stored data", async () => {
    await storage.save("transactionsAlerts.synchronizedAddresses", [{ currencyId: "ethereum" }]);

    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });

  it("should retain target metadata after the network is removed", async () => {
    await storeTransactionsAlertsState({
      targets: createTransactionsAlertsTargets(
        "https://chainwatch",
        [network],
        [{ currencyId: network.ledgerLiveId, address: "0x01" }],
      ),
    });

    await expect(getStoredTransactionsAlertsState("https://chainwatch", [])).resolves.toEqual({
      targets: [
        {
          chainwatchBaseUrl: "https://chainwatch",
          network,
          addresses: ["0x01"],
        },
      ],
    });
  });

  it("should clear persisted addresses", async () => {
    await storeTransactionsAlertsAddresses([{ currencyId: "ethereum", address: "0x01" }]);

    await clearStoredTransactionsAlertsAddresses();

    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });
});
