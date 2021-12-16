import {
  toHederaResourcesRaw,
  fromHederaResourcesRaw,
} from "../../../families/hedera/serialization";
import type {
  HederaResources,
  HederaResourcesRaw,
} from "../../../families/hedera/types";
import { AccountId } from "@hashgraph/sdk";

describe("serialization", () => {
  test("toHederaResourcesRaw", () => {
    const hederaResources: HederaResources = {
      accountId: new AccountId(3),
    };

    const data = { accountId: hederaResources.accountId.toString() };
    const result = toHederaResourcesRaw(hederaResources);

    expect(result).toEqual(data);
  });

  test("fromHederaResourcesRaw", () => {
    const hederaResourcesRaw: HederaResourcesRaw = {
      accountId: "0.0.3",
    };

    const data = {
      accountId: AccountId.fromString(hederaResourcesRaw.accountId),
    };
    const result = fromHederaResourcesRaw(hederaResourcesRaw);

    expect(result).toEqual(data);
  });
});
