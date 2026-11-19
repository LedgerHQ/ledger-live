import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { generateHistoryFromOperations } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import { firstValueFrom } from "rxjs";
import { scanAccounts } from "./mockHelpers";

describe("mock scanAccounts", () => {
  it("builds the balance history from the operation dates it returns", async () => {
    const { account } = await firstValueFrom(
      scanAccounts({
        currency: getCryptoCurrencyById("bitcoin"),
        deviceId: "",
        syncConfig: { paginationConfig: {} },
      }),
    );

    expect(account.operations.length).toBeGreaterThan(0);
    expect(account.balanceHistoryCache).toEqual(generateHistoryFromOperations(account));
  });
});
