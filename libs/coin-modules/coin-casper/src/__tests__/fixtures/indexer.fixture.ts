import { ITxnHistoryData } from "../../types/network";

/**
 * Records captured verbatim from https://casper.coin.ledger.com/indexer/ on 2026-08-06.
 *
 * They are kept byte-faithful to the wire so that a change in the indexer's record shape shows up
 * as a compile or test failure here rather than as a silent mapping regression.
 */

/** Public key of the account most of these fixtures are listed for. */
export const INDEXER_PUBLIC_KEY =
  "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";
/** blake2b256 of INDEXER_PUBLIC_KEY, as returned by the indexer in `caller_hash`. */
export const INDEXER_ACCOUNT_HASH =
  "79e548dd1aed87e79e797704c1175266eb705757ba52d786784a72655eb53e7f";

export const COUNTERPARTY_PUBLIC_KEY =
  "020378080845446b50d7bfe2c450b5b24b8c586efaf1aa051feff4d12ad8f1ebf9e6";
export const COUNTERPARTY_ACCOUNT_HASH =
  "947cc343545c8215f1612f199b417e6fc1000139bb451c1554e63123ac9fb66e";

/** Outgoing native transfer, `{ ByteArray: 32 }` target, no transfer id. */
export const OUTGOING_TX: ITxnHistoryData = {
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
  caller_hash: INDEXER_ACCOUNT_HASH,
  caller_public_key: INDEXER_PUBLIC_KEY,
  consumed_gas: "100000000",
  contract_hash: "7cc1b1db4e08bbfe7bacf8e1ad828a5d9bcccbb33e55d322808c3a88da53213a",
  contract_package_hash: "4475016098705466254edd18d267a9dad43e341d4dafadb507d0fe3cf2d4a74b",
  cost: "100000000",
  deploy_hash: "74c9cedc96bdde3e4dba8ceb0dc702e27bf259ad94f5e5e67adef25c388075b8",
  entry_point_id: 10,
  error_message: null,
  execution_type_id: 6,
  gas_price_limit: 1,
  is_standard_payment: false,
  payment_amount: "100000000",
  pricing_mode_id: 0,
  refund_amount: "0",
  runtime_type_id: 0,
  status: "processed",
  timestamp: "2022-11-18T15:38:19Z",
  version_id: 0,
};

/** Incoming native transfer carrying a transfer id. */
export const INCOMING_TX: ITxnHistoryData = {
  args: {
    amount: { cl_type: "U512", parsed: "12000000000" },
    id: { cl_type: { Option: "U64" }, parsed: 7772882 },
    target: { cl_type: { ByteArray: 32 }, parsed: INDEXER_ACCOUNT_HASH },
  },
  block_hash: "7be144672c64c2cb849de832f17c680a8e785f396f6d8fef8dd34c0f9eb803c6",
  block_height: 1272464,
  caller_hash: COUNTERPARTY_ACCOUNT_HASH,
  caller_public_key: COUNTERPARTY_PUBLIC_KEY,
  consumed_gas: "100000000",
  contract_hash: "7cc1b1db4e08bbfe7bacf8e1ad828a5d9bcccbb33e55d322808c3a88da53213a",
  contract_package_hash: "4475016098705466254edd18d267a9dad43e341d4dafadb507d0fe3cf2d4a74b",
  cost: "100000000",
  deploy_hash: "6dd86840ad7bcd25f5344128cfc34ae9dcea53f5081eb8c6cbd21e2cf3cbabb8",
  entry_point_id: 10,
  error_message: null,
  execution_type_id: 6,
  gas_price_limit: 1,
  is_standard_payment: false,
  payment_amount: "100000000",
  pricing_mode_id: 0,
  refund_amount: "0",
  runtime_type_id: 0,
  status: "processed",
  timestamp: "2022-11-18T14:05:59Z",
  version_id: 0,
};

/** Transfer whose target is a public key rather than an account hash — both forms occur. */
export const PUBLIC_KEY_TARGET_TX: ITxnHistoryData = {
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
  caller_hash: COUNTERPARTY_ACCOUNT_HASH,
  caller_public_key: COUNTERPARTY_PUBLIC_KEY,
  consumed_gas: "100000000",
  contract_hash: "7cc1b1db4e08bbfe7bacf8e1ad828a5d9bcccbb33e55d322808c3a88da53213a",
  contract_package_hash: "4475016098705466254edd18d267a9dad43e341d4dafadb507d0fe3cf2d4a74b",
  cost: "100000000",
  deploy_hash: "9b54de935d70bf4f1ee2fbfb3f528196380c9c66853eb0a2f045d74c83329298",
  entry_point_id: 10,
  error_message: null,
  execution_type_id: 6,
  gas_price_limit: 1,
  is_standard_payment: true,
  payment_amount: "100000000",
  pricing_mode_id: 0,
  refund_amount: "0",
  runtime_type_id: 0,
  status: "processed",
  timestamp: "2025-05-27T22:48:00Z",
  version_id: 0,
};

/** Build a variant of a captured record without re-hand-writing the whole envelope. */
export function txWith(
  base: ITxnHistoryData,
  overrides: Partial<ITxnHistoryData>,
): ITxnHistoryData {
  return { ...base, ...overrides };
}
