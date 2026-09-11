import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { BalanceTypeConfig } from "@ledgerhq/live-common/bridge/descriptor/types";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { getSelectedBalanceTypeBalance } from "./getSelectedBalanceTypeBalance";

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));

const getBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);

const account = {
  type: "Account",
  currency: { id: "zcash" },
  balance: new BigNumber(1000),
  spendableBalance: new BigNumber(1000),
} as unknown as AccountLike;

const poolConfig = (selectedId: string | null): BalanceTypeConfig => ({
  getOptions: () => [
    {
      id: "public",
      translationKey: "balanceType.transparent",
      balance: new BigNumber(300),
      hasPendingBalance: false,
      icon: "check",
    },
    {
      id: "private",
      translationKey: "balanceType.shielded",
      balance: new BigNumber(700),
      hasPendingBalance: false,
      icon: "lock",
    },
  ],
  getSelectedOptionId: () => selectedId,
  buildSelectionPatch: () => ({}),
  getSelfTransferTarget: () => null,
  getSelectableBalance: ({ optionId }) =>
    optionId === "private" ? new BigNumber(700) : new BigNumber(300),
});

describe("getSelectedBalanceTypeBalance", () => {
  beforeEach(() => jest.resetAllMocks());

  it.each([
    ["public", 300],
    ["private", 700],
  ])("returns the balance of the %s pool the transaction draws from", (selectedId, expected) => {
    getBalanceTypeConfig.mockReturnValue(poolConfig(selectedId));

    expect(getSelectedBalanceTypeBalance(account, { family: "zcash" })).toEqual(
      new BigNumber(expected),
    );
  });

  it("returns undefined for a coin holding a single balance", () => {
    getBalanceTypeConfig.mockReturnValue(null);

    expect(getSelectedBalanceTypeBalance(account, { family: "bitcoin" })).toBeUndefined();
  });

  it("returns undefined until the user picks a pool", () => {
    getBalanceTypeConfig.mockReturnValue(poolConfig(null));

    expect(getSelectedBalanceTypeBalance(account, { family: "zcash" })).toBeUndefined();
  });

  it("returns undefined when the selected pool is not among the account's", () => {
    getBalanceTypeConfig.mockReturnValue(poolConfig("unknown"));

    expect(getSelectedBalanceTypeBalance(account, { family: "zcash" })).toBeUndefined();
  });

  it.each([
    ["no account", null, { family: "zcash" }],
    ["no transaction", account, undefined],
  ])("returns undefined with %s", (_label, acc, transaction) => {
    expect(getSelectedBalanceTypeBalance(acc, transaction)).toBeUndefined();
  });
});
