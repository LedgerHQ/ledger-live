import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type {
  CosmosAccount,
  CosmosMappedDelegation,
} from "@ledgerhq/live-common/families/cosmos/types";
import BigNumber from "bignumber.js";
import StepClaimRewards from "./StepClaimRewards";
import type { StepProps } from "../types";

// Mock only external deps (bridge, unit, the delegation-selector's data hook, analytics);
// the mode selector renders for real so we assert on the actual user-visible toggle.
const mockUpdateTransaction = jest.fn((tx: object, patch: object) => ({ ...tx, ...patch }));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: mockUpdateTransaction,
  }),
}));
let delegationOnChange: ((delegation: CosmosMappedDelegation) => void) | null = null;
jest.mock("../fields/DelegationSelectorField", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (delegation: CosmosMappedDelegation) => void }) => {
    delegationOnChange = onChange;
    return <div data-testid="delegation-selector" />;
  },
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ATOM", name: "Cosmos", magnitude: 6 }),
}));
jest.mock("@ledgerhq/live-common/families/cosmos/react", () => ({
  useCosmosFamilyDelegationsQuerySelector: () => ({
    query: "",
    setQuery: jest.fn(),
    options: [],
    value: null,
  }),
}));
jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackPage: () => null,
}));

const buildAccount = (currencyId: string) =>
  ({
    type: "Account",
    freshAddress: "cosmos1test",
    currency: getCryptoCurrencyById(currencyId),
    stakingResources: { delegations: [] },
  }) as unknown as CosmosAccount;

const buildProps = (currencyId: string, mode: string): StepProps =>
  ({
    account: buildAccount(currencyId),
    parentAccount: undefined,
    transaction: { family: "cosmos", mode, valAddress: "" },
    status: { errors: {}, warnings: {} },
    onUpdateTransaction: jest.fn(),
    warning: null,
    error: null,
    t: (k: string) => k,
  }) as unknown as StepProps;

describe("Cosmos StepClaimRewards compound gating", () => {
  it("shows the compound option on a standard cosmos chain", () => {
    render(<StepClaimRewards {...buildProps("cosmos", "claimReward")} />);
    expect(screen.getByRole("button", { name: "Compound" })).toBeVisible();
  });

  it("hides the compound option on an epoching chain (babylon)", () => {
    render(<StepClaimRewards {...buildProps("babylon", "claimReward")} />);
    expect(screen.queryByRole("button", { name: "Compound" })).not.toBeInTheDocument();
  });
});

describe("Cosmos StepClaimRewards delegation selection", () => {
  it("patches only the validator address and the amount when a delegation is selected", () => {
    const props = buildProps("cosmos", "compoundReward");
    render(<StepClaimRewards {...props} />);
    delegationOnChange?.({
      validatorAddress: "validatorA",
      pendingRewards: BigNumber(7),
    } as unknown as CosmosMappedDelegation);
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction);
    expect(mockUpdateTransaction).toHaveBeenCalledWith(props.transaction, {
      valAddress: "validatorA",
      amount: BigNumber(7),
    });
    expect(result).toMatchObject({ mode: "compoundReward", valAddress: "validatorA" });
  });

  it("ignores an empty selection", () => {
    const props = buildProps("cosmos", "claimReward");
    render(<StepClaimRewards {...props} />);
    delegationOnChange?.(undefined as unknown as CosmosMappedDelegation);
    expect(props.onUpdateTransaction).not.toHaveBeenCalled();
  });
});
