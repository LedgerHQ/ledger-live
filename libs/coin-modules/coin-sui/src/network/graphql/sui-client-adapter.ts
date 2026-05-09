/**
 * Synthetic `ClientWithCoreApi` over a `SuiGraphQLClient` — lets `Transaction.build({ client })` run on
 * GraphQL by implementing the ~7 resolver-critical methods from
 * `@mysten/sui/src/client/core-resolver.ts`; off-path methods throw via the Proxy below.
 * Boundary cast: SDK's `CoreClient` has 17 abstract methods, we cast through `unknown` and rely on
 * the audited resolver call set rather than zero-filling fields we don't honestly populate.
 */
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import type { ClientWithCoreApi, SuiClientTypes } from "@mysten/sui/client";
import type { TransactionPlugin } from "@mysten/sui/transactions";
import { fromBase64, normalizeStructTag, toBase64 } from "@mysten/sui/utils";
import type { SuiGraphQLClient } from "./client";
import {
  ALL_BALANCES_BY_OWNER,
  CHAIN_IDENTIFIER,
  LIST_COINS_BY_OWNER_AND_TYPE,
  MOVE_FUNCTION_BY_NAME,
  OBJECT_BY_ADDRESS,
  SIMULATE_TRANSACTION,
  SYSTEM_STATE_FOR_BUILD,
} from "./queries";
import {
  extractFailureError,
  projectOpenMoveSignature,
  unwrapGraphQL as unwrap,
} from "./utils";

// ----- Helpers -------------------------------------------------------------

const stub = (method: string) => () => {
  throw new Error(
    `[sui-client-adapter] ${method} called but not implemented — ` +
      "the build-flow resolver shouldn't reach this method. If it does, " +
      "Mysten's `coreClientResolveTransactionPlugin` contract has changed.",
  );
};

const DEFAULT_SUI_COIN_TYPE = "0x2::sui::SUI";
/** Schema's `Address.balances(first:)` and `Address.objects(first:)` cap. */
const GRAPHQL_PAGE_LIMIT = 50;
/** Concurrency budget for `getObjects` parallel fetch — bounds proxy fan-out. */
const GET_OBJECTS_CONCURRENCY = 10;
/**
 * Hard cap on `getBalance` pagination — 20 pages × 50 entries = 1000 coin types.
 * Way above any realistic wallet; prevents a runaway loop if the schema ever
 * mis-reports `hasNextPage`.
 */
const GET_BALANCE_MAX_PAGES = 20;

/** Encode raw BCS bytes for the `transaction:` JSON arg of SIMULATE_TRANSACTION. */
function encodeBcsForSimulate(bytes: Uint8Array | string): { bcs: { value: string } } {
  return { bcs: { value: typeof bytes === "string" ? bytes : toBase64(bytes) } };
}

/**
 * Build the SDK's `Transaction<Include>` shape with the minimum the resolver
 * reads (`digest`, `signatures`, `status`). Other `Include`-conditional fields
 * stay `undefined` — covered by the resolver-call audit. Used by both
 * `simulateTransaction` and `executeTransaction`.
 */
function makeTxShape(args: {
  digest: string;
  signatures: string[];
  success: boolean;
  errorMessage?: string;
  effects?: SuiClientTypes.TransactionEffects;
}): SuiClientTypes.Transaction<{}> {
  const status = args.success
    ? ({ $kind: "Success", Success: true } as never)
    : ({
        $kind: "Failure",
        Failure: { error: { message: args.errorMessage ?? "transaction execution failed" } },
      } as never);
  return {
    digest: args.digest,
    signatures: args.signatures,
    epoch: null,
    status,
    effects: (args.effects ?? undefined) as never,
    balanceChanges: undefined as never,
    events: undefined as never,
    objectTypes: undefined as never,
    transaction: undefined as never,
    bcs: undefined as never,
  };
}

// ----- Adapter factory ---------------------------------------------------

/**
 * Build a `ClientWithCoreApi` whose resolver-critical methods route through
 * `api`. Pass to `Transaction.build({ client: makeSuiClientFromGraphQL(api) })`.
 */
export function makeSuiClientFromGraphQL(api: SuiGraphQLClient): ClientWithCoreApi {
  const core: Record<string, unknown> = {
    // ===== Resolver critical-path =====

    async getCurrentSystemState(
      _options?: SuiClientTypes.GetCurrentSystemStateOptions,
    ): Promise<SuiClientTypes.GetCurrentSystemStateResponse> {
      const res = await api.query({ query: SYSTEM_STATE_FOR_BUILD });
      const data = unwrap("SystemStateForBuild", res);
      const epoch = data.epoch;
      // `referenceGasPrice` is mandatory for build — no neutral default.
      // Throw on missing rather than ship silently-wrong gas pricing.
      if (epoch?.referenceGasPrice === null || epoch?.referenceGasPrice === undefined) {
        throw new Error(
          "GraphQL SystemStateForBuild: missing referenceGasPrice — schema drift?",
        );
      }
      // Resolver only reads `referenceGasPrice` and `epoch`. The rest of the
      // SDK contract (parameters/storageFund/stakeSubsidy/etc.) is type-only
      // padding — we cast through `unknown` rather than zero-fill 25 fields
      // we don't populate honestly.
      return {
        systemState: {
          epoch: String(epoch?.epochId ?? "0"),
          referenceGasPrice: String(epoch.referenceGasPrice),
          epochStartTimestampMs: String(epoch?.startTimestamp ?? "0"),
        },
      } as unknown as SuiClientTypes.GetCurrentSystemStateResponse;
    },

    async getChainIdentifier(
      _options?: SuiClientTypes.GetChainIdentifierOptions,
    ): Promise<SuiClientTypes.GetChainIdentifierResponse> {
      const res = await api.query({ query: CHAIN_IDENTIFIER });
      const data = unwrap("ChainIdentifier", res);
      return { chainIdentifier: data.chainIdentifier ?? "" };
    },

    async getBalance(
      options: SuiClientTypes.GetBalanceOptions,
    ): Promise<SuiClientTypes.GetBalanceResponse> {
      const coinType = options.coinType ?? DEFAULT_SUI_COIN_TYPE;
      // GraphQL returns coin types in canonical 32-byte form (e.g. `0x000...0002::sui::SUI`)
      // but callers pass shorthand (`0x2::sui::SUI`); normalize both before comparing.
      const target = normalizeStructTag(coinType);
      // The schema has no single-balance accessor on `Address` — only the
      // 50-cap paginated `balances` connection. Walk pages until we find the
      // requested type or exhaust them, capped at GET_BALANCE_MAX_PAGES so a
      // pathological wallet can't stall the build path.
      const fetchPage = (cursor: string | null) =>
        api.query({
          query: ALL_BALANCES_BY_OWNER,
          variables: { owner: options.owner, limit: GRAPHQL_PAGE_LIMIT, cursor },
        });
      let cursor: string | null = null;
      let total = "0";
      let addr = "0";
      for (let page = 0; page < GET_BALANCE_MAX_PAGES; page++) {
        const res = await fetchPage(cursor);
        const data = unwrap("AllBalances", res);
        const conn = data.address?.balances;
        const nodes = conn?.nodes ?? [];
        const match = nodes.find(
          n => n.coinType?.repr && normalizeStructTag(n.coinType.repr) === target,
        );
        if (match) {
          total = String(match.totalBalance ?? "0");
          addr = String(match.addressBalance ?? "0");
          break;
        }
        if (!conn?.pageInfo?.hasNextPage) break;
        const next = conn.pageInfo.endCursor ?? null;
        if (!next) break;
        cursor = next;
      }
      // Mirror the JSON-RPC `client.core.getBalance` contract
      // (`@mysten/sui/jsonRpc/core.ts:226-243`): `coinBalance` is the
      // total minus the SIP-58 address-balance reservation.
      const coinBalance = String(BigInt(total) - BigInt(addr));
      return {
        balance: {
          coinType,
          balance: total,
          coinBalance,
          addressBalance: addr,
        },
      };
    },

    async listCoins(
      options: SuiClientTypes.ListCoinsOptions,
    ): Promise<SuiClientTypes.ListCoinsResponse> {
      const coinType = options.coinType ?? DEFAULT_SUI_COIN_TYPE;
      // GraphQL caps `first:` at 50; JSON-RPC has no cap. Clamp here so a
      // caller passing a larger limit gets server-side pagination instead
      // of a query rejection.
      const first = Math.min(options.limit ?? GRAPHQL_PAGE_LIMIT, GRAPHQL_PAGE_LIMIT);
      const res = await api.query({
        query: LIST_COINS_BY_OWNER_AND_TYPE,
        variables: {
          owner: options.owner,
          type: `0x2::coin::Coin<${coinType}>`,
          first,
          after: options.cursor ?? null,
        },
      });
      const data = unwrap("ListCoins", res);
      const conn = data.address?.objects;
      const objects: SuiClientTypes.Coin[] = (conn?.nodes ?? []).map(node => {
        const balance =
          node.contents?.json && typeof node.contents.json === "object"
            ? String((node.contents.json as { balance?: string | number }).balance ?? "0")
            : "0";
        return {
          objectId: node.address,
          version: String(node.version),
          digest: node.digest ?? "",
          // Resolver doesn't read owner for gas-coin selection; populate as AddressOwner of `options.owner`.
          owner: { $kind: "AddressOwner", AddressOwner: options.owner } as never,
          type: `0x2::coin::Coin<${coinType}>`,
          balance,
        };
      });
      return {
        objects,
        hasNextPage: conn?.pageInfo?.hasNextPage ?? false,
        cursor: conn?.pageInfo?.endCursor ?? null,
      };
    },

    async getObjects<Include extends SuiClientTypes.ObjectInclude = {}>(
      options: SuiClientTypes.GetObjectsOptions<Include>,
    ): Promise<SuiClientTypes.GetObjectsResponse<Include>> {
      // Bounded fan-out: with N objects we'd otherwise issue N parallel
      // queries against the proxy; cap at GET_OBJECTS_CONCURRENCY.
      const results = await promiseAllBatched(
        GET_OBJECTS_CONCURRENCY,
        options.objectIds,
        async id => {
          try {
            const res = await api.query({
              query: OBJECT_BY_ADDRESS,
              variables: { address: id },
            });
            const data = unwrap("ObjectByAddress", res);
            const obj = data.object;
            if (!obj) {
              return new Error(`object ${id} not found`);
            }
            const ownerNode = obj.owner as
              | { __typename?: string; address?: { address?: string }; initialSharedVersion?: string }
              | null
              | undefined;
            // Discriminated union projection — `__typename` from the schema → `$kind`.
            // Schema field for the address-string: `AddressOwner.address.address`
            // (the outer `address` is an `Address` object).
            const owner = (() => {
              switch (ownerNode?.__typename) {
                case "AddressOwner":
                case "ConsensusAddressOwner":
                  return {
                    $kind: "AddressOwner",
                    AddressOwner: ownerNode.address?.address ?? "",
                  };
                case "Shared":
                  return {
                    $kind: "Shared",
                    Shared: { initialSharedVersion: String(ownerNode.initialSharedVersion ?? "0") },
                  };
                case "Immutable":
                  return { $kind: "Immutable", Immutable: true };
                case "ObjectOwner":
                  return {
                    $kind: "ObjectOwner",
                    ObjectOwner: ownerNode.address?.address ?? "",
                  };
                default:
                  // Schema drift: an unknown `__typename` is silently coerced to
                  // `Immutable` to keep the build flow alive, but log so the
                  // drift surfaces in triage instead of producing wrong gas/owner.
                  log("warn", "sui-graphql:unknown-owner-typename", {
                    objectId: id,
                    typename: ownerNode?.__typename ?? null,
                  });
                  return { $kind: "Immutable", Immutable: true };
              }
            })();
            // `getInputObjects` (used by clear-signing for token transfers)
            // requests `include.objectBcs: true` and reads the field; populate
            // when the schema returned bytes (Base64 → Uint8Array).
            const objectBcs = obj.objectBcs
              ? (fromBase64(obj.objectBcs) as never)
              : (undefined as never);
            return {
              objectId: obj.address,
              version: String(obj.version),
              digest: obj.digest ?? "",
              owner: owner as never,
              type: obj.asMoveObject?.contents?.type?.repr ?? "",
              // Resolver-audit confirmed these aren't read on the build path.
              content: undefined as never,
              previousTransaction: undefined as never,
              objectBcs,
              json: undefined as never,
              display: undefined as never,
            } as SuiClientTypes.Object<Include>;
          } catch (err) {
            return err instanceof Error ? err : new Error(String(err));
          }
        },
      );
      return { objects: results };
    },

    async simulateTransaction<
      Include extends SuiClientTypes.SimulateTransactionInclude = {},
    >(
      options: SuiClientTypes.SimulateTransactionOptions<Include>,
    ): Promise<SuiClientTypes.SimulateTransactionResult<Include>> {
      const transactionBcs =
        options.transaction instanceof Uint8Array
          ? options.transaction
          : await options.transaction.build({});
      const res = await api.query({
        query: SIMULATE_TRANSACTION,
        variables: { transaction: encodeBcsForSimulate(transactionBcs) },
      });
      const data = unwrap("SimulateTransaction", res);
      const eff = data.simulateTransaction?.effects;
      // Failure cases: missing effects, or effects with `status: FAILURE`. The
      // schema can return populated effects on a failed dry-run, so the only
      // reliable success signal is `status === "SUCCESS"`. Without this, a
      // failed simulation surfaces as a $0-gas success and the resolver
      // builds a transaction with a bad gas budget.
      const failed = eff?.status !== "SUCCESS";
      if (failed) {
        const errorMessage = eff
          ? extractFailureError((eff.effectsJson ?? {}) as Record<string, unknown>)
          : "simulation returned no effects";
        return {
          $kind: "FailedTransaction",
          FailedTransaction: makeTxShape({
            digest: "",
            signatures: [],
            success: false,
            errorMessage,
          }),
          commandResults: undefined as never,
        } as unknown as SuiClientTypes.SimulateTransactionResult<Include>;
      }
      const gas = eff.gasEffects?.gasSummary;
      return {
        $kind: "Transaction",
        Transaction: makeTxShape({
          digest: "",
          signatures: [],
          success: true,
          effects: {
            gasUsed: {
              computationCost: String(gas?.computationCost ?? "0"),
              storageCost: String(gas?.storageCost ?? "0"),
              storageRebate: String(gas?.storageRebate ?? "0"),
              nonRefundableStorageFee: "0",
            },
          } as never,
        }),
        commandResults: undefined as never,
      } as unknown as SuiClientTypes.SimulateTransactionResult<Include>;
    },

    async getMoveFunction(
      options: SuiClientTypes.GetMoveFunctionOptions,
    ): Promise<SuiClientTypes.GetMoveFunctionResponse> {
      const res = await api.query({
        query: MOVE_FUNCTION_BY_NAME,
        variables: {
          package: options.packageId,
          module: options.moduleName,
          function: options.name,
        },
      });
      const data = unwrap("MoveFunctionByName", res);
      const fn = data.package?.module?.function;
      if (!fn) {
        throw new Error(
          `MoveFunction ${options.packageId}::${options.moduleName}::${options.name} not found`,
        );
      }
      const visibilityMap: Record<string, SuiClientTypes.Visibility> = {
        PUBLIC: "public",
        FRIEND: "friend",
        PRIVATE: "private",
      };
      const visibility: SuiClientTypes.Visibility = fn.visibility
        ? (visibilityMap[fn.visibility] ?? "unknown")
        : "unknown";
      return {
        function: {
          packageId: options.packageId,
          moduleName: options.moduleName,
          name: options.name,
          visibility,
          isEntry: Boolean(fn.isEntry),
          typeParameters: (fn.typeParameters ?? []).map(tp => ({
            isPhantom: false,
            constraints: ((tp.constraints ?? []) as string[]).map(
              c => c.toLowerCase() as SuiClientTypes.Ability,
            ),
          })),
          parameters: (fn.parameters ?? []).map(p => projectOpenMoveSignature(p.signature)),
          returns: (fn.return ?? []).map(p => projectOpenMoveSignature(p.signature)),
        },
      };
    },

    // Returning `undefined` triggers the SDK's `?? coreClientResolveTransactionPlugin`
    // fallback (see `@mysten/sui/src/transactions/resolve.ts:65`). The internal
    // plugin isn't exported publicly, so this is the only stable hook.
    resolveTransactionPlugin(): TransactionPlugin | undefined {
      return undefined;
    },

  };

  // Off-path methods (`getObject`, `listOwnedObjects`, `executeTransaction`, etc.) are
  // proxied to fail-loud stubs. The build resolver only calls 7 read methods + an
  // optional `simulateTransaction` (audited against `@mysten/sui/src/client/core-resolver.ts`);
  // anything else means Mysten changed the contract and the build path is now wrong.
  // Catching this with a Proxy is future-proof against new resolver methods.
  const coreProxy = new Proxy(core, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && !(prop in target)) {
        return stub(prop);
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return { core: coreProxy } as unknown as ClientWithCoreApi;
}

export type { ClientWithCoreApi, SuiClientTypes };
