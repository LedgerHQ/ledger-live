import {
  DEFAULT_PORTFOLIO_MODE,
  PortfolioApiError,
  requireExtension,
} from "@ledgerhq/portfolio-module-framework";
import type {
  AccountExtensionMethod,
  Network,
  NetworkExtensionMethod,
  PageQuery,
  PageView,
  PortfolioApi,
  ReadFilter,
  Registration,
  WriteExtensionMethod,
} from "@ledgerhq/portfolio-module-framework";
import { memoizeModes, resolveMode, type Modes } from "./modes";
import { readSidePages, sideQuery, sortByTime } from "./pages";
import {
  mergePortfolios,
  orNotFound,
  ownsAccount,
  portfolioNotFound,
  type SidePortfolios,
} from "./portfolios";
import { hybridTwins } from "./registrations";
import { readSide, registrationNetwork, registrationSides, writeSide } from "./routing";
import { SIDES, groupBySides, onBothSides } from "./sides";
import { decodeCursors } from "./token";
import type { HybridPortfolioApi, HybridPortfolioConfig, ModeOf, Side } from "./types";
import { visibleOn, visiblePortfolios } from "./visibility";

const defaultModeOf: ModeOf = () => DEFAULT_PORTFOLIO_MODE;

const idOf = ({ id }: Registration) => id;

/**
 * A PortfolioApi served by two implementations, each network by the sides its mode names. Every
 * operation resolves the mode of a network once, and answers only what the side serving the
 * network's reads holds: the local twins of hybrid registrations stay hidden. Extensions are
 * routed on what each side serves, never retried on the other side after a failure: a network read
 * goes to the read side when it serves it, else to the write side; a write to the write side; an
 * account read to the side holding the account, a hidden twin included.
 */
export function createHybridPortfolio({
  local,
  remote,
  modeOf = defaultModeOf,
}: HybridPortfolioConfig): HybridPortfolioApi {
  const apis: Record<Side, PortfolioApi> = { local, remote };

  const sidePortfolios = (portfolioId: string): Promise<SidePortfolios> =>
    onBothSides(side => orNotFound(apis[side].getPortfolio(portfolioId)));
  const visibleMerge = async (portfolioId: string, portfolios: SidePortfolios, modes: Modes) =>
    mergePortfolios(portfolioId, await visiblePortfolios(portfolios, modes));
  const readApi = async (network: Network) => apis[readSide(await resolveMode(modeOf, network))];
  const writeApi = async (network: Network) => apis[writeSide(await resolveMode(modeOf, network))];

  /** A network extension: the read side's when it serves it, else the write side's. */
  async function networkExtension<K extends NetworkExtensionMethod>(network: Network, name: K) {
    const mode = await resolveMode(modeOf, network);
    const serving = [readSide(mode), writeSide(mode)]
      .map(side => apis[side])
      .find(api => api[name] !== undefined);
    if (!serving) {
      throw new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served for ${network}`);
    }
    return requireExtension(serving, name);
  }

  /** A write extension: the write side's. */
  async function writeExtension<K extends WriteExtensionMethod>(network: Network, name: K) {
    const api = await writeApi(network);
    if (api[name] === undefined) {
      throw new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served for ${network}`);
    }
    return requireExtension(api, name);
  }

  /**
   * The side whose portfolio holds the account, its hidden twins included: the account reads a
   * client needs (fresh address, outputs) come from the side syncing the account. The local side
   * is asked first: an account it holds is read without the remote side, which may be down.
   */
  async function holderSide(portfolioId: string, accountId: string): Promise<Side> {
    const local = await orNotFound(apis.local.getPortfolio(portfolioId));
    if (ownsAccount(local, accountId)) return "local";
    const remote = await orNotFound(apis.remote.getPortfolio(portfolioId));
    if (local === undefined && remote === undefined) throw portfolioNotFound(portfolioId);
    if (ownsAccount(remote, accountId)) return "remote";
    throw new PortfolioApiError("NOT_FOUND", `Account ${accountId} not found`);
  }

  /** An account extension: the one of the side holding the account. */
  async function accountExtension<K extends AccountExtensionMethod>(
    portfolioId: string,
    accountId: string,
    name: K,
  ) {
    const api = apis[await holderSide(portfolioId, accountId)];
    if (api[name] === undefined) {
      throw new PortfolioApiError(
        "METHOD_NOT_ALLOWED",
        `${name} is not served for account ${accountId}`,
      );
    }
    return requireExtension(api, name);
  }

  async function accountSide(portfolioId: string, accountId: string, modes: Modes): Promise<Side> {
    const portfolios = await visiblePortfolios(await sidePortfolios(portfolioId), modes);
    const side = SIDES.find(side => ownsAccount(portfolios[side], accountId));
    if (side === undefined) {
      throw new PortfolioApiError("NOT_FOUND", `Account ${accountId} not found`);
    }
    return side;
  }

  async function readSides(
    portfolioId: string,
    { account, network }: ReadFilter,
    modes: Modes,
  ): Promise<readonly Side[]> {
    if (account !== undefined) return [await accountSide(portfolioId, account, modes)];
    if (network !== undefined) return [readSide(await modes(network))];
    return SIDES;
  }

  async function readPages<T extends { network: Network }>(
    portfolioId: string,
    query: PageQuery & ReadFilter,
    read: (api: PortfolioApi, token: string | undefined) => Promise<PageView<T>>,
  ) {
    const cursors = query.token ? decodeCursors(query.token) : {};
    const modes = memoizeModes(modeOf);
    const sides = await readSides(portfolioId, query, modes);
    return readSidePages(portfolioId, sides, cursors, async (side, token) => {
      const page = await read(apis[side], token);
      const items = await visibleOn(side, page.items ?? [], ({ network }) => network, modes);
      return { ...page, items };
    });
  }

  return {
    getPortfolio: async portfolioId =>
      visibleMerge(portfolioId, await sidePortfolios(portfolioId), memoizeModes(modeOf)),

    createPortfolio: async portfolioId =>
      visibleMerge(
        portfolioId,
        await onBothSides(side => apis[side].createPortfolio(portfolioId)),
        memoizeModes(modeOf),
      ),

    addRegistrations: async (portfolioId, registrations) => {
      const modes = memoizeModes(modeOf);
      const groups = await groupBySides(registrations, async registration =>
        registrationSides(await modes(registrationNetwork(registration))),
      );
      const portfolios = await onBothSides(side =>
        groups[side].length > 0
          ? apis[side].addRegistrations(portfolioId, groups[side])
          : orNotFound(apis[side].getPortfolio(portfolioId)),
      );
      return visibleMerge(portfolioId, portfolios, modes);
    },

    removeRegistrations: async (portfolioId, registrationIds) => {
      const modes = memoizeModes(modeOf);
      const portfolios = await sidePortfolios(portfolioId);
      const visible = await visiblePortfolios(portfolios, modes);
      const ids = new Set(registrationIds);
      const registrationsOf = (side: Side) => visible[side]?.registrations ?? [];
      const held = (side: Side) => registrationsOf(side).filter(({ id }) => ids.has(id));
      const remove = (side: Side, removed: Registration[]) =>
        removed.length > 0
          ? apis[side].removeRegistrations(portfolioId, removed.map(idOf))
          : portfolios[side];

      // The remote goes first: a twin goes only once its remote registration is gone.
      const removedRemote = held("remote");
      const remoteAnswer = await remove("remote", removedRemote);
      const twins = await hybridTwins(
        {
          removed: removedRemote,
          kept: registrationsOf("remote").filter(({ id }) => !ids.has(id)),
          local: portfolios.local?.registrations ?? [],
        },
        modes,
      );
      const localAnswer = await remove("local", [...held("local"), ...twins]);
      return visibleMerge(portfolioId, { local: localAnswer, remote: remoteAnswer }, modes);
    },

    addAddresses: async (portfolioId, accountId, request) => {
      const side = await accountSide(portfolioId, accountId, memoizeModes(modeOf));
      return apis[side].addAddresses(portfolioId, accountId, request);
    },

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
      const served = await onBothSides(side => apis[side].listNetworks());
      return [...new Set([...served.local, ...served.remote])];
    },
    getLastBlock: async network => (await readApi(network)).getLastBlock(network),
    getValidators: async (network, query) => (await readApi(network)).getValidators(network, query),
    // A recipient and a sequence are write inputs: the write side answers them.
    validateAddress: async (network, address, parameters) =>
      (await writeApi(network)).validateAddress(network, address, parameters),
    getNextSequence: async (network, address) =>
      (await writeApi(network)).getNextSequence(network, address),

    estimateTransactionFee: async (network, request) =>
      (await writeApi(network)).estimateTransactionFee(network, request),
    encodeTransaction: async (network, request) =>
      (await writeApi(network)).encodeTransaction(network, request),
    combineTransaction: async (network, request) =>
      (await writeApi(network)).combineTransaction(network, request),
    broadcastTransaction: async (network, request) =>
      (await writeApi(network)).broadcastTransaction(network, request),

    getFreshAddress: async (portfolioId, accountId) =>
      (await accountExtension(portfolioId, accountId, "getFreshAddress"))(portfolioId, accountId),
    getChangeAddress: async (portfolioId, accountId) =>
      (await accountExtension(portfolioId, accountId, "getChangeAddress"))(portfolioId, accountId),
    getAccountAddresses: async (portfolioId, accountId) =>
      (await accountExtension(portfolioId, accountId, "getAccountAddresses"))(
        portfolioId,
        accountId,
      ),
    getAccountUtxos: async (portfolioId, accountId) =>
      (await accountExtension(portfolioId, accountId, "getAccountUtxos"))(portfolioId, accountId),

    getAccountInfo: async (network, address) =>
      (await networkExtension(network, "getAccountInfo"))(network, address),
    call: async (network, request) => (await networkExtension(network, "call"))(network, request),
    getAddressesForPublicKey: async (network, publicKey) =>
      (await networkExtension(network, "getAddressesForPublicKey"))(network, publicKey),
    getTransactionInfo: async (network, hash) =>
      (await networkExtension(network, "getTransactionInfo"))(network, hash),

    validateTransaction: async (network, request) =>
      (await writeExtension(network, "validateTransaction"))(network, request),
    encodeRawTransaction: async (network, request) =>
      (await writeExtension(network, "encodeRawTransaction"))(network, request),

    sync: async (portfolioId, options) => {
      await local.sync?.(portfolioId, options);
    },
  };
}
