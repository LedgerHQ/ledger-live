import { useNetworkValidators } from "@domain/api-network-validators";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { CURRENCIES_LIST } from "@ledgerhq/live-common/currencies/mock";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { RenderResult } from "@testing-library/react";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import Delegations from "../index";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));
jest.mock("@domain/api-network-validators", () => ({
  ...jest.requireActual("@domain/api-network-validators"),
  useNetworkValidators: jest.fn(),
}));

describe("Cosmos Delegations Component", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockCosmosAccount = {
    type: "Account",
    currency: CURRENCIES_LIST.find(c => c.id === "cosmos")!,
    spendableBalance: BigNumber(0),
    stakingResources: {
      delegations: [],
      pendingRewardsBalance: BigNumber(0),
      unbondings: [],
      delegatedBalance: BigNumber(0),
      unbondingBalance: BigNumber(0),
    },
  } as unknown as CosmosAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useNetworkValidators)
      .mockReturnValue({ validators: [], pending: false, error: undefined });
  });

  it("should render Delegations component when we do not configure disable delegations", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({});

    render(<Delegations account={mockCosmosAccount} />, {
      initialState: {
        settings: {
          ...INITIAL_STATE,
        },
      },
    });

    expect(getCurrencyConfiguration).toHaveBeenCalledWith(mockCosmosAccount.currency.id);
    expect(screen.getByText("You can earn ATOM rewards by delegating your assets.")).toBeVisible();
  });

  it("should render Delegations component when we do not disable delegations", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({ disableDelegation: false });

    render(<Delegations account={mockCosmosAccount} />, {
      initialState: {
        settings: {
          ...INITIAL_STATE,
        },
      },
    });

    expect(getCurrencyConfiguration).toHaveBeenCalledWith(mockCosmosAccount.currency.id);
    expect(screen.getByText("You can earn ATOM rewards by delegating your assets.")).toBeVisible();
  });

  it("should render without throwing when there are no delegations", () => {
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({ disableDelegation: false });

    expect(() =>
      render(<Delegations account={mockCosmosAccount} />, {
        initialState: {
          settings: {
            ...INITIAL_STATE,
          },
        },
      }),
    ).not.toThrow();
    expect(screen.getByText("You can earn ATOM rewards by delegating your assets.")).toBeVisible();
  });

  it("should enable the Earn rewards CTA when there is a spendable balance", () => {
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({ disableDelegation: false });

    const accountWithBalance = {
      ...mockCosmosAccount,
      spendableBalance: BigNumber(1_000_000),
    } as CosmosAccount;

    render(<Delegations account={accountWithBalance} />, {
      initialState: {
        settings: {
          ...INITIAL_STATE,
        },
      },
    });

    expect(screen.getByText("Earn rewards").closest("button")).not.toBeDisabled();
  });

  it("should not render Delegations component when we disable delegations", async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({
      disableDelegation: true,
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { container } = render(<Delegations account={mockCosmosAccount} />, {
      initialState: {
        settings: {
          ...INITIAL_STATE,
        },
      },
    }) as unknown as RenderResult;

    expect(container).toBeEmptyDOMElement();
  });

  it("throws when the account has no staking resources", () => {
    (getCurrencyConfiguration as jest.Mock).mockReturnValue({ disableDelegation: false });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const noStaking = {
      type: "Account",
      currency: CURRENCIES_LIST.find(c => c.id === "cosmos")!,
      spendableBalance: BigNumber(0),
    } as unknown as CosmosAccount;

    expect(() => render(<Delegations account={noStaking} />)).toThrow(
      "cosmos staking account required",
    );
  });

  describe("delegation list", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const delegated = {
      type: "Account",
      currency: CURRENCIES_LIST.find(c => c.id === "cosmos")!,
      spendableBalance: BigNumber(0),
      stakingResources: {
        delegations: [
          {
            validatorAddress: "cosmosvaloper1known",
            amount: BigNumber(1_000_000),
            pendingRewards: BigNumber(0),
            status: "bonded",
          },
        ],
        redelegations: [],
        pendingRewardsBalance: BigNumber(0),
        unbondings: [],
        delegatedBalance: BigNumber(1_000_000),
        unbondingBalance: BigNumber(0),
      },
    } as unknown as CosmosAccount;
    const renderDelegated = () => {
      jest.mocked(getCurrencyConfiguration).mockReturnValue({
        status: { type: "active" },
        name: "Cosmos",
        unit: { name: "Atom", code: "ATOM", magnitude: 6 },
      });
      render(<Delegations account={delegated} />, {
        initialState: { settings: { ...INITIAL_STATE } },
      });
    };

    it("names a delegation's validator from the network validators", () => {
      jest.mocked(useNetworkValidators).mockReturnValue({
        validators: [{ id: "cosmosvaloper1known", name: "Known Validator" }],
        pending: false,
        error: undefined,
      });
      renderDelegated();
      expect(useNetworkValidators).toHaveBeenCalledWith("cosmos");
      expect(screen.getByText("Known Validator")).toBeVisible();
    });

    it("lists queued undelegations to one validator that share a completion date", () => {
      const completionDate = new Date("2026-12-01T00:00:00.000Z");
      const unbonding = { validatorAddress: "cosmosvaloper1queued", completionDate };
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const queued = {
        ...delegated,
        stakingResources: {
          delegations: [],
          redelegations: [],
          pendingRewardsBalance: BigNumber(0),
          delegatedBalance: BigNumber(0),
          unbondings: [
            { ...unbonding, amount: BigNumber(1_000_000) },
            { ...unbonding, amount: BigNumber(2_000_000) },
          ],
          unbondingBalance: BigNumber(3_000_000),
        },
      } as unknown as CosmosAccount;
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
      jest.mocked(getCurrencyConfiguration).mockReturnValue({
        status: { type: "active" },
        name: "Cosmos",
        unit: { name: "Atom", code: "ATOM", magnitude: 6 },
      });
      render(<Delegations account={queued} />, {
        initialState: { settings: { ...INITIAL_STATE } },
      });
      expect(screen.getAllByText("cosmosvaloper1queued")).toHaveLength(2);
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain("same key");
      consoleError.mockRestore();
    });

    it("shows the validator address until the network validators arrive", () => {
      jest
        .mocked(useNetworkValidators)
        .mockReturnValue({ validators: [], pending: true, error: undefined });
      renderDelegated();
      expect(screen.getByText("cosmosvaloper1known")).toBeVisible();
    });
  });
});
