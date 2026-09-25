/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createTestStore } from "@tests/test-helpers/testUtils";
import { liveConfig } from "../../../config/sharedConfig";
import { hederaApi } from "./api";

describe("hederaApi.getValidators", () => {
  const currency = getCryptoCurrencyById("hedera");

  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
  });

  beforeEach(() => {
    getHederaValidators.reset();
    jest.spyOn(apiClient, "getNodes").mockResolvedValue({
      nodes: [
        {
          description: "Hosted by LG | Seoul, South Korea",
          node_id: 0,
          node_account_id: "0.0.3",
          stake: 45000000000000000,
          stake_rewarded: 86596417100000000,
          min_stake: 0,
          max_stake: 45000000000000000,
          reward_rate_start: 3500,
        },
        {
          description: "Hosted by Swirlds | Iowa, USA",
          node_id: 1,
          node_account_id: "0.0.4",
          stake: 45000000000000000,
          stake_rewarded: 88990261300000000,
          min_stake: 0,
          max_stake: 45000000000000000,
          reward_rate_start: 4000,
        },
      ],
      nextCursor: null,
    });
  });

  it("resolves validators without the coin-config registry being seeded", async () => {
    const store = createTestStore([hederaApi], { disableSerializableCheck: true });

    const result = await store.dispatch(hederaApi.endpoints.getValidators.initiate(currency.id));

    expect(result.error).toBeUndefined();
    expect(result.data?.map(validator => validator.id)).toEqual(["1", "0"]);
  });
});
