import type { CallParams, CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getNodeApi, isExternalNodeConfig, type NodeApi } from "@ledgerhq/coin-evm/network";
import { fetchRedelegations } from "@ledgerhq/coin-evm/staking";
import type { ChainReads, TransactionInfo } from "@ledgerhq/ledger-wallet-framework/api/types";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";

type NodeTransaction = Awaited<ReturnType<NodeApi["getTransaction"]>>;

/** The explorer answers an unknown hash with a 404. */
const isUnknownHash = (error: unknown): boolean =>
  error instanceof Error &&
  error.name === "LedgerAPI4xx" &&
  (error as { status?: unknown }).status === 404;

async function nodeTransaction(
  nodeApi: NodeApi,
  hash: string,
): Promise<NodeTransaction | undefined> {
  try {
    return await nodeApi.getTransaction(hash);
  } catch (error) {
    if (isUnknownHash(error)) return undefined;
    throw error;
  }
}

/**
 * `context`, its external node making one attempt per RPC call: coin-evm retries a failed one
 * (3 times, 5 s apart by default), an expected revert included.
 */
function singleAttemptContext(context: Context<EvmConfigInfo>): Context<EvmConfigInfo> {
  return {
    ...context,
    config: async (id?: string) => {
      const config = await context.config(id);
      return isExternalNodeConfig(config.node)
        ? { ...config, node: { ...config.node, retries: 0 } }
        : config;
    },
  };
}

/**
 * The reads the EVM legacy path makes beyond coin-evm, which reports no account metadata and looks
 * no transaction up yet (G1, G2): the redelegations of the Cosmos staking module (Sei, through the
 * address precompile), and a transaction as the node knows it. The portfolio path never consults
 * these: there, both are absent until coin-evm serves them.
 *
 * `call` is coin-evm's, in one attempt: the address precompile reverts for every Sei account not
 * associated yet, which the readiness check reads as such, so retrying it would delay each sync of
 * those accounts by the retries (as the readiness check made it before it read through `call`).
 */
export function legacyChainReads(
  _currency: CryptoCurrency,
  coinModuleApi: CoinModuleApi<any, any, any>,
  context: Context<any>,
): Partial<ChainReads> {
  const evmContext = context as Context<EvmConfigInfo>;
  return {
    call: async params => {
      const { call, supports } = coinModuleApi as CoinModuleApi<any, any, any> & {
        supports?: (method: string) => boolean;
      };
      if (!call || supports?.("call") === false) {
        throw new ChainReadUnsupportedError("call is not supported by the coin module");
      }
      return call.call(coinModuleApi, singleAttemptContext(evmContext), params as CallParams);
    },

    getAccountInfo: async address => {
      const config = await evmContext.config();
      const [info, redelegations] = await Promise.all([
        coinModuleApi.getAccountInfo?.(context, address),
        // Non-blocking, as the sync always took it: a failed lookup reports none.
        fetchRedelegations(config, address, context.logger).catch(() => []),
      ]);
      return { ...(info ?? { type: "none" }), redelegations };
    },

    getTransactionInfo: async (hash): Promise<TransactionInfo | undefined> => {
      const config = await evmContext.config();
      const nodeApi = getNodeApi(config, context.logger);
      const tx = await nodeTransaction(nodeApi, hash);
      if (!tx) return undefined;
      const block = tx.blockHeight ? await nodeApi.getBlockByHeight(tx.blockHeight) : undefined;
      return {
        hash: tx.hash,
        block: block
          ? {
              height: block.height,
              hash: tx.blockHash ?? block.hash,
              time: new Date(block.timestamp),
            }
          : null,
        fee: BigInt(new BigNumber(tx.gasPrice).multipliedBy(tx.gasUsed).toFixed()),
        value: BigInt(tx.value),
        sequence: BigInt(tx.nonce),
        // The calldata only through an external node, as the redelegation decoding always read it.
        ...(isExternalNodeConfig(config.node) && tx.input ? { data: tx.input } : {}),
      };
    },
  };
}
