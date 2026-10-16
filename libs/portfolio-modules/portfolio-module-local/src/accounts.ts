import { toJsonSafe, type AccountData } from "@ledgerhq/account-module-framework";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import {
  PortfolioApiError,
  type AddressView,
  type PortfolioApi,
  type UtxoView,
} from "@ledgerhq/portfolio-module-framework";
import { localAccountOf, requirePortfolio, type LocalAccount } from "./stored";
import type { AccountUtxo, LocalPortfolioDeps } from "./types";

type AccountEndpoints = Required<
  Pick<
    PortfolioApi,
    "getFreshAddress" | "getChangeAddress" | "getAccountAddresses" | "getAccountUtxos"
  >
>;

/** What a UTXO account module answers beyond `AccountModuleApi` (account-module-utxo). */
type ChangeAddressReader = {
  getChangeAddress?: (
    context: Context<any>,
    account: AccountData,
  ) => Promise<{ address: string; derivationPath: string }>;
};

const toAddressView = ({ address, derivationPath }: { address: string; derivationPath: string }) =>
  ({ address, derivation_path: derivationPath }) satisfies AddressView;

const notServed = (name: string, accountId: string) =>
  new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served for account ${accountId}`);

/**
 * The account reads of the account module: NOT_FOUND for an account the portfolio does not hold,
 * BAD_REQUEST for an account not served locally, METHOD_NOT_ALLOWED for a read its module lacks
 * (the change address and the unspent outputs of a single-address account).
 */
export function accountEndpoints(deps: LocalPortfolioDeps): AccountEndpoints {
  const requireLocalAccount = async (
    portfolioId: string,
    accountId: string,
  ): Promise<LocalAccount> => {
    const portfolio = await requirePortfolio(deps.store, portfolioId);
    const account = portfolio.accounts.find(({ id }) => id === accountId);
    if (!account) throw new PortfolioApiError("NOT_FOUND", `Account ${accountId} not found`);
    const local = localAccountOf(deps, account);
    if (!local) {
      throw new PortfolioApiError("BAD_REQUEST", `Account ${accountId} is not served locally`);
    }
    return local;
  };

  return {
    getFreshAddress: async (portfolioId, accountId) => {
      const { network, data } = await requireLocalAccount(portfolioId, accountId);
      return toAddressView(await network.accountModule.getFreshAddress(network.context, data));
    },

    getChangeAddress: async (portfolioId, accountId) => {
      const { network, data } = await requireLocalAccount(portfolioId, accountId);
      const accountModule = network.accountModule as ChangeAddressReader;
      if (!accountModule.getChangeAddress) throw notServed("getChangeAddress", accountId);
      return toAddressView(await accountModule.getChangeAddress(network.context, data));
    },

    getAccountAddresses: async (portfolioId, accountId) => {
      const { network, data } = await requireLocalAccount(portfolioId, accountId);
      const addresses = await network.accountModule.getAddresses(network.context, data);
      return {
        items: addresses.map(({ address, derivationPath, used }) => ({
          address,
          derivation_path: derivationPath,
          used,
        })),
      };
    },

    getAccountUtxos: async (portfolioId, accountId) => {
      const { network, data } = await requireLocalAccount(portfolioId, accountId);
      const { accountModule } = network;
      if (!accountModule.getUTXOs) throw notServed("getAccountUtxos", accountId);
      const utxos: AccountUtxo[] = await accountModule.getUTXOs(network.context, data);
      return { items: utxos.map(utxo => toJsonSafe(utxo) as UtxoView) };
    },
  };
}
