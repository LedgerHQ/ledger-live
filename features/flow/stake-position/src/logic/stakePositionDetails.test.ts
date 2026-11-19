import type { z } from "zod";
import type { ApyFraction, EarnPositionSchema } from "@domain/entity-earn-position";
import { mockEarnPosition } from "@domain/entity-earn-position/schema.mock";
import type {
  ReadyStakePositionData,
  StakePositionChainExit,
  StakePositionFormatter,
} from "../types";
import { getStakePositionValidatorName, toStakePositionDetailsProps } from "./stakePositionDetails";

const LAMPORTS_PER_SOL = 1_000_000_000n;
const VALIDATOR = "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx";
const VALIDATOR_APY = 0.078107 as ApyFraction;

const sol = (lamports: string) => `${Number(BigInt(lamports)) / Number(LAMPORTS_PER_SOL)} SOL`;

const FORMAT: StakePositionFormatter = {
  amount: lamports => ({ crypto: sol(lamports), fiat: `$${sol(lamports)}` }),
  rewardsHeadline: lamports => ({
    value: Number(lamports),
    formatter: value => ({
      integerPart: String(value),
      decimalPart: "00",
      currencyText: "$",
      decimalSeparator: ".",
      currencyPosition: "start",
    }),
    hidden: false,
  }),
  percent: fraction => `${(fraction * 100).toFixed(2)}%`,
};

const ACTIVE_EXIT: StakePositionChainExit = {
  state: "active",
  action: "deactivate",
  notice: null,
  isPending: false,
};

function ready(
  overrides: Partial<z.input<typeof EarnPositionSchema>> = {},
  data: Partial<Omit<ReadyStakePositionData, "kind" | "position">> = {},
): ReadyStakePositionData {
  return {
    kind: "ready",
    position: mockEarnPosition({ validatorAddress: VALIDATOR, ...overrides }),
    status: "active",
    validatorApy: VALIDATOR_APY,
    isStale: false,
    isPolling: false,
    ...data,
  };
}

describe("toStakePositionDetailsProps", () => {
  it("should take every figure from the backend position", () => {
    const details = toStakePositionDetailsProps(
      ready({ balance: "10000000000", totalRewards: "250000000", deposited: "9750000000" }),
      ACTIVE_EXIT,
      FORMAT,
    );

    expect(details).toMatchObject({
      status: "active",
      currentBalance: { crypto: "10 SOL", fiat: "$10 SOL" },
      totalRewards: { crypto: "0.25 SOL" },
      initialDeposit: { crypto: "9.75 SOL" },
      apy: "7.81%",
      validator: {
        name: "Ledger by Figment",
        imageUrl: "https://example.com/validators/ledger-by-figment.png",
      },
    });
    expect(details.rewardsHeadline?.value).toBe(250000000);
  });

  it("should take the exit from the chain only", () => {
    const details = toStakePositionDetailsProps(
      ready(),
      { ...ACTIVE_EXIT, isPending: true },
      FORMAT,
    );

    expect(details).toMatchObject({ exitAction: "deactivate", isExitActionPending: true });
  });

  it.each([
    ["the total rewards", { totalRewards: undefined }, "totalRewards"],
    ["the balance", { balance: undefined }, "currentBalance"],
    ["the deposited amount", { deposited: undefined }, "initialDeposit"],
  ] as const)("should hide a row when the backend sends no %s", (_figure, overrides, prop) => {
    const details = toStakePositionDetailsProps(ready(overrides), ACTIVE_EXIT, FORMAT);

    expect(details[prop]).toBeUndefined();
  });

  it("should hide the rewards headline without rewards", () => {
    expect(
      toStakePositionDetailsProps(ready({ totalRewards: undefined }), ACTIVE_EXIT, FORMAT)
        .rewardsHeadline,
    ).toBeUndefined();
  });

  it("should hide the APY row while the validator APY is unknown, never showing the position APY", () => {
    const details = toStakePositionDetailsProps(
      ready({ positionApy: 0.0712 }, { validatorApy: undefined }),
      ACTIVE_EXIT,
      FORMAT,
    );

    expect(details.apy).toBeUndefined();
  });

  it("should name the validator by its shortened vote account when the backend sends no name", () => {
    const details = toStakePositionDetailsProps(
      ready({ validatorName: undefined, validatorLogoUrl: undefined }),
      ACTIVE_EXIT,
      FORMAT,
    );

    expect(details.validator).toEqual({ name: "26pV97…c53dJx", imageUrl: undefined });
  });

  it("should hide the validator row of a position delegated to no validator", () => {
    const details = toStakePositionDetailsProps(
      ready({ validatorName: undefined, validatorAddress: "" }),
      ACTIVE_EXIT,
      FORMAT,
    );

    expect(details.validator).toBeUndefined();
  });

  describe("Earn more", () => {
    it.each([
      ["active", true],
      ["activating", true],
      ["deactivating", false],
      ["inactive", false],
    ] as const)("should be offered on an %s chain position: %p", (state, showEarnMore) => {
      const details = toStakePositionDetailsProps(ready(), { ...ACTIVE_EXIT, state }, FORMAT);

      expect(details.showEarnMore).toBe(showEarnMore);
    });
  });

  describe("notice", () => {
    it("should show none when the backend and the chain agree", () => {
      const details = toStakePositionDetailsProps(
        ready({ status: "deactivated" }, { status: "inactive" }),
        { state: "inactive", action: "withdraw", notice: null, isPending: false },
        FORMAT,
      );

      expect(details.notice).toBeNull();
    });

    it("should say the position is updating when the backend says activated and the chain inactive, and keep the chain exit", () => {
      const details = toStakePositionDetailsProps(
        ready({ status: "activated" }),
        { state: "inactive", action: "withdraw", notice: null, isPending: false },
        FORMAT,
      );

      expect(details).toMatchObject({ notice: "updating", exitAction: "withdraw" });
    });

    it("should say the position is updating when the backend snapshot is stale", () => {
      const details = toStakePositionDetailsProps(
        ready({}, { isStale: true }),
        ACTIVE_EXIT,
        FORMAT,
      );

      expect(details.notice).toBe("updating");
    });

    it("should say the position is updating, and hold the exit back, while the backend has not shown the user's own transaction", () => {
      const details = toStakePositionDetailsProps(
        ready({}, { isPolling: true }),
        { state: "deactivating", action: null, notice: "deactivating", isPending: false },
        FORMAT,
      );

      expect(details).toMatchObject({ notice: "updating", isExitActionPending: true });
    });

    it("should explain why the chain offers no exit", () => {
      const details = toStakePositionDetailsProps(
        ready({ status: "deactivated" }, { status: "inactive" }),
        { state: "inactive", action: null, notice: "missingAuthority", isPending: false },
        FORMAT,
      );

      expect(details.notice).toBe("missingAuthority");
    });
  });
});

describe("getStakePositionValidatorName", () => {
  it("should name the validator", () => {
    expect(getStakePositionValidatorName(mockEarnPosition())).toBe("Ledger by Figment");
  });

  it("should name the shortened vote account when the backend sends no name", () => {
    expect(
      getStakePositionValidatorName(
        mockEarnPosition({ validatorName: undefined, validatorAddress: VALIDATOR }),
      ),
    ).toBe("26pV97…c53dJx");
  });

  it("should name the shortened stake account of a position delegated to no validator", () => {
    expect(
      getStakePositionValidatorName(
        mockEarnPosition({
          id: "StakeAccountA1111111111111111111111111111111",
          validatorName: undefined,
          validatorAddress: "",
        }),
      ),
    ).toBe("StakeA…111111");
  });
});
