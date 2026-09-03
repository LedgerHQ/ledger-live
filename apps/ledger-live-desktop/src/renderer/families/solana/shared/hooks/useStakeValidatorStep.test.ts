import { renderHook } from "@testing-library/react";
import {
  useSolanaStakesWithMeta,
  useValidators,
} from "@ledgerhq/live-common/families/solana/react";
import type {
  SolanaAccount,
  SolanaStakeWithMeta,
  Transaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { ValidatorsAppValidator } from "@ledgerhq/live-common/families/solana/staking";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useStakeValidatorStep } from "./useStakeValidatorStep";

jest.mock("@ledgerhq/live-common/families/solana/react");
jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/families/solana/logic", () => ({
  listSolanaStakingPositions: jest.fn(() => []),
}));

const mockedUseStakesWithMeta = jest.mocked(useSolanaStakesWithMeta);
const mockedUseValidators = jest.mocked(useValidators);
const mockedUseMaybeAccountUnit = jest.mocked(useMaybeAccountUnit);

const unit = { code: "SOL", name: "SOL", magnitude: 9 };
const account = {
  type: "Account",
  currency: { id: "solana" },
  stakingResources: {
    delegations: [],
    redelegations: [],
    unbondings: [],
  },
} as unknown as SolanaAccount;

const stakeWithMeta = {
  stake: { positionId: "stake-acc-1", validatorAddress: "vote-acc-1" },
  meta: {},
} as unknown as SolanaStakeWithMeta;

const validator = {
  voteAccount: "vote-acc-1",
  commission: 0,
} as ValidatorsAppValidator;

const undelegateTx = (stakeAccAddr = "stake-acc-1") =>
  ({
    mode: "undelegate",
    recipient: stakeAccAddr,
  }) as Transaction;

const render = (transaction: Transaction | null, mode: "delegate" | "undelegate" = "undelegate") =>
  renderHook(() => useStakeValidatorStep(account, transaction, mode));

describe("useStakeValidatorStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMaybeAccountUnit.mockReturnValue(unit);
    mockedUseStakesWithMeta.mockReturnValue([stakeWithMeta]);
    mockedUseValidators.mockReturnValue([validator]);
  });

  it("resolves the unit, the targeted position and its validator", () => {
    const { result } = render(undelegateTx());

    expect(result.current).toEqual({
      unit,
      stake: stakeWithMeta.stake,
      validator,
    });
  });

  it("returns an undefined validator when no validator matches the position", () => {
    mockedUseValidators.mockReturnValue([
      { voteAccount: "someone-else" } as ValidatorsAppValidator,
    ]);

    const { result } = render(undelegateTx());

    expect(result.current.validator).toBeUndefined();
    expect(result.current.stake).toBe(stakeWithMeta.stake);
  });

  it("throws when the account unit cannot be resolved", () => {
    mockedUseMaybeAccountUnit.mockReturnValue(undefined);

    expect(() => render(undelegateTx())).toThrow(
      "account, transaction and staking resources required",
    );
  });

  it("throws when there is no transaction", () => {
    expect(() => render(null)).toThrow("account, transaction and staking resources required");
  });

  it("throws when the transaction kind is not the expected one", () => {
    expect(() => render(undelegateTx(), "delegate")).toThrow("unsupported transaction");
  });

  it("throws when the transaction does not target a staking position at all", () => {
    const transfer = {
      mode: "send",
    } as Transaction;

    expect(() => render(transfer)).toThrow("unsupported transaction");
  });

  it("throws when the targeted stake account is not among the account positions", () => {
    expect(() => render(undelegateTx("unknown-stake-acc"))).toThrow(
      "stake with account address <unknown-stake-acc> not found",
    );
  });
});
