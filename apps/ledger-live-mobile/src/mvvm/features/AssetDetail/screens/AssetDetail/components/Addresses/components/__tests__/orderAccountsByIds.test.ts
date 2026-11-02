import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { orderAccountsByIds } from "../orderAccountsByIds";

const btc = getCryptoCurrencyById("bitcoin");

describe("orderAccountsByIds", () => {
  it("should follow the given id order when the source list is sorted differently", () => {
    const low = genAccount("asset-detail-low", { currency: btc });
    const high = genAccount("asset-detail-high", { currency: btc });

    const ordered = orderAccountsByIds([low, high], [high.id, low.id]);

    expect(ordered.map(account => account.id)).toEqual([high.id, low.id]);
  });
});
