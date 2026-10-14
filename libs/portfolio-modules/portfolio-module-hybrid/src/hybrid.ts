import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type {
  Network,
  PageQuery,
  PageView,
  PortfolioApi,
  ReadFilter,
} from "@ledgerhq/portfolio-module-framework";
import { cachedSideNetworks } from "./networks";
import { readSidePages, sideQuery, sortByTime } from "./pages";
import {
  mergePortfolios,
  orNotFound,
  ownsAccount,
  ownsRegistration,
  type SidePortfolios,
} from "./portfolios";
import { defaultRouteRead, defaultRouteRegistration, defaultRouteWrite } from "./routing";
import { SIDES, groupBySide, onBothSides } from "./sides";
import { decodeCursors } from "./token";
import type { HybridPortfolioApi, HybridPortfolioConfig, Side } from "./types";

/**
 * A PortfolioApi served by two implementations: registrations, network reads and writes are
 * routed per network, portfolio reads merge both sides.
 */
export function createHybridPortfolio({
  local,
  remote,
  routeRegistration = defaultRouteRegistration,
  routeRead = defaultRouteRead,
  routeWrite = defaultRouteWrite,
}: HybridPortfolioConfig): HybridPortfolioApi {
  const apis: Record<Side, PortfolioApi> = { local, remote };
  const networks = cachedSideNetworks(apis);

  const sidePortfolios = (portfolioId: string): Promise<SidePortfolios> =>
    onBothSides(side => orNotFound(apis[side].getPortfolio(portfolioId)));
  const readApi = async (network: Network) => apis[routeRead(network, await networks())];
  const writeApi = async (network: Network) => apis[routeWrite(network, await networks())];

  async function accountSide(portfolioId: string, accountId: string): Promise<Side> {
    const portfolios = await sidePortfolios(portfolioId);
    const side = SIDES.find(side => ownsAccount(portfolios[side], accountId));
    if (side === undefined) {
      throw new PortfolioApiError("NOT_FOUND", `Account ${accountId} not found`);
    }
    return side;
  }

  async function readSides(portfolioId: string, filter: ReadFilter): Promise<readonly Side[]> {
    const { account, network } = filter;
    if (account !== undefined) return [await accountSide(portfolioId, account)];
    if (network === undefined) return SIDES;
    const served = await networks();
    return SIDES.filter(side => served[side].includes(network));
  }

  async function readPages<T>(
    portfolioId: string,
    query: PageQuery & ReadFilter,
    read: (api: PortfolioApi, token: string | undefined) => Promise<PageView<T>>,
  ) {
    const cursors = query.token ? decodeCursors(query.token) : {};
    const sides = await readSides(portfolioId, query);
    return readSidePages(portfolioId, sides, cursors, (side, token) => read(apis[side], token));
  }

  return {
    getPortfolio: async portfolioId =>
      mergePortfolios(portfolioId, await sidePortfolios(portfolioId)),

    createPortfolio: async portfolioId =>
      mergePortfolios(
        portfolioId,
        await onBothSides(side => apis[side].createPortfolio(portfolioId)),
      ),

    addRegistrations: async (portfolioId, registrations) => {
      const served = await networks();
      const groups = groupBySide(registrations, registration =>
        routeRegistration(registration, served),
      );
      const portfolios = await onBothSides(side =>
        groups[side].length > 0
          ? apis[side].addRegistrations(portfolioId, groups[side])
          : orNotFound(apis[side].getPortfolio(portfolioId)),
      );
      return mergePortfolios(portfolioId, portfolios);
    },

    removeRegistrations: async (portfolioId, registrationIds) => {
      const portfolios = await sidePortfolios(portfolioId);
      const updated = await onBothSides(side => {
        const owned = registrationIds.filter(id => ownsRegistration(portfolios[side], id));
        return owned.length > 0
          ? apis[side].removeRegistrations(portfolioId, owned)
          : portfolios[side];
      });
      return mergePortfolios(portfolioId, updated);
    },

    addAddresses: async (portfolioId, accountId, request) =>
      apis[await accountSide(portfolioId, accountId)].addAddresses(portfolioId, accountId, request),

    getUpdates: async (portfolioId, query = {}) => {
      const page = await readPages(portfolioId, query, (api, token) =>
        api.getUpdates(portfolioId, sideQuery(query, token)),
      );
      return { ...page, items: sortByTime(page.items, query.order) };
    },

    getPortfolioBalance: (portfolioId, query = {}) =>
      readPages(portfolioId, query, (api, token) =>
        api.getPortfolioBalance(portfolioId, sideQuery(query, token)),
      ),

    getPortfolioBalanceHistory: (portfolioId, query = {}) =>
      readPages(portfolioId, query, (api, token) =>
        api.getPortfolioBalanceHistory(portfolioId, sideQuery(query, token)),
      ),

    listNetworks: async () => {
      const served = await networks();
      return [...new Set([...served.local, ...served.remote])];
    },
    getLastBlock: async network => (await readApi(network)).getLastBlock(network),
    getValidators: async (network, query) => (await readApi(network)).getValidators(network, query),
    validateAddress: async (network, address) =>
      (await readApi(network)).validateAddress(network, address),
    getNextSequence: async (network, address) =>
      (await readApi(network)).getNextSequence(network, address),

    estimateTransactionFee: async (network, request) =>
      (await writeApi(network)).estimateTransactionFee(network, request),
    encodeTransaction: async (network, request) =>
      (await writeApi(network)).encodeTransaction(network, request),
    combineTransaction: async (network, request) =>
      (await writeApi(network)).combineTransaction(network, request),
    broadcastTransaction: async (network, request) =>
      (await writeApi(network)).broadcastTransaction(network, request),

    sync: async (portfolioId, options) => {
      await local.sync?.(portfolioId, options);
    },
  };
}
