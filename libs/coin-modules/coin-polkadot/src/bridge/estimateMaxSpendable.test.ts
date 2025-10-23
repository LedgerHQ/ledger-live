/* eslint-disable @typescript-eslint/consistent-type-assertions */

import * as account from "@ledgerhq/coin-framework/account";
import { PolkadotAccount, Transaction } from "../types";
import * as getEstimatedFees from "./getFeesForTransaction";
import BigNumber from "bignumber.js";
import * as utils from "./utils";
import estimateMaxSpendable from "./estimateMaxSpendable";
import type { AccountLike } from "@ledgerhq/types-live";

describe("estimateMaxSpendable", () => {
  it("should return the maximum spendable for a transaction", async () => {
    jest.spyOn(account, "getMainAccount").mockReturnValue({} as PolkadotAccount);
    jest.spyOn(getEstimatedFees, "default").mockResolvedValueOnce(new BigNumber(1));

    const computedAmount = new BigNumber(2);
    jest.spyOn(utils, "calculateAmount").mockReturnValueOnce(computedAmount);

    const transaction = {} as Transaction;
    const maximumSpendable = await estimateMaxSpendable({
      account: {} as AccountLike,
      parentAccount: null,
      transaction,
    });

    expect(maximumSpendable).toEqual(computedAmount);
  });
});
