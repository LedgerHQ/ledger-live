import { ITxnHistoryData, TransferArgs } from "../../types/network";

/**
 * Records captured from https://casper.coin.ledger.com/indexer/ on 2026-08-06, trimmed to the
 * fields `ITxnHistoryData` models.
 */

/** A record known to be a native transfer, so tests can read `args.target` without narrowing. */
type CapturedTransfer = ITxnHistoryData & { args: TransferArgs };

/** Public key of the account most of these fixtures are listed for. */
export const INDEXER_PUBLIC_KEY =
  "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";

/** blake2b256 of INDEXER_PUBLIC_KEY. */
export const INDEXER_ACCOUNT_HASH =
  "79e548dd1aed87e79e797704c1175266eb705757ba52d786784a72655eb53e7f";

export const COUNTERPARTY_PUBLIC_KEY =
  "020378080845446b50d7bfe2c450b5b24b8c586efaf1aa051feff4d12ad8f1ebf9e6";

export const COUNTERPARTY_ACCOUNT_HASH =
  "947cc343545c8215f1612f199b417e6fc1000139bb451c1554e63123ac9fb66e";

/** Outgoing native transfer, `{ ByteArray: 32 }` target, no transfer id. */
export const OUTGOING_TX: CapturedTransfer = {
  args: {
    amount: { cl_type: "U512", parsed: "2500000000" },
    id: { cl_type: { Option: "U64" }, parsed: null },
    target: {
      cl_type: { ByteArray: 32 },
      parsed: "f74845d90933546a90faec6a605961d078b0fbf1a3b954cee8cd982e43b7c09d",
    },
  },
  block_hash: "752245992dcba949354a583a865618da29c97c163e852417d1ad0c148a848466",
  block_height: 1272937,
  caller_public_key: INDEXER_PUBLIC_KEY,
  cost: "100000000",
  deploy_hash: "74c9cedc96bdde3e4dba8ceb0dc702e27bf259ad94f5e5e67adef25c388075b8",
  error_message: null,
  timestamp: "2022-11-18T15:38:19Z",
};

/** Incoming native transfer carrying a transfer id. */
export const INCOMING_TX: CapturedTransfer = {
  args: {
    amount: { cl_type: "U512", parsed: "12000000000" },
    id: { cl_type: { Option: "U64" }, parsed: 7772882 },
    target: { cl_type: { ByteArray: 32 }, parsed: INDEXER_ACCOUNT_HASH },
  },
  block_hash: "7be144672c64c2cb849de832f17c680a8e785f396f6d8fef8dd34c0f9eb803c6",
  block_height: 1272464,
  caller_public_key: COUNTERPARTY_PUBLIC_KEY,
  cost: "100000000",
  deploy_hash: "6dd86840ad7bcd25f5344128cfc34ae9dcea53f5081eb8c6cbd21e2cf3cbabb8",
  error_message: null,
  timestamp: "2022-11-18T14:05:59Z",
};

/** Transfer whose target is a public key rather than an account hash — both forms occur. */
export const PUBLIC_KEY_TARGET_TX: CapturedTransfer = {
  args: {
    amount: { cl_type: "U512", parsed: "2500000000" },
    id: { cl_type: { Option: "U64" }, parsed: 5555 },
    target: {
      cl_type: "PublicKey",
      parsed: "0203a17118ec0e64c4e4fdbdbee0ea14d118c9aaf08c6c81bbb776cae607ceb84ecb",
    },
  },
  block_hash: "3c58e81493d8f119480c2c1f1fbd537929109dd36296b2c99da3d0783adf4d44",
  block_height: 4906025,
  caller_public_key: COUNTERPARTY_PUBLIC_KEY,
  cost: "100000000",
  error_message: null,
  deploy_hash: "9b54de935d70bf4f1ee2fbfb3f528196380c9c66853eb0a2f045d74c83329298",
  timestamp: "2025-05-27T22:48:00Z",
};

/** An undelegate deploy: `{ amount, delegator, validator }` and no `target`. */
export const STAKING_TX: ITxnHistoryData = {
  args: {
    amount: { cl_type: "U512", parsed: "5899220383815710" },
  },
  block_hash: "4c3f175942b255885deeacea94cc37ca72a8643c01fb644c9e0fea072e4bec9f",
  block_height: 3766505,
  caller_public_key: "0202f76676828d6e59cd46656a678789a5031e1f2535e9c2fb246321ef8c7ee39a72",
  cost: "2500000000",
  error_message: null,
  deploy_hash: "6eaae28f92124d0cfa6f5fab36dfc12174f5f26c4d045ef2c5ab463ad9378b3e",
  timestamp: "2024-10-22T23:39:05Z",
};

/** Build a variant of a captured record without re-hand-writing the whole envelope. */
export function txWith(
  base: ITxnHistoryData,
  overrides: Partial<ITxnHistoryData>,
): ITxnHistoryData {
  return { ...base, ...overrides };
}
