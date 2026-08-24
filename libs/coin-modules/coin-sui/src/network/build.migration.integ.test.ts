/**
 * Build-flow shape parity: `createTransaction` outputs must have the same
 * structural shape across the gRPC and GraphQL transports. Mirrors the
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
import { getEnv } from "@ledgerhq/live-env";
import { parseTransactionBcs } from "@mysten/sui/client";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { createTransaction, DEFAULT_COIN_TYPE } from "./sdk";

const GRPC_ID = "sui-grpc-build-mig";
const GRAPHQL_ID = "sui-graphql-build-mig";

/** Same mainnet account used in sdk.migration.integ.test — holds USDC + ~4.6k SUI. */
const ACTIVE_ACCOUNT = "0x0feb54a725aa357ff2f5bc6bb023c05b310285bd861275a30521f339a434ebb3";

beforeAll(() => {
  coinConfig.setCoinConfig(id => {
    const node = {
      url: getEnv("API_SUI_NODE_PROXY"),
      graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
      grpcUrl: getEnv("API_SUI_GRPC_PROXY"),
    };
    if (id === GRPC_ID) {
      return { node, status: { type: "active" }, features: { transport: "grpc" } };
    }
    if (id === GRAPHQL_ID) {
      return { node, status: { type: "active" }, features: { transport: "graphql" } };
    }
    throw new Error(`Unknown currency id in build migration test: ${id}`);
  });
});

/**
 * Decode the BCS bytes via Mysten's parser and assert structural parity.
 * Both decoded objects share `SuiClientTypes.TransactionData` (i.e.
 * `SerializedTransactionDataV2`).
 */
const assertShapeBothBuilt = (grpcBytes: Uint8Array, gqlBytes: Uint8Array, label: string) => {
  const grpc = parseTransactionBcs(grpcBytes);
  const gql = parseTransactionBcs(gqlBytes);

  // Version must match — both should produce v2.
  expect(gql.version).toBe(grpc.version);

  // Sender shape: same kind (address string with same length).
  expect(typeof gql.sender).toBe(typeof grpc.sender);
  if (typeof grpc.sender === "string" && typeof gql.sender === "string") {
    expect(gql.sender.length).toBe(grpc.sender.length);
  }

  // Inputs / commands are tagged-enum shapes (e.g. `{ Pure: {...} }`,
  // `{ Object: {...} }`, `{ MoveCall: {...} }`, `{ TransferObjects: {...} }`).
  // The "kind" is the only key present — extract via Object.keys.
  const tagOf = (x: object): string => Object.keys(x)[0] ?? "<empty>";

  // Inputs: same count, same tag per index.
  expect(gql.inputs).toHaveLength(grpc.inputs.length);
  grpc.inputs.forEach((input, i) => {
    expect(tagOf(gql.inputs[i])).toBe(tagOf(input));
  });

  // Commands: same count, same tag per index.
  expect(gql.commands).toHaveLength(grpc.commands.length);
  grpc.commands.forEach((cmd, i) => {
    expect(tagOf(gql.commands[i])).toBe(tagOf(cmd));
  });

  // Both had gas resolved; the resolver populated `payment`.
  expect(Array.isArray(gql.gasData.payment)).toBe(true);
  expect(Array.isArray(grpc.gasData.payment)).toBe(true);
  // The payment array is allowed to be empty (SIP-58 address-balance path)
  // OR populated with coin objects — but parity means same emptiness.
  expect((gql.gasData.payment ?? []).length === 0).toBe((grpc.gasData.payment ?? []).length === 0);

  // Gas price + budget must be string-typed (numeric strings); we don't
  // compare values — both are resolver-determined and drift between calls.
  expect(typeof gql.gasData.price).toBe(typeof grpc.gasData.price);
  expect(typeof gql.gasData.budget).toBe(typeof grpc.gasData.budget);

  // Self-check: label only used in the error path of the outer expectations.
  expect(label).not.toBe("");
};

// gRPC is the reference leg. It replaced JSON-RPC here after the Sui Foundation retired the public
// mainnet fullnode (wk of 2026-07-20), which left this suite skipped with no runnable baseline.
describe("createTransactionFor* parity (live mainnet)", () => {
  test("transfer: same TransactionData shape across transports", async () => {
    const transaction = {
      amount: new BigNumber("1000000"),
      coinType: DEFAULT_COIN_TYPE,
      mode: "send" as const,
      recipient: ACTIVE_ACCOUNT,
    };
    const grpc = await createTransaction(
      coinConfig.getCoinConfig(GRPC_ID),
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
    );
    const gql = await createTransaction(
      coinConfig.getCoinConfig(GRAPHQL_ID),
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
    );
    assertShapeBothBuilt(grpc.unsigned, gql.unsigned, "transfer");
  }, 90_000);

  test("delegate: same TransactionData shape across transports", async () => {
    const transaction = {
      amount: new BigNumber("1000000000"), // 1 SUI in MIST
      coinType: DEFAULT_COIN_TYPE,
      mode: "delegate" as const,
      recipient: FIGMENT_SUI_VALIDATOR_ADDRESS,
    };
    const grpc = await createTransaction(
      coinConfig.getCoinConfig(GRPC_ID),
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
    );
    const gql = await createTransaction(
      coinConfig.getCoinConfig(GRAPHQL_ID),
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
    );
    assertShapeBothBuilt(grpc.unsigned, gql.unsigned, "delegate");
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
    const grpc = await createTransaction(
      coinConfig.getCoinConfig(GRPC_ID),
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
    );
    const gql = await createTransaction(
      coinConfig.getCoinConfig(GRAPHQL_ID),
      ACTIVE_ACCOUNT,
      transaction,
      false,
      undefined,
    );
    assertShapeBothBuilt(grpc.unsigned, gql.unsigned, "undelegate");
  }, 90_000);
});
