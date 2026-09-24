import { mapTxToOps } from "@ledgerhq/coin-stacks/bridge/utils/misc";
import { fetchFullTxs } from "@ledgerhq/coin-stacks/network/api";
import flatMap from "lodash/flatMap";
import "../../../__tests__/test-helpers/setup.integration";
import { encodeAccountId } from "../../../account";
import type { StacksCurrencyConfig } from "@ledgerhq/coin-stacks/config";
import { getCurrencyConfiguration } from "../../../config";

describe("sync for token transfers", () => {
  // Fetching txns for address with all types of transfers
  const address = "SP2BM6AQSMQ04CX8KDE62QBFVZTDZ2ZX80GZJSBZ4";
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "stacks",
    xpubOrAddress: "",
    derivationMode: "",
  });

  test("sync build operations only for transfer type txn", async () => {
    const [transfers] = await fetchFullTxs(
      getCurrencyConfiguration<StacksCurrencyConfig>("stacks"),
      address,
    );

    // Contains operations for txn of type token_transfer
    const operations = flatMap(transfers, mapTxToOps(accountId, address));

    expect(operations.length).toBeTruthy();
  });
});
