import type {
  BalanceEntry,
  BalanceGroup,
  Portfolio,
  PortfolioAccount,
  PortfolioRegistration,
  PortfolioRegistrationEntry,
  UpdateView,
} from "@domain/api-account-portfolio";
import type { AccountTarget } from "@domain/api-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { PortfolioId } from "@domain/entity-client-identity";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { PortfolioClient } from "../client";
import { portfolioAccountOf } from "../registration";
import { createPortfolioContext, type PortfolioDeps } from "./portfolio";

const addressOf = (index: number) => `0x${index.toString(16).padStart(40, "0")}`;

export const evm = (index: number, network = "ethereum") =>
  mockAddressAccountDescriptor({ network, address: addressOf(index), path: "m/44h/60h/0h/0/0" });

/** The service's id of an account the source serves. */
export function serverAccountId(descriptor: AccountDescriptor): string {
  const ref = portfolioAccountOf(descriptor);
  if (!ref) throw new Error("Not an account the source serves");
  return ref.serverAccountId;
}

export const ETH = evm(1);
export const POLYGON = evm(1, "polygon");
export const BTC = mockUtxoAccountDescriptor();
/** An account of a network the service does not synchronize. */
export const DOT = mockAddressAccountDescriptor({
  network: "polkadot",
  address: `1${"A".repeat(46)}`,
  path: "m/44h/354h/0h/0h/0h",
});

/** The BIP84 account of the BIP39 test mnemonic: a valid xpub, checksum included. */
export const BIP84_XPUB =
  "xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V";
/** A Bitcoin account the service derives; `BTC` keeps a fixture xpub whose checksum is wrong. */
export const BITCOIN = mockUtxoAccountDescriptor({ xpub: BIP84_XPUB, path: "m/84h/0h/0h" });
export const ADA = mockUtxoAccountDescriptor({
  network: "cardano",
  xpub: "ab".repeat(64),
  path: "m/1852h/1815h/0h",
});
export const TRX = mockAddressAccountDescriptor({
  network: "tron",
  address: `T${"A".repeat(33)}`,
  path: "m/44h/195h/0h/0/0",
});

export const targetOf = (descriptor: AccountDescriptor): AccountTarget => ({
  accountUUID: computeAccountUUID(descriptor),
  descriptor,
});

export const serviceAccount = (
  descriptor: AccountDescriptor,
  status: PortfolioAccount["status"] = "synchronized",
): PortfolioAccount => ({ id: serverAccountId(descriptor), network: descriptor.network, status });

export const entry = (
  descriptor: AccountDescriptor,
  overrides: Partial<BalanceEntry> = {},
): BalanceEntry => ({
  network: descriptor.network,
  account_id: serverAccountId(descriptor),
  asset: "native",
  name: "Ether",
  ticker: "ETH",
  decimals: 18,
  amount: "10",
  estimated: false,
  status: "confirmed",
  locked: false,
  ...overrides,
});

export const group = (
  descriptor: AccountDescriptor,
  items: BalanceEntry[] = [entry(descriptor)],
): BalanceGroup => ({
  type: "success",
  network: descriptor.network,
  account_id: serverAccountId(descriptor),
  items,
});

export const update = (
  descriptor: AccountDescriptor,
  overrides: Partial<UpdateView> = {},
): UpdateView => ({
  network: descriptor.network,
  account_id: serverAccountId(descriptor),
  time: DateTimeIsoSchema.parse("2026-10-01T00:00:00Z"),
  block: { hash: "0xb100", height: 100, time: DateTimeIsoSchema.parse("2026-10-01T00:00:00Z") },
  tx: { hash: "0xabc" },
  failed: false,
  deltas: [{ asset: "native", amount: "10" }],
  fee: { asset: "native", amount: "1" },
  ...overrides,
});

/** A registration as the service lists it: an `account` one without the id we gave it. */
export function listed(
  registration: PortfolioRegistration,
  id: string,
): PortfolioRegistrationEntry {
  switch (registration.type) {
    case "account":
      return {
        id,
        type: registration.type,
        network: registration.network,
        addresses: registration.addresses,
      };
    case "auto_derive":
      return {
        id,
        type: registration.type,
        network: registration.network,
        xpub: registration.xpub,
      };
    default:
      return { id, type: registration.type, address: registration.address };
  }
}

/** A portfolio registering and tracking every descriptor, synchronized. */
export const synced = (
  descriptors: AccountDescriptor[],
  extra: Partial<Portfolio> = {},
): Portfolio => ({
  id: "p",
  registrations: descriptors.flatMap((descriptor, index) => {
    const ref = portfolioAccountOf(descriptor);
    return ref ? [listed(ref.registration, `known-${index}`)] : [];
  }),
  accounts: descriptors.map(descriptor => serviceAccount(descriptor)),
  ...extra,
});

/** An in-memory Portfolio service; a scan pages through `groups`, `pageSize` at a time, updates `size` at a time. */
export function fakeService({
  portfolio,
  groups = [],
  updates = [],
  tokens = [],
  pageSize = 100,
}: {
  portfolio?: Portfolio;
  groups?: BalanceGroup[];
  updates?: UpdateView[];
  tokens?: TokenCurrency[];
  pageSize?: number;
} = {}) {
  const state = { portfolio };
  let nextId = 0;
  const current = () => state.portfolio ?? { id: "p" };
  const save = (next: Portfolio) => {
    state.portfolio = next;
    return next;
  };
  const client = {
    getPortfolio: jest.fn(async (_id: PortfolioId, _signal?: AbortSignal) => state.portfolio),
    createPortfolio: jest.fn(async () => save({ id: "p", registrations: [], accounts: [] })),
    addRegistrations: jest.fn(async (_id, registrations) =>
      save({
        ...current(),
        registrations: [
          ...(current().registrations ?? []),
          ...registrations.map(registration => listed(registration, `reg-${nextId++}`)),
        ],
      }),
    ),
    removeRegistrations: jest.fn(async (_id, ids) =>
      save({
        ...current(),
        registrations: current().registrations?.filter(each => !ids.includes(each.id)),
      }),
    ),
    getBalance: jest.fn(async (_id, { account, token }, _signal?: AbortSignal) => {
      const items = account ? groups.filter(each => each.account_id === account) : groups;
      const start = token ? Number(token) : 0;
      const end = start + pageSize;
      return {
        items: items.slice(start, end),
        nextToken: end < items.length ? String(end) : undefined,
      };
    }),
    getUpdates: jest.fn(async (_id, { account, size, token, asset }, _signal?: AbortSignal) => {
      const items = updates.filter(
        each =>
          each.account_id === account &&
          (asset === undefined || (each.deltas ?? []).some(delta => delta.asset === asset)),
      );
      const start = token ? Number(token) : 0;
      const end = start + size;
      return {
        items: items.slice(start, end),
        nextToken: end < items.length ? String(end) : undefined,
      };
    }),
    findToken: jest.fn(async (id: string) => tokens.find(each => each.id === id)),
  } satisfies PortfolioClient;
  return { client, state };
}

export const PORTFOLIO_ID = () => PortfolioId.fromString("portfolio");

/** A clock that only moves when the source sleeps. */
export function depsOf(client: PortfolioClient): PortfolioDeps {
  let time = 0;
  return createPortfolioContext({
    client,
    portfolioId: PORTFOLIO_ID,
    sleep: async ms => {
      time += ms;
    },
    timeout: () => new Promise(() => {}),
    now: () => time,
  });
}

export const reasonOf = (settled: PromiseSettledResult<unknown>) =>
  settled.status === "rejected" ? settled.reason : undefined;
