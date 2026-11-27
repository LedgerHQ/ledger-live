// Payloads shaped like the answers of the Earn backend (Earn OpenAPI `StakesV3Response`). The wallet
// and stake account addresses are made up; the two vote accounts are the public ones of the Ledger by
// Figment and Ledger by Bitwise validators.

export const OWNER_ADDRESS = "Wa11etTestAddress1111111111111111111111111111";
export const OTHER_OWNER_ADDRESS = "Wa11etTestAddress2222222222222222222222222222";
export const STAKE_ACCOUNT_A = "StakeAccountA1111111111111111111111111111111";
export const STAKE_ACCOUNT_B = "StakeAccountB1111111111111111111111111111111";
export const LEDGER_BY_FIGMENT_VOTE_ACCOUNT = "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx";
export const LEDGER_BY_BITWISE_VOTE_ACCOUNT = "CpfvLiiPALdzZTP3fUrALg2TXwEDSAknRh1sn5JCt9Sr";

type WireObject = Record<string, unknown>;

/** A `StakeViewV1Success` for one SOL stake account delegated to Ledger by Figment. */
export function solanaStake(overrides: WireObject = {}, details: WireObject = {}): WireObject {
  return {
    provider: "prv_ledger_by_figment",
    protocol_name: "Ledger by Figment",
    currency: "solana",
    interest: { type: "APY", value: "0.0712", currency: "solana" },
    logo: "https://example.com/validators/ledger-by-figment.png",
    since: "2026-01-12T09:30:00Z",
    staked_balance: "10000000000",
    status: "activated",
    commission: "Net",
    rewards: [
      {
        currency: "solana",
        total: "250000000",
        last24H: "1900000",
        last7D: "13300000",
        last30D: "57000000",
        apy: "0.0712",
      },
    ],
    details: {
      type: "SolanaDetailsView",
      stake_account: STAKE_ACCOUNT_A,
      withdraw_pubkey: OWNER_ADDRESS,
      balance: 10_002_282_880,
      activated_epoch: 812,
      activated_at: "2026-01-12T09:30:00Z",
      net_apy: 0.0712,
      validator_address: LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
      updated_at: "2026-11-18T11:58:00Z",
      deposited_balance: "9750000000",
      ...details,
    },
    ...overrides,
  };
}

/** A second stake account of the same wallet, deactivating from Ledger by Bitwise. */
export function bitwiseSolanaStake(): WireObject {
  return solanaStake(
    {
      provider: "prv_ledger_by_bitwise",
      protocol_name: "Ledger by Bitwise",
      logo: "https://example.com/validators/ledger-by-bitwise.png",
      staked_balance: "2000000000",
      status: "deactivating",
      rewards: [
        {
          currency: "solana",
          total: "40000000",
          last24H: "0",
          last7D: "0",
          last30D: "0",
          apy: "0.0698",
        },
      ],
    },
    {
      stake_account: STAKE_ACCOUNT_B,
      validator_address: LEDGER_BY_BITWISE_VOTE_ACCOUNT,
      deposited_balance: "1960000000",
    },
  );
}

export function batchStakeView(stake: unknown, address = OWNER_ADDRESS): WireObject {
  return { type: "BatchStakeViewV1", id: { network: "solana", address }, stake };
}

/** A provider failure for the whole address, sent with HTTP 200. */
export function batchedErrorView(address = OWNER_ADDRESS): WireObject {
  return {
    type: "BatchedErrorView",
    id: { network: "solana", address },
    error: { code: 503, reason: "Provider unavailable", details: { currency: "solana" } },
  };
}

/** A provider failure in place of a stake, sent with HTTP 200. */
export function stakeFailure(): WireObject {
  return { error: { code: 502, reason: "Bad gateway from provider", details: {} } };
}

export function stakesV3Response(data: unknown[], meta: WireObject = {}): WireObject {
  return { data, meta: { is_stale: false, responded_at: "2026-11-18T12:00:01Z", ...meta } };
}
