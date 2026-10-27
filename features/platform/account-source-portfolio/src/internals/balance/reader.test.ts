import { AccountDataNotServedError } from "@domain/api-account-data";
import type { BalanceGroup, Portfolio } from "@domain/api-account-portfolio";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";
import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  ETH,
  POLYGON,
  depsOf,
  entry,
  evm,
  fakeService,
  group,
  reasonOf,
  serviceAccount,
  synced,
} from "../fakeService.mock";
import { serverAccountId } from "../../evm";
import { balanceReader } from "./reader";

function setup(service = fakeService()) {
  const deps = depsOf(service.client);
  const read = (descriptors: AccountDescriptor[]) =>
    balanceReader(deps)(
      descriptors.map(descriptor => ({ accountUUID: computeAccountUUID(descriptor), descriptor })),
      undefined,
    );
  const outcomeOf = (descriptor: AddressAccountDescriptor) =>
    deps.store.get().outcomes[computeAccountUUID(descriptor)];
  return { ...service, deps, read, outcomeOf };
}

describe("balanceReader", () => {
  it("serves the native coin first and records the outcome", async () => {
    const service = fakeService({
      portfolio: synced([ETH]),
      groups: [
        group(ETH, [
          entry(ETH, { asset: "token", cal_id: "ethereum/erc20/usdt", amount: "5" }),
          entry(ETH, { asset: "token", cal_id: null }),
          entry(ETH, { amount: "7" }),
          entry(ETH, { amount: "3", locked: true }),
        ]),
      ],
    });
    const { read, outcomeOf, deps } = setup(service);

    const [settled] = await read([ETH]);

    expect(settled).toEqual({
      status: "fulfilled",
      value: [
        { assetId: "ethereum", balance: "10", spendableBalance: "7" },
        { assetId: "ethereum/erc20/usdt", balance: "5", spendableBalance: "5" },
      ],
    });
    expect(outcomeOf(ETH)).toMatchObject({
      status: "served",
      rows: 2,
      detail: "1 tokens without a CAL id left out",
    });
    expect(deps.store.get()).toMatchObject({ busy: false });
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: true,
      summary: "Balance of 1 accounts in 1 calls: 1 served",
    });
  });

  it("registers first, then lets accounts the service does not track yet fall through", async () => {
    const { client, read, outcomeOf } = setup();

    const settled = await read([ETH, POLYGON]);

    expect(client.addRegistrations).toHaveBeenCalledTimes(1);
    expect(client.getBalance).not.toHaveBeenCalled();
    expect(settled.map(reasonOf)).toEqual([
      expect.any(AccountDataNotServedError),
      expect.any(AccountDataNotServedError),
    ]);
    expect(outcomeOf(ETH)).toMatchObject({
      status: "waiting",
      detail: "Service account not created yet",
    });
  });

  it.each<{ reason: string; portfolio: Portfolio; groups: BalanceGroup[]; outcome: object }>([
    {
      reason: "the service account is not synchronized",
      portfolio: synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }),
      groups: [],
      outcome: { status: "waiting", detail: "Service account uninitialized" },
    },
    {
      reason: "the fan-out does not track its network",
      portfolio: synced([], { accounts: [serviceAccount(evm(1, "bsc"))] }),
      groups: [],
      outcome: { status: "failed", detail: "The fan-out tracks no ethereum account" },
    },
    {
      reason: "its group failed",
      portfolio: synced([ETH]),
      groups: [
        { type: "error", network: "ethereum", account_id: serverAccountId(ETH), error: "boom" },
      ],
      outcome: { status: "failed", detail: "The service failed its group" },
    },
    {
      reason: "an amount is unreadable",
      portfolio: synced([ETH]),
      groups: [group(ETH, [entry(ETH), entry(ETH, { asset: "token", cal_id: "t", amount: "x" })])],
      outcome: { status: "failed", detail: "1 assets with an unreadable amount" },
    },
    {
      reason: "it has no native coin",
      portfolio: synced([ETH]),
      groups: [group(ETH, [entry(ETH, { asset: "token", cal_id: "t" })])],
      outcome: { status: "waiting", detail: "No native coin balance yet" },
    },
  ])("falls through when $reason", async ({ portfolio, groups, outcome }) => {
    const { read, outcomeOf } = setup(fakeService({ portfolio, groups }));
    const [settled] = await read([ETH]);
    expect(reasonOf(settled)).toBeInstanceOf(AccountDataNotServedError);
    expect(outcomeOf(ETH)).toMatchObject(outcome);
  });

  it("falls through for an account that is not EVM", async () => {
    const { read, deps } = setup(fakeService({ portfolio: synced([]) }));
    const utxo = mockUtxoAccountDescriptor();

    const [settled] = await read([utxo]);

    expect(reasonOf(settled)).toBeInstanceOf(AccountDataNotServedError);
    expect(deps.store.get().outcomes[computeAccountUUID(utxo)]).toMatchObject({
      status: "failed",
      detail: "Not an EVM account",
    });
  });

  it("serves no account when a service call fails, and keeps the body out of the outcome", async () => {
    const service = fakeService({ portfolio: synced([ETH, evm(2)]) });
    service.client.getBalance.mockRejectedValue(new Error(`500 for ${ETH.address}`));
    const { read, outcomeOf, deps } = setup(service);

    const settled = await read([ETH, evm(2)]);

    expect(settled.map(reasonOf)).toEqual([
      expect.any(AccountDataNotServedError),
      expect.any(AccountDataNotServedError),
    ]);
    expect(settled.map(each => String(reasonOf(each)))).not.toContainEqual(
      expect.stringContaining(ETH.address),
    );
    expect(outcomeOf(evm(2))).toMatchObject({ status: "failed", detail: "Unexpected error" });
    expect(deps.store.get()).toMatchObject({ busy: false });
    expect(deps.store.get().activity.at(-1)).toMatchObject({ ok: false });
  });

  it("serves the accounts a capped scan read and lets the others fall through", async () => {
    const accounts = [evm(1), evm(2), evm(3), evm(4)];
    const fillers = Array.from({ length: 60 }, (_, index) => group(evm(100 + index)));
    const service = fakeService({
      portfolio: synced(accounts),
      groups: [
        group(accounts[0]),
        group(accounts[1]),
        ...fillers,
        group(accounts[2]),
        group(accounts[3]),
      ],
      pageSize: 1,
    });
    const { client, read, outcomeOf } = setup(service);

    const settled = await read(accounts);

    expect(client.getBalance).toHaveBeenCalledTimes(50);
    expect(settled.map(each => each.status)).toEqual([
      "fulfilled",
      "fulfilled",
      "rejected",
      "rejected",
    ]);
    expect(outcomeOf(accounts[3])).toMatchObject({
      status: "failed",
      detail: "The balance scan stopped before it",
    });
  });
});
