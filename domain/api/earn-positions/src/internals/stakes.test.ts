import type { GetEarnPositionsArgs } from "../types";
import { StakesV3WireSchema, UNREADABLE_ROW_FAILURE, toEarnPositions } from "./stakes";
import {
  LEDGER_BY_BITWISE_VOTE_ACCOUNT,
  LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
  OTHER_OWNER_ADDRESS,
  OWNER_ADDRESS,
  STAKE_ACCOUNT_A,
  STAKE_ACCOUNT_B,
  batchStakeView,
  batchedErrorView,
  bitwiseSolanaStake,
  solanaStake,
  stakeFailure,
  stakesV3Response,
} from "./wire.mock";

const args: GetEarnPositionsArgs = { network: "solana", address: OWNER_ADDRESS };

/**
 * Validates the payload first, as the endpoint does before it maps the response. The JSON round trip
 * drops the keys set to undefined, as the wire does.
 */
function read(payload: unknown) {
  return toEarnPositions(StakesV3WireSchema.parse(JSON.parse(JSON.stringify(payload))), args);
}

function readStake(stake: unknown) {
  return read(stakesV3Response([batchStakeView(stake)])).positions[0];
}

/** Reads one malformed stake next to a valid one, of the same address. */
function readNextToValidRow(stake: unknown) {
  return read(stakesV3Response([batchStakeView(stake), batchStakeView(bitwiseSolanaStake())]));
}

function interestOf(interest: unknown) {
  return readStake(solanaStake({ interest })).interest;
}

function rejects(payload: unknown) {
  return !StakesV3WireSchema.safeParse(JSON.parse(JSON.stringify(payload))).success;
}

const ethereumNativeStake = {
  protocol_name: "Ethereum Native Staking",
  currency: "ethereum",
  interest: { type: "APY", value: "0.031", currency: "ethereum" },
  staked_balance: "32000000000000000000",
  status: "activated",
  commission: "Net",
  details: { type: "EthNativeDetailsView", validator_address: "0x1", state: "active_ongoing" },
};

describe("toEarnPositions", () => {
  it("maps a SOL stake account to a position", () => {
    expect(readStake(solanaStake())).toEqual({
      id: STAKE_ACCOUNT_A,
      network: "solana",
      ownerAddress: OWNER_ADDRESS,
      validatorAddress: LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
      validatorName: "Ledger by Figment",
      validatorLogoUrl: "https://example.com/validators/ledger-by-figment.png",
      status: "activated",
      balance: "10000000000",
      deposited: "9750000000",
      totalRewards: "250000000",
      interest: { type: "APY", value: 0.0712 },
      updatedAt: "2026-11-18T11:58:00Z",
    });
  });

  it("keeps one position per stake account, with the staleness and time of the snapshot", () => {
    const result = read(
      stakesV3Response([batchStakeView(solanaStake()), batchStakeView(bitwiseSolanaStake())], {
        is_stale: true,
      }),
    );

    expect(result.positions.map(position => position.id)).toEqual([
      STAKE_ACCOUNT_A,
      STAKE_ACCOUNT_B,
    ]);
    expect(result.positions[1]).toMatchObject({
      validatorAddress: LEDGER_BY_BITWISE_VOTE_ACCOUNT,
      validatorName: "Ledger by Bitwise",
      status: "deactivating",
    });
    expect(result.isStale).toBe(true);
    expect(result.respondedAt).toBe("2026-11-18T12:00:01Z");
    expect(result.failures).toEqual([]);
  });

  it("takes the rewards earned in the currency of the stake", () => {
    const position = readStake(
      solanaStake({
        rewards: [
          {
            rewardName: "Ledger points",
            total: "999",
            last24H: "1",
            last7D: "7",
            last30D: "30",
            apy: "0",
          },
          { currency: "ethereum", total: "1", last24H: "0", last7D: "0", last30D: "0", apy: "0" },
          {
            currency: "solana",
            total: "250000000",
            last24H: "0",
            last7D: "0",
            last30D: "0",
            apy: "0",
          },
        ],
      }),
    );

    expect(position.totalRewards).toBe("250000000");
  });

  it("has no total rewards when the rewards entry is a failure, or when there is none", () => {
    const failed = solanaStake({ rewards: [{ code: 500, reason: "Rewards unavailable" }] });

    expect(readStake(failed).totalRewards).toBeUndefined();
    expect(readStake(solanaStake({ rewards: [] })).totalRewards).toBeUndefined();
    expect(readStake(solanaStake({ rewards: undefined })).totalRewards).toBeUndefined();
  });

  it("drops a total of rewards that is not an amount", () => {
    const position = readStake(solanaStake({ rewards: [{ currency: "solana", total: "2.5" }] }));

    expect(position.totalRewards).toBeUndefined();
  });

  it("reads the deposited amount from its placeholder field, as a string or a safe number", () => {
    expect(readStake(solanaStake()).deposited).toBe("9750000000");
    expect(readStake(solanaStake({}, { deposited_balance: 9_750_000_000 })).deposited).toBe(
      "9750000000",
    );
  });

  it("has no deposited amount when the field is absent, and never derives one", () => {
    const position = readStake(solanaStake({}, { deposited_balance: undefined }));

    expect(position.balance).toBe("10000000000");
    expect(position.totalRewards).toBe("250000000");
    expect(position.deposited).toBeUndefined();
  });

  it("drops a deposited amount that is not an amount", () => {
    expect(readStake(solanaStake({}, { deposited_balance: "-1" })).deposited).toBeUndefined();
    expect(readStake(solanaStake({}, { deposited_balance: 2 ** 53 })).deposited).toBeUndefined();
  });

  it("takes the validator name and logo from the top-level protocol_name and logo", () => {
    const position = readStake(
      solanaStake(
        { protocol_name: "Ledger by Bitwise", logo: "https://example.com/bitwise.png" },
        { validator_name: "Not read", validator_logo: "https://example.com/not-read.png" },
      ),
    );

    expect(position.validatorName).toBe("Ledger by Bitwise");
    expect(position.validatorLogoUrl).toBe("https://example.com/bitwise.png");
  });

  it("hides a blank validator name and a logo that is not an http(s) URL", () => {
    const position = readStake(solanaStake({ protocol_name: "  ", logo: "javascript:alert(1)" }));

    expect(position.validatorName).toBeUndefined();
    expect(position.validatorLogoUrl).toBeUndefined();
    expect(readStake(solanaStake({ logo: undefined })).validatorLogoUrl).toBeUndefined();
  });

  it.each(["APY", "APR", "NRR", "GRR"])(
    "reads the rate of the position with its kind %s, sent as a decimal string or a number",
    type => {
      expect(interestOf({ type, value: "0.068", currency: "solana" })).toEqual({
        type,
        value: 0.068,
      });
      expect(interestOf({ type, value: 0.068, currency: "solana" })).toEqual({
        type,
        value: 0.068,
      });
    },
  );

  it("reads a zero rate, which the details decide to hide", () => {
    expect(interestOf({ type: "APY", value: "0", currency: "solana" })).toEqual({
      type: "APY",
      value: 0,
    });
  });

  it.each(["7.2", 7.2, "NaN", "", "7.2%", "-0.01", null])(
    "drops a rate of %p, which is not a fraction from 0 to 1",
    value => {
      expect(interestOf({ type: "APY", value, currency: "solana" })).toBeUndefined();
    },
  );

  it("drops a rate whose kind it does not know, or that names none", () => {
    expect(interestOf({ type: "Yield", value: "0.068" })).toBeUndefined();
    expect(interestOf({ value: "0.068" })).toBeUndefined();
  });

  it("has no rate when the interest is missing", () => {
    expect(readStake(solanaStake({ interest: undefined })).interest).toBeUndefined();
  });

  it("reads an empty or missing validator address as an empty string", () => {
    expect(readStake(solanaStake({}, { validator_address: "" })).validatorAddress).toBe("");
    expect(readStake(solanaStake({}, { validator_address: null })).validatorAddress).toBe("");
    expect(readStake(solanaStake({}, { validator_address: undefined })).validatorAddress).toBe("");
  });

  it("reads a status it does not know as unknown", () => {
    expect(readStake(solanaStake({ status: "archived" })).status).toBe("archived");
    expect(readStake(solanaStake({ status: "pending_activation" })).status).toBe("unknown");
  });

  it("drops an update time it cannot read", () => {
    expect(readStake(solanaStake({}, { updated_at: "yesterday" })).updatedAt).toBeUndefined();
    expect(readStake(solanaStake({}, { updated_at: undefined })).updatedAt).toBeUndefined();
  });

  it("returns the failures the providers reported, apart from the positions", () => {
    const result = read(
      stakesV3Response([
        batchedErrorView(),
        batchStakeView(stakeFailure()),
        batchStakeView(solanaStake()),
      ]),
    );

    expect(result.positions.map(position => position.id)).toEqual([STAKE_ACCOUNT_A]);
    expect(result.failures).toEqual([
      { code: 503, reason: "Provider unavailable" },
      { code: 502, reason: "Bad gateway from provider" },
    ]);
  });

  it("returns no position and no failure for an address that holds none", () => {
    const none = { positions: [], failures: [] };

    expect(read(stakesV3Response([]))).toMatchObject(none);
    expect(read({ meta: { is_stale: false, responded_at: "2026-11-18T12:00:01Z" } })).toMatchObject(
      none,
    );
  });

  it("leaves out the rows of another address, malformed or not", () => {
    const result = read(
      stakesV3Response([
        batchStakeView(solanaStake(), OTHER_OWNER_ADDRESS),
        batchedErrorView(OTHER_OWNER_ADDRESS),
        batchStakeView({}, OTHER_OWNER_ADDRESS),
        { ...batchStakeView(solanaStake()), id: { network: "ethereum", address: OWNER_ADDRESS } },
      ]),
    );

    expect(result).toMatchObject({ positions: [], failures: [] });
  });

  it("leaves out the stakes of another kind", () => {
    const stakeKit = {
      protocol_name: "Jito",
      currency: "solana",
      details: { type: "StakeKitStakeDetailsView", symbol: "JITOSOL", balance: 1 },
    };
    const result = read(
      stakesV3Response([batchStakeView(ethereumNativeStake), batchStakeView(stakeKit)]),
    );

    expect(result).toMatchObject({ positions: [], failures: [] });
  });

  it("drops a response time it cannot read", () => {
    expect(read(stakesV3Response([], { responded_at: "soon" })).respondedAt).toBeUndefined();
    expect(read({ data: [], meta: { is_stale: false } }).respondedAt).toBeUndefined();
  });

  describe("a row of the address that breaks the contract", () => {
    it.each([
      ["without its stake account", solanaStake({}, { stake_account: undefined })],
      ["with a blank stake account", solanaStake({}, { stake_account: "" })],
      ["whose status is not a string", solanaStake({ status: 1 })],
      ["without its currency", solanaStake({ currency: undefined })],
      ["without its details", solanaStake({ details: undefined })],
      ["that is empty", {}],
      ["that is a failure without a code", { error: { reason: "Provider unavailable" } }],
    ])("should read a SOL row %s as a failure, and keep the valid rows", (_case, stake) => {
      const result = readNextToValidRow(stake);

      expect(result.positions.map(position => position.id)).toEqual([STAKE_ACCOUNT_B]);
      expect(result.failures).toEqual([UNREADABLE_ROW_FAILURE]);
    });

    it("should read a SOL row in another currency as a failure, never in the unit of SOL", () => {
      const result = read(
        stakesV3Response([batchStakeView(solanaStake({ currency: "ethereum" }))]),
      );

      expect(result).toMatchObject({ positions: [], failures: [UNREADABLE_ROW_FAILURE] });
    });

    it("should read a row of a type the contract does not have as a failure", () => {
      const result = read(
        stakesV3Response([
          {
            type: "BatchStakeViewV2",
            id: { network: "solana", address: OWNER_ADDRESS },
            stake: {},
          },
        ]),
      );

      expect(result).toMatchObject({ positions: [], failures: [UNREADABLE_ROW_FAILURE] });
    });

    it("should read a row whose owner cannot be read as a failure: it may be the address's", () => {
      const result = read(stakesV3Response([{ type: "BatchStakeViewV1", stake: solanaStake() }]));

      expect(result).toMatchObject({ positions: [], failures: [UNREADABLE_ROW_FAILURE] });
    });
  });
});

describe("StakesV3WireSchema", () => {
  it("rejects a payload without its meta, such as the bare list of v1", () => {
    expect(rejects([batchStakeView(solanaStake())])).toBe(true);
    expect(rejects({ data: [] })).toBe(true);
  });

  it("rejects a null data, which the contract does not allow", () => {
    expect(rejects({ data: null, meta: { is_stale: false } })).toBe(true);
  });

  it("rejects data that is not a list", () => {
    expect(rejects({ data: {}, meta: { is_stale: false } })).toBe(true);
  });

  it("accepts any row, each one read on its own", () => {
    expect(rejects(stakesV3Response([batchStakeView(ethereumNativeStake), {}, null]))).toBe(false);
  });
});
