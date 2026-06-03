/**
 * Build-flow shape parity: `createTransaction` outputs must have the same
 * structural shape across JSON-RPC and GraphQL transports. Mirrors the
 * `assertShapeBoth` pattern from `sdk.migration.integ.test.ts`.
 *
 * Values legitimately drift between transports — gas-coin selection picks
 * different objects across calls, gas budget is computed from simulation
 * effects each time, etc. So we decode both BCS-built txs to their structured
 * `TransactionData` form and compare:
 *   - same `version`
 *   - same `sender` shape (address-string)
 *   - same number of inputs, with matching `$kind` per index
 *   - same number of commands, with matching `$kind` per index
 *   - `gasData.payment` parity-of-emptiness: both empty (SIP-58 address-balance
 *     path) or both populated; per-object refs are resolver-determined and
 *     drift between calls, so values are not compared.
 *
 * What we do NOT compare: per-object IDs, gas budget, gas price, gas-payment
 * coin-object refs. Those are resolver-determined and drift legitimately.
 */
import { parseTransactionBcs } from "@mysten/sui/client";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { GRAPHQL_MAINNET_URL } from "./graphql/constants";
import { createTransaction, DEFAULT_COIN_TYPE } from "./sdk";

const JSON_RPC_ID = "sui-jsonrpc-build-mig";
const GRAPHQL_ID = "sui-graphql-build-mig";
const JSON_RPC_URL = getJsonRpcFullnodeUrl("mainnet");

/** Same mainnet account used in sdk.migration.integ.test — holds USDC + ~4.6k SUI. */
const ACTIVE_ACCOUNT = "0x0feb54a725aa357ff2f5bc6bb023c05b310285bd861275a30521f339a434ebb3";

beforeAll(() => {
  coinConfig.setCoinConfig(id => {
    const node = { url: JSON_RPC_URL, graphqlUrl: GRAPHQL_MAINNET_URL };
    if (id === JSON_RPC_ID) {
      return { node, status: { type: "active" }, features: { graphql: false } };
    }
    if (id === GRAPHQL_ID) {
      return { node, status: { type: "active" }, features: { graphql: true } };
    }
    throw new Error(`Unknown currency id in build migration test: ${id}`);
  });
});

/**
 * Decode the BCS bytes via Mysten's parser and assert structural parity.
 * Both decoded objects share `SuiClientTypes.TransactionData` (i.e.
 * `SerializedTransactionDataV2`).
 */
const assertShapeBothBuilt = (rpcBytes: Uint8Array, gqlBytes: Uint8Array, label: string) => {
  const rpc = parseTransactionBcs(rpcBytes);
  const gql = parseTransactionBcs(gqlBytes);

  // Version must match — both should produce v2.
  expect(gql.version).toBe(rpc.version);

  // Sender shape: same kind (address string with same length).
  expect(typeof gql.sender).toBe(typeof rpc.sender);
  if (typeof rpc.sender === "string" && typeof gql.sender === "string") {
    expect(gql.sender.length).toBe(rpc.sender.length);
  }

  // Inputs / commands are tagged-enum shapes (e.g. `{ Pure: {...} }`,
  // `{ Object: {...} }`, `{ MoveCall: {...} }`, `{ TransferObjects: {...} }`).
  // The "kind" is the only key present — extract via Object.keys.
  const tagOf = (x: object): string => Object.keys(x)[0] ?? "<empty>";

  // Inputs: same count, same tag per index.
  expect(gql.inputs).toHaveLength(rpc.inputs.length);
  rpc.inputs.forEach((input, i) => {
    expect(tagOf(gql.inputs[i])).toBe(tagOf(input));
  });

  // Commands: same count, same tag per index.
  expect(gql.commands).toHaveLength(rpc.commands.length);
  rpc.commands.forEach((cmd, i) => {
    expect(tagOf(gql.commands[i])).toBe(tagOf(cmd));
  });

  // Both had gas resolved; the resolver populated `payment`.
  expect(Array.isArray(gql.gasData.payment)).toBe(true);
  expect(Array.isArray(rpc.gasData.payment)).toBe(true);
  // The payment array is allowed to be empty (SIP-58 address-balance path)
  // OR populated with coin objects — but parity means same emptiness.
  expect((gql.gasData.payment ?? []).length === 0).toBe(
    (rpc.gasData.payment ?? []).length === 0,
  );

  // Gas price + budget must be string-typed (numeric strings); we don't
  // compare values — both are resolver-determined and drift between calls.
  expect(typeof gql.gasData.price).toBe(typeof rpc.gasData.price);
  expect(typeof gql.gasData.budget).toBe(typeof rpc.gasData.budget);

  // Self-check: label only used in the error path of the outer expectations.
  expect(label).not.toBe("");
};

describe("createTransactionFor* parity (live mainnet)", () => {
  test("transfer: same TransactionData shape across transports", async () => {
    const transaction = {
      amount: new BigNumber("1000000"),
      coinType: DEFAULT_COIN_TYPE,
      mode: "send" as const,
      recipient: ACTIVE_ACCOUNT,
    };
    const rpc = await createTransaction(
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
      JSON_RPC_ID,
    );
    const gql = await createTransaction(
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
      GRAPHQL_ID,
    );
    assertShapeBothBuilt(rpc.unsigned, gql.unsigned, "transfer");
  }, 90_000);

  test("delegate: same TransactionData shape across transports", async () => {
    const transaction = {
      amount: new BigNumber("1000000000"), // 1 SUI in MIST
      coinType: DEFAULT_COIN_TYPE,
      mode: "delegate" as const,
      recipient: FIGMENT_SUI_VALIDATOR_ADDRESS,
    };
    const rpc = await createTransaction(
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
      JSON_RPC_ID,
    );
    const gql = await createTransaction(
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
      GRAPHQL_ID,
    );
    assertShapeBothBuilt(rpc.unsigned, gql.unsigned, "delegate");
  }, 90_000);

  // TODO: enable once a fresh `stakedSuiId` for `ACTIVE_ACCOUNT` is fixtured
  // (read it from `getDelegatedStakes` at `beforeAll` time and reuse here).
  test.skip("undelegate: same TransactionData shape across transports", async () => {
    const transaction = {
      amount: new BigNumber("0"),
      coinType: DEFAULT_COIN_TYPE,
      mode: "undelegate" as const,
      recipient: ACTIVE_ACCOUNT,
      stakedSuiId: "0x0",
      useAllAmount: true,
    };
    const rpc = await createTransaction(
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
      JSON_RPC_ID,
    );
    const gql = await createTransaction(
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
      GRAPHQL_ID,
    );
    assertShapeBothBuilt(rpc.unsigned, gql.unsigned, "undelegate");
  }, 90_000);
});
