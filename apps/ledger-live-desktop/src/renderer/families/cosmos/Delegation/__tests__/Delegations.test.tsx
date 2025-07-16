import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { CURRENCIES_LIST } from "@ledgerhq/live-common/currencies/mock";
import { CosmosAccount, CosmosResources } from "@ledgerhq/live-common/families/cosmos/types";
import { RenderResult } from "@testing-library/react";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import Delegations from "../index";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

describe("Cosmos Delegations Component", () => {
  const mockCosmosAccount = {
    type: "Account",
    currency: CURRENCIES_LIST.find(c => c.id === "cosmos")!,
    spendableBalance: BigNumber(0),
    cosmosResources: {
      delegations: [],
      pendingRewardsBalance: BigNumber(0),
      unbondings: [],
      delegatedBalance: BigNumber(0),
      unbondingBalance: BigNumber(0),
    } as unknown as CosmosResources,
  } as CosmosAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Delegations component when we do not configure disable delegations", () => {
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({});

    render(<Delegations account={mockCosmosAccount} />, {
      initialState: {
        ...INITIAL_STATE,
      },
    });

    expect(getCurrencyConfiguration).toHaveBeenCalledWith(mockCosmosAccount.currency);
    expect(screen.getByText("You can earn ATOM rewards by delegating your assets.")).toBeVisible();
  });

  it("should render Delegations component when we do not disable delegations", () => {
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({ disableDelegation: false });

    render(<Delegations account={mockCosmosAccount} />, {
      initialState: {
        ...INITIAL_STATE,
      },
    });

    expect(getCurrencyConfiguration).toHaveBeenCalledWith(mockCosmosAccount.currency);
    expect(screen.getByText("You can earn ATOM rewards by delegating your assets.")).toBeVisible();
  });

  it("should not render Delegations component when we disable delegations", async () => {
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({
      disableDelegation: true,
    });

    const { container } = render(<Delegations account={mockCosmosAccount} />, {
      initialState: { ...INITIAL_STATE },
    }) as unknown as RenderResult;

    expect(container).toBeEmptyDOMElement();
  });
});
