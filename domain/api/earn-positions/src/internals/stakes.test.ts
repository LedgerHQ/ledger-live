import type { GetEarnPositionsArgs } from "../types";
import { StakesV3WireSchema, toEarnPositions } from "./stakes";
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

function apyOf(value: unknown) {
  return readStake(solanaStake({ interest: { type: "APY", value, currency: "solana" } }))
    .positionApy;
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
      positionApy: 0.0712,
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

  it("reads the position APY as a fraction, sent as a decimal string or a number", () => {
    expect(apyOf("0.072")).toBe(0.072);
    expect(apyOf(0.072)).toBe(0.072);
  });

  it.each(["7.2", 7.2, "NaN", "", "7.2%", "-0.01", null])(
    "drops a position APY of %p, which is not a fraction from 0 to 1",
    value => {
      expect(apyOf(value)).toBeUndefined();
    },
  );

  it("drops the position APY when the interest is missing", () => {
    expect(readStake(solanaStake({ interest: undefined })).positionApy).toBeUndefined();
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
    expect(read({ data: null, meta: { is_stale: false } })).toMatchObject(none);
  });

  it("leaves out the rows of another address", () => {
    const result = read(
      stakesV3Response([
        batchStakeView(solanaStake(), OTHER_OWNER_ADDRESS),
        batchedErrorView(OTHER_OWNER_ADDRESS),
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
});

describe("StakesV3WireSchema", () => {
  it("rejects a payload without its meta, such as the bare list of v1", () => {
    expect(rejects([batchStakeView(solanaStake())])).toBe(true);
    expect(rejects({ data: [] })).toBe(true);
  });

  it("rejects a SOL row without its stake account", () => {
    expect(
      rejects(stakesV3Response([batchStakeView(solanaStake({}, { stake_account: undefined }))])),
    ).toBe(true);
    expect(
      rejects(stakesV3Response([batchStakeView(solanaStake({}, { stake_account: "" }))])),
    ).toBe(true);
  });

  it("rejects a SOL row whose status or currency is not a string", () => {
    expect(rejects(stakesV3Response([batchStakeView(solanaStake({ status: 1 }))]))).toBe(true);
    expect(rejects(stakesV3Response([batchStakeView(solanaStake({ currency: undefined }))]))).toBe(
      true,
    );
  });

  it("rejects a row of a type the contract does not have", () => {
    expect(rejects(stakesV3Response([{ type: "BatchStakeViewV2", id: {}, stake: {} }]))).toBe(true);
  });

  it("rejects a provider failure that carries no code", () => {
    expect(
      rejects(stakesV3Response([batchStakeView({ error: { reason: "Provider unavailable" } })])),
    ).toBe(true);
  });

  it("accepts the stakes of another kind, whatever fields they carry", () => {
    expect(rejects(stakesV3Response([batchStakeView(ethereumNativeStake)]))).toBe(false);
  });
});
