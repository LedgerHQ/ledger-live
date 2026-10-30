import type {
  BalanceEntry,
  BalanceGroup,
  Portfolio,
  PortfolioAccount,
  UpdateView,
} from "@domain/api-account-portfolio";
import type { AccountTarget } from "@domain/api-account-data";
import {
  computeAccountUUID,
  type AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../client";
import { serverAccountId } from "../evm";
import type { PortfolioDeps } from "./portfolio";
import { createSerialQueue } from "./queue";
import { createPortfolioStore } from "./snapshot";

const addressOf = (index: number) => `0x${index.toString(16).padStart(40, "0")}`;

export const evm = (index: number, network = "ethereum") =>
  mockAddressAccountDescriptor({ network, address: addressOf(index), path: "m/44h/60h/0h/0/0" });

export const ETH = evm(1);
export const POLYGON = evm(1, "polygon");

export const targetOf = (descriptor: AddressAccountDescriptor): AccountTarget => ({
  accountUUID: computeAccountUUID(descriptor),
  descriptor,
});

export const serviceAccount = (
  descriptor: AddressAccountDescriptor,
  status: PortfolioAccount["status"] = "synchronized",
): PortfolioAccount => ({ id: serverAccountId(descriptor), network: descriptor.network, status });

export const entry = (
  descriptor: AddressAccountDescriptor,
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
  descriptor: AddressAccountDescriptor,
  items: BalanceEntry[] = [entry(descriptor)],
): BalanceGroup => ({
  type: "success",
  network: descriptor.network,
  account_id: serverAccountId(descriptor),
  items,
});

export const update = (
  descriptor: AddressAccountDescriptor,
  overrides: Partial<UpdateView> = {},
): UpdateView => ({
  network: descriptor.network,
  account_id: serverAccountId(descriptor),
  time: "2026-10-01T00:00:00Z",
  block: { height: 100 },
  tx: { hash: "0xabc" },
  failed: false,
  deltas: [{ asset: "native", amount: "10" }],
  fee: { asset: "native", amount: "1" },
  ...overrides,
});

/** A portfolio registering and tracking every descriptor, synchronized. */
export const synced = (
  descriptors: AddressAccountDescriptor[],
  extra: Partial<Portfolio> = {},
): Portfolio => ({
  id: "p",
  registrations: descriptors.map((descriptor, index) => ({
    id: `known-${index}`,
    type: "evm",
    address: descriptor.address,
  })),
  accounts: descriptors.map(descriptor => serviceAccount(descriptor)),
  ...extra,
});

/** An in-memory Portfolio service; a scan pages through `groups`, `pageSize` at a time, updates `size` at a time. */
export function fakeService({
  portfolio,
  groups = [],
  updates = [],
  pageSize = 100,
}: {
  portfolio?: Portfolio;
  groups?: BalanceGroup[];
  updates?: UpdateView[];
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
    getPortfolio: jest.fn(async () => state.portfolio),
    createPortfolio: jest.fn(async () => save({ id: "p", registrations: [], accounts: [] })),
    addRegistrations: jest.fn(async (_id, registrations) =>
      save({
        ...current(),
        registrations: [
          ...(current().registrations ?? []),
          ...registrations.map(registration => ({
            id: `reg-${nextId++}`,
            type: registration.type,
            address: "address" in registration ? registration.address : undefined,
          })),
        ],
      }),
    ),
    removeRegistrations: jest.fn(async (_id, ids) =>
      save({
        ...current(),
        registrations: current().registrations?.filter(each => !ids.includes(each.id)),
      }),
    ),
    getBalance: jest.fn(async (_id, { account, token }) => {
      if (account) return { items: groups.filter(each => each.account_id === account) };
      const start = token ? Number(token) : 0;
      const end = start + pageSize;
      return {
        items: groups.slice(start, end),
        nextToken: end < groups.length ? String(end) : undefined,
      };
    }),
    getUpdates: jest.fn(async (_id, { account, size, token }) => {
      const items = updates.filter(each => each.account_id === account);
      const start = token ? Number(token) : 0;
      const end = start + size;
      return {
        items: items.slice(start, end),
        nextToken: end < items.length ? String(end) : undefined,
      };
    }),
  } satisfies PortfolioClient;
  return { client, state };
}

export const PORTFOLIO_ID = () => PortfolioId.fromString("portfolio");

export const depsOf = (client: PortfolioClient): PortfolioDeps => ({
  client,
  portfolioId: PORTFOLIO_ID,
  queue: createSerialQueue(),
  store: createPortfolioStore(),
});

export const reasonOf = (settled: PromiseSettledResult<unknown>) =>
  settled.status === "rejected" ? settled.reason : undefined;
