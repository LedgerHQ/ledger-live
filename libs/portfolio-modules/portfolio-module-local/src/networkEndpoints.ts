import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type { BlockInfo, Validator } from "@ledgerhq/coin-module-framework/api/types";
import type { BlockView, PortfolioApi, ValidatorView } from "@ledgerhq/portfolio-module-framework";
import { requireLocalNetwork } from "./localNetworks";
import type { LocalPortfolioDeps } from "./types";

type NetworkEndpoints = Pick<
  PortfolioApi,
  "listNetworks" | "getLastBlock" | "getValidators" | "validateAddress" | "getNextSequence"
>;

const toBlockView = ({ height, hash, time, parent }: BlockInfo): BlockView => ({
  height,
  hash,
  time: time.toISOString(),
  ...(parent ? { parent: { height: parent.height, hash: parent.hash } } : {}),
});

const toValidatorView = ({
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
      const { coinModule, context } = requireLocalNetwork(networks, name);
      const page = await coinModule.getValidators(context, query);
      return { items: page.items.map(toValidatorView), ...(page.next ? { next: page.next } : {}) };
    },

    validateAddress: async (name, address) => {
      const { coinModule, context, currencyId } = requireLocalNetwork(networks, name);
      return { valid: await coinModule.validateAddress(context, address, { currencyId }) };
    },

    getNextSequence: async (name, address) => {
      const { coinModule, context } = requireLocalNetwork(networks, name);
      return { value: (await coinModule.getNextSequence(context, address)).toString() };
    },
  };
}
