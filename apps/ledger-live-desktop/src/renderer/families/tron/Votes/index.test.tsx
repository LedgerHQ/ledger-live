import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { useTronEarnAction } from "../AccountDetailDelegations/useTronEarnAction";
import Votes from ".";

jest.mock("../AccountDetailDelegations/useTronEarnAction");
jest.mock("@ledgerhq/live-common/families/tron/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/tron/react"),
  useTronSuperRepresentatives: () => [],
}));

const mockEarnAction = jest.mocked(useTronEarnAction);
const startEarning = jest.fn();

type Resources = Partial<TronAccount["tronResources"]>;
type Vote = TronAccount["tronResources"]["votes"][number];

const accountWith = (resources: Resources = {}): TronAccount =>
  ({
    type: "Account",
    id: "tron-account",
    currency: getCryptoCurrencyById("tron"),
    spendableBalance: new BigNumber(1_000_000),
    operations: [],
    tronResources: {
      votes: [],
      tronPower: 0,
      unwithdrawnReward: new BigNumber(0),
      ...resources,
    },
  }) as unknown as TronAccount;

const partlyVotedAccount = accountWith({
  votes: [{ address: "sr-1", voteCount: 4 } as Vote],
  tronPower: 10,
});

describe("Tron Votes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEarnAction.mockReturnValue({ canEarn: true, startEarning });
  });

  it("starts earning from the empty state", async () => {
    const { user } = render(<Votes account={accountWith()} />);

    await user.click(screen.getByRole("button", { name: "Earn rewards" }));

    expect(startEarning).toHaveBeenCalledTimes(1);
  });

  it("disables the empty state action when the account cannot earn", () => {
    mockEarnAction.mockReturnValue({ canEarn: false, startEarning });

    render(<Votes account={accountWith()} />);

    expect(screen.getByRole("button", { name: "Earn rewards" })).toBeDisabled();
  });

  it("starts earning from the remaining votes footer", async () => {
    const { user } = render(<Votes account={partlyVotedAccount} />);

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    expect(startEarning).toHaveBeenCalledTimes(1);
  });

  it("disables the remaining votes action when the account cannot earn", () => {
    mockEarnAction.mockReturnValue({ canEarn: false, startEarning });

    render(<Votes account={partlyVotedAccount} />);

    expect(screen.getByRole("button", { name: "Vote now" })).toBeDisabled();
  });
});
