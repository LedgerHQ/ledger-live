import "../../../__tests__/test-helpers/setup";
import { fetchFullTxs } from "../bridge/utils/api";
import flatMap from "lodash/flatMap";
import { mapTxToOps } from "../bridge/utils/misc";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "../../../account";

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
    const rawTxs = await fetchFullTxs(address);

    // Contains operations for txn of type token_transfer
    const operations = flatMap(rawTxs, mapTxToOps(accountId, { address } as AccountShapeInfo));

    expect(operations.length).toBeTruthy();
  });
});
