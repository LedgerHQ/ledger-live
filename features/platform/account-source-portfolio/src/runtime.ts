import type { Portfolio, PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { portfolioClientOf, type PortfolioClient, type PortfolioDispatch } from "./client";
import { registrationKey, registrationOf, strategyOf } from "./registration";
import {
  portfolioActivityLogged,
  portfolioCallEnded,
  portfolioCallStarted,
  portfolioIdAssigned,
  portfolioListed,
  selectPortfolioId,
  selectPortfolioServer,
  type PortfolioActivityKind,
  type WithPortfolioSource,
} from "./slice";

/** The store the source works in. */
export type PortfolioPorts = {
  readonly dispatch: PortfolioDispatch;
  readonly getState: () => WithPortfolioSource;
};

export type ListedPortfolio = { portfolioId: string; portfolio: Portfolio };

/** Keeps the service portfolio in step with the app's accounts, one reconcile at a time. */
export type PortfolioSourceRuntime = {
  /** Registers the accounts the service does not know yet, never removes any; the portfolio after. */
  ensure(
    ports: PortfolioPorts,
    descriptors: readonly AccountDescriptor[],
  ): Promise<ListedPortfolio>;
  /** Registers what is missing and removes the registrations no account of the app needs. */
  reconcile(ports: PortfolioPorts, descriptors: readonly AccountDescriptor[]): Promise<void>;
  /** Lists the portfolio again, creating it when the service does not know it. */
  refresh(ports: PortfolioPorts): Promise<void>;
  /** Switches to a brand new portfolio id, once the calls in flight are done. */
  renew(ports: PortfolioPorts): Promise<void>;
  /** Runs a call against the service, counted as busy and logged in the activity. */
  logged<T>(
    ports: PortfolioPorts,
    kind: PortfolioActivityKind,
    task: () => Promise<{ value: T; summary: string }>,
  ): Promise<T>;
  client(ports: PortfolioPorts): PortfolioClient;
};

export type PortfolioSourceRuntimeOptions = {
  /** A fresh portfolio id, on first use without a stored one, and on renew. */
  newPortfolioId: () => string;
  /** The id a previous run kept, used before making a new one. */
  storedPortfolioId?: () => string | undefined;
  /** The service calls, the RTK Query endpoints by default. */
  clientOf?: (dispatch: PortfolioDispatch) => PortfolioClient;
};

const describe = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const listed = (ports: PortfolioPorts, portfolioId: string, portfolio: Portfolio) => {
  ports.dispatch(portfolioListed({ portfolioId, portfolio, at: Date.now() }));
  return portfolio;
};

/** The registrations the accounts need, one per key: an EVM address shared by networks registers once. */
const LISTING_MAX_AGE = 60_000;

const isMapped = (descriptor: AccountDescriptor, portfolio: Portfolio) =>
  (strategyOf(descriptor)?.strategy.accountIdsOf(descriptor, portfolio).length ?? 0) > 0;

const wantedOf = (descriptors: readonly AccountDescriptor[]) => {
  const wanted = new Map<string, PortfolioRegistration>();
  for (const descriptor of descriptors) {
    const registration = registrationOf(descriptor);
    const key = registration && registrationKey(registration);
    if (registration && key) wanted.set(key, registration);
  }
  return wanted;
};

export function createPortfolioSourceRuntime({
  newPortfolioId,
  storedPortfolioId = () => undefined,
  clientOf = portfolioClientOf,
}: PortfolioSourceRuntimeOptions): PortfolioSourceRuntime {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  };

  const client = ({ dispatch }: PortfolioPorts) => clientOf(dispatch);

  const portfolioIdOf = (ports: PortfolioPorts): string => {
    const current = selectPortfolioId(ports.getState());
    if (current) return current;
    const assigned = storedPortfolioId() ?? newPortfolioId();
    ports.dispatch(portfolioIdAssigned(assigned));
    return assigned;
  };

  async function logged<T>(
    ports: PortfolioPorts,
    kind: PortfolioActivityKind,
    task: () => Promise<{ value: T; summary: string }>,
  ): Promise<T> {
    const start = Date.now();
    ports.dispatch(portfolioCallStarted());
    const log = (ok: boolean, summary: string) =>
      ports.dispatch(
        portfolioActivityLogged({
          kind: ok ? kind : "error",
          ok,
          summary,
          at: Date.now(),
          durationMs: Date.now() - start,
        }),
      );
    try {
      const { value, summary } = await task();
      log(true, summary);
      return value;
    } catch (error) {
      log(false, `${kind}: ${describe(error)}`);
      throw error;
    } finally {
      ports.dispatch(portfolioCallEnded());
    }
  }

  const list = (ports: PortfolioPorts, portfolioId: string): Promise<Portfolio> =>
    logged(ports, "portfolio", async () => {
      const existing = await client(ports).getPortfolio(portfolioId);
      const portfolio = existing ?? (await client(ports).createPortfolio(portfolioId));
      const accounts = portfolio.accounts?.length ?? 0;
      const registrations = portfolio.registrations?.length ?? 0;
      return {
        value: listed(ports, portfolioId, portfolio),
        summary: `${existing ? "Listed" : "Created"} ${portfolioId}: ${registrations} registrations, ${accounts} accounts`,
      };
    });

  async function sync(
    ports: PortfolioPorts,
    descriptors: readonly AccountDescriptor[],
    prune: boolean,
  ): Promise<ListedPortfolio> {
    const portfolioId = portfolioIdOf(ports);
    const server = selectPortfolioServer(ports.getState());
    // A recent listing that gave every account its ids is enough; an older one may miss a network.
    if (
      !prune &&
      server &&
      Date.now() - server.at < LISTING_MAX_AGE &&
      descriptors.every(descriptor => isMapped(descriptor, server.portfolio))
    ) {
      return { portfolioId, portfolio: server.portfolio };
    }
    let portfolio = await list(ports, portfolioId);
    const wanted = wantedOf(descriptors);
    const known = new Set((portfolio.registrations ?? []).map(registrationKey));
    const missing = [...wanted].filter(([key]) => !known.has(key)).map(([, value]) => value);
    if (missing.length > 0) {
      portfolio = await logged(ports, "register", async () => ({
        value: listed(
          ports,
          portfolioId,
          await client(ports).addRegistrations(portfolioId, missing),
        ),
        summary: `Registered ${missing.length}: ${missing.map(r => r.type).join(", ")}`,
      }));
    }
    if (prune) {
      const extra = (portfolio.registrations ?? []).filter(entry => {
        const key = registrationKey(entry);
        return key === undefined || !wanted.has(key);
      });
      if (extra.length > 0) {
        portfolio = await logged(ports, "prune", async () => ({
          value: listed(
            ports,
            portfolioId,
            await client(ports).removeRegistrations(
              portfolioId,
              extra.map(entry => entry.id),
            ),
          ),
          summary: `Removed ${extra.length} registrations no account needs`,
        }));
      }
    }
    return { portfolioId, portfolio };
  }

  return {
    ensure: (ports, descriptors) => serial(() => sync(ports, descriptors, false)),
    reconcile: async (ports, descriptors) => {
      await serial(() => sync(ports, descriptors, true));
    },
    refresh: async ports => {
      await serial(() => list(ports, portfolioIdOf(ports)));
    },
    renew: async ports => {
      await serial(() => Promise.resolve(ports.dispatch(portfolioIdAssigned(newPortfolioId()))));
    },
    logged,
    client,
  };
}
