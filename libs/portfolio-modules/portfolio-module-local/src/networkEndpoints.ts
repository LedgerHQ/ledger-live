import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type { BlockInfo, CallParams, Validator } from "@ledgerhq/coin-module-framework/api/types";
import {
  PortfolioApiError,
  type AccountInfoView,
  type BlockView,
  type PortfolioApi,
  type TransactionInfoView,
  type ValidatorView,
} from "@ledgerhq/portfolio-module-framework";
import { requireCapability } from "./capabilities";
import { requireLocalNetwork } from "./localNetworks";
import type { LocalPortfolioDeps } from "./types";

type NetworkEndpoints = Pick<
  PortfolioApi,
  "listNetworks" | "getLastBlock" | "getValidators" | "validateAddress" | "getNextSequence"
> &
  Required<
    Pick<
      PortfolioApi,
      "getAccountInfo" | "call" | "getAddressesForPublicKey" | "getTransactionInfo"
    >
  >;

const toBlockView = ({ height, hash, time, parent }: BlockInfo): BlockView => ({
  height,
  hash,
  time: time.toISOString(),
  ...(parent ? { parent: { height: parent.height, hash: parent.hash } } : {}),
});

const toValidatorView = ({
  id,
  address,
  name,
  description,
  url,
  logo,
  balance,
  commissionRate,
  apy,
}: Validator) =>
  toJsonSafe({
    id,
    address,
    name,
    description,
    url,
    logo,
    balance,
    commissionRate,
    apy,
  }) as ValidatorView;

export function networkEndpoints({ networks }: LocalPortfolioDeps): NetworkEndpoints {
  return {
    listNetworks: async () => Object.keys(networks),

    getLastBlock: async name => {
      const { coinModule, context } = requireLocalNetwork(networks, name);
      return toBlockView(await coinModule.lastBlock(context));
    },

    getValidators: async (name, query) => {
      const network = requireLocalNetwork(networks, name);
      requireCapability(network, "getValidators");
      const page = await network.coinModule.getValidators(network.context, query);
      return { items: page.items.map(toValidatorView), ...(page.next ? { next: page.next } : {}) };
    },

    validateAddress: async (name, address, parameters) => {
      const { coinModule, context, currencyId } = requireLocalNetwork(networks, name);
      return {
        valid: await coinModule.validateAddress(context, address, { currencyId, ...parameters }),
      };
    },

    getNextSequence: async (name, address) => {
      const network = requireLocalNetwork(networks, name);
      requireCapability(network, "getNextSequence");
      const sequence = await network.coinModule.getNextSequence(network.context, address);
      return { value: sequence.toString() };
    },

    /** `{ type: "none" }` when the coin module reports nothing more. */
    getAccountInfo: async (name, address) => {
      const { coinModule, context } = requireLocalNetwork(networks, name);
      const info = (await coinModule.getAccountInfo?.(context, address)) ?? { type: "none" };
      return toJsonSafe(info) as AccountInfoView;
    },

    call: async (name, { params }) => {
      const network = requireLocalNetwork(networks, name);
      requireCapability(network, "call");
      const result = await network.coinModule.call(network.context, params as CallParams);
      return { result: toJsonSafe(result) };
    },

    getAddressesForPublicKey: async (name, publicKey) => {
      const { coinModule, context } = requireLocalNetwork(networks, name);
      if (!coinModule.getAddressesForPublicKey) {
        throw new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} hands out no addresses`);
      }
      return { addresses: await coinModule.getAddressesForPublicKey(context, publicKey) };
    },

    /** undefined when the network does not know the hash. */
    getTransactionInfo: async (name, hash) => {
      const { coinModule, context } = requireLocalNetwork(networks, name);
      if (!coinModule.getTransactionInfo) {
        throw new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} looks up no transaction`);
      }
      const info = await coinModule.getTransactionInfo(context, hash);
      return info && (toJsonSafe(info) as TransactionInfoView);
    },
  };
}
