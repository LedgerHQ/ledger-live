import type { BalanceGroup, Portfolio, PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import { portfolioClientOf, type PortfolioClient, type PortfolioDispatch } from "./client";
import { readBalanceGroups, type ReadGroups } from "./internals/groups";
import { isFreshListing } from "./internals/listing";
import { registrationKey, registrationOf, strategyOf } from "./registration";
import {
  portfolioActivityLogged,
  portfolioCallEnded,
  portfolioCallStarted,
  portfolioListed,
  selectPortfolioServer,
  type PortfolioActivityKind,
  type WithPortfolioSource,
} from "./slice";

/** The store the source works in, and the install's portfolio. */
export type PortfolioPorts = {
  readonly dispatch: PortfolioDispatch;
  readonly getState: () => WithPortfolioSource;
  readonly portfolioId: () => PortfolioId;
};

/** Keeps the service portfolio in step with the app's accounts, one reconcile at a time. */
export type PortfolioSourceRuntime = {
  /** Registers the accounts the service does not know yet, never removes any; the portfolio after. */
  ensure(ports: PortfolioPorts, descriptors: readonly AccountDescriptor[]): Promise<Portfolio>;
  /** Registers what is missing and removes the registrations no account of the app needs. */
  reconcile(ports: PortfolioPorts, descriptors: readonly AccountDescriptor[]): Promise<void>;
  /** Lists the portfolio again, creating it when the service does not know it. */
  refresh(ports: PortfolioPorts): Promise<void>;
  /** The balance groups of these service accounts; batches of one refresh share one scan. */
  balanceGroups(ports: PortfolioPorts, wanted: ReadonlySet<string>): Promise<ReadGroups>;
  /** Runs a call against the service, counted as busy and logged in the activity. */
  logged<T>(
    ports: PortfolioPorts,
    kind: PortfolioActivityKind,
    task: () => Promise<{ value: T; summary: string }>,
  ): Promise<T>;
};

export type PortfolioSourceRuntimeOptions = {
  /** The service calls, the RTK Query endpoints by default. */
  clientOf?: (dispatch: PortfolioDispatch) => PortfolioClient;
  /** How long a full balance scan answers the batches that follow it. */
  scanMaxAge?: number;
};

type Scan = { read: Promise<ReadGroups>; doneAt?: number };

const SCAN_MAX_AGE = 5_000;
/** Up to this many accounts, one filtered call each beats scanning the whole portfolio. */
const FILTERED_READS_UP_TO = 3;

const describe = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const listed = (ports: PortfolioPorts, portfolio: Portfolio) => {
  ports.dispatch(portfolioListed({ portfolio, at: Date.now() }));
  return portfolio;
};

const isMapped = (descriptor: AccountDescriptor, portfolio: Portfolio) =>
  (strategyOf(descriptor)?.strategy.accountIdsOf(descriptor, portfolio).length ?? 0) > 0;

/** The registrations the accounts need, one per key: an EVM address shared by networks registers once. */
const wantedOf = (descriptors: readonly AccountDescriptor[]) => {
  const wanted = new Map<string, PortfolioRegistration>();
  for (const descriptor of descriptors) {
    const registration = registrationOf(descriptor);
    const key = registration && registrationKey(registration);
    if (registration && key) wanted.set(key, registration);
  }
  return wanted;
};

const pick = ({ groups, calls, truncated }: ReadGroups, wanted: ReadonlySet<string>) => ({
  groups: new Map<string, BalanceGroup>(
    [...wanted].flatMap(id => {
      const group = groups.get(id);
      return group ? [[id, group] as const] : [];
    }),
  ),
  calls,
  truncated,
});

export function createPortfolioSourceRuntime({
  clientOf = portfolioClientOf,
  scanMaxAge = SCAN_MAX_AGE,
}: PortfolioSourceRuntimeOptions = {}): PortfolioSourceRuntime {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  };
  let scan: Scan | undefined;

  const client = ({ dispatch }: PortfolioPorts) => clientOf(dispatch);

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

  const list = (ports: PortfolioPorts): Promise<Portfolio> =>
    logged(ports, "portfolio", async () => {
      const portfolioId = ports.portfolioId();
      const existing = await client(ports).getPortfolio(portfolioId);
      const portfolio = existing ?? (await client(ports).createPortfolio(portfolioId));
      const accounts = portfolio.accounts?.length ?? 0;
      const registrations = portfolio.registrations?.length ?? 0;
      return {
        value: listed(ports, portfolio),
        summary: `${existing ? "Listed" : "Created"} the portfolio: ${registrations} registrations, ${accounts} accounts`,
      };
    });

  async function sync(
    ports: PortfolioPorts,
    descriptors: readonly AccountDescriptor[],
    prune: boolean,
  ): Promise<Portfolio> {
    const server = selectPortfolioServer(ports.getState());
    // A recent listing that gave every account its ids is enough; an older one may miss a network.
    if (
      !prune &&
      isFreshListing(server) &&
      descriptors.every(descriptor => isMapped(descriptor, server.portfolio))
    ) {
      return server.portfolio;
    }
    let portfolio = await list(ports);
    const wanted = wantedOf(descriptors);
    const known = new Set((portfolio.registrations ?? []).map(registrationKey));
    const missing = [...wanted].filter(([key]) => !known.has(key)).map(([, value]) => value);
    if (missing.length > 0) {
      portfolio = await logged(ports, "register", async () => ({
        value: listed(ports, await client(ports).addRegistrations(ports.portfolioId(), missing)),
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
            await client(ports).removeRegistrations(
              ports.portfolioId(),
              extra.map(entry => entry.id),
            ),
          ),
          summary: `Removed ${extra.length} registrations no account needs`,
        }));
      }
    }
    return portfolio;
  }

  function balanceGroups(ports: PortfolioPorts, wanted: ReadonlySet<string>): Promise<ReadGroups> {
    if (wanted.size <= FILTERED_READS_UP_TO) {
      return readBalanceGroups(client(ports), ports.portfolioId(), wanted);
    }
    // A scan in flight answers every batch; a finished one, for `scanMaxAge` after it finished.
    const fresh = scan && (scan.doneAt === undefined || Date.now() - scan.doneAt < scanMaxAge);
    if (!scan || !fresh) {
      const current: Scan = { read: readBalanceGroups(client(ports), ports.portfolioId()) };
      scan = current;
      current.read.then(
        () => {
          current.doneAt = Date.now();
        },
        () => {
          if (scan === current) scan = undefined;
        },
      );
    }
    return scan.read.then(all => pick(all, wanted));
  }

  return {
    ensure: (ports, descriptors) => serial(() => sync(ports, descriptors, false)),
    reconcile: async (ports, descriptors) => {
      await serial(() => sync(ports, descriptors, true));
    },
    refresh: async ports => {
      await serial(() => list(ports));
    },
    balanceGroups,
    logged,
  };
}
