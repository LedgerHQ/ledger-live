import type { BalanceGroup, Portfolio } from "@domain/api-account-portfolio";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  ETH,
  depsOf,
  entry,
  evm,
  fakeService,
  group,
  reasonOf,
  serviceAccount,
  synced,
  serverAccountId,
  DOT,
} from "../fakeService.mock";
import { PortfolioReadError } from "../readiness";
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

  it("registers, waits until the service account is synchronized, then serves it", async () => {
    const service = fakeService({
      portfolio: synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }),
      groups: [group(ETH)],
    });
    service.client.getPortfolio
      .mockResolvedValueOnce(synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }))
      .mockResolvedValueOnce(synced([ETH]));
    const { read, outcomeOf, deps } = setup(service);

    const [settled] = await read([ETH]);

    expect(service.client.addRegistrations).toHaveBeenCalledTimes(1);
    expect(service.client.getPortfolio).toHaveBeenCalledTimes(2);
    expect(settled.status).toBe("fulfilled");
    expect(outcomeOf(ETH)).toMatchObject({ status: "served" });
    expect(deps.store.get().activity.map(each => each.summary)).toContain(
      "Waiting for 1 service accounts",
    );
  });

  it("fails an account the service still prepares after its wait", async () => {
    const { client, read, outcomeOf, deps } = setup(fakeService({ portfolio: synced([]) }));

    const [settled] = await read([ETH]);

    expect(client.getPortfolio).toHaveBeenCalledTimes(41);
    expect(deps.now()).toBe(120_000);
    expect(deps.store.get()).toMatchObject({ busy: false });
    expect(client.getBalance).not.toHaveBeenCalled();
    expect(reasonOf(settled)).toBeInstanceOf(PortfolioReadError);
    expect(outcomeOf(ETH)).toMatchObject({
      status: "failed",
      detail: "Service account not created yet",
    });
  });

  it.each<{ reason: string; portfolio: Portfolio; groups: BalanceGroup[]; detail: string }>([
    {
      reason: "its registration failed",
      portfolio: synced([], { accounts: [serviceAccount(ETH, "registration_failure")] }),
      groups: [],
      detail: "Service account registration_failure",
    },
    {
      reason: "the fan-out does not track its network",
      portfolio: synced([], { accounts: [serviceAccount(evm(1, "bsc"))] }),
      groups: [],
      detail: "The fan-out tracks no ethereum account",
    },
    {
      reason: "its group failed",
      portfolio: synced([ETH]),
      groups: [
        { type: "error", network: "ethereum", account_id: serverAccountId(ETH), error: "boom" },
      ],
      detail: "The service failed its group",
    },
    {
      reason: "an amount is unreadable",
      portfolio: synced([ETH]),
      groups: [group(ETH, [entry(ETH), entry(ETH, { asset: "token", cal_id: "t", amount: "x" })])],
      detail: "1 assets with an unreadable amount",
    },
  ])("fails without waiting when $reason", async ({ portfolio, groups, detail }) => {
    const { read, outcomeOf, client } = setup(fakeService({ portfolio, groups }));
    const [settled] = await read([ETH]);
    expect(client.getPortfolio).toHaveBeenCalledTimes(1);
    expect(reasonOf(settled)).toBeInstanceOf(PortfolioReadError);
    expect(outcomeOf(ETH)).toMatchObject({ status: "failed", detail });
  });

  it("fails an account that is not EVM", async () => {
    const { read, deps } = setup(fakeService({ portfolio: synced([]) }));
    const utxo = DOT;

    const [settled] = await read([utxo]);

    expect(reasonOf(settled)).toBeInstanceOf(PortfolioReadError);
    expect(deps.store.get().outcomes[computeAccountUUID(utxo)]).toMatchObject({
      status: "failed",
      detail: "Not an account the Portfolio service serves",
    });
  });

  it("fails each account whose own call failed, keeping the body out of the outcome", async () => {
    const service = fakeService({ portfolio: synced([ETH, evm(2)]) });
    service.client.getBalance.mockRejectedValue(new Error(`500 for ${ETH.address}`));
    const { read, outcomeOf, deps } = setup(service);

    const settled = await read([ETH, evm(2)]);

    expect(settled.map(reasonOf)).toEqual([
      expect.any(PortfolioReadError),
      expect.any(PortfolioReadError),
    ]);
    expect(settled.map(each => String(reasonOf(each)))).not.toContainEqual(
      expect.stringContaining(ETH.address),
    );
    expect(outcomeOf(evm(2))).toMatchObject({
      status: "failed",
      detail: "Its balance call failed",
    });
    expect(deps.store.get()).toMatchObject({ busy: false });
  });

  it("fails every account of a capped scan, even those it read", async () => {
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
      "rejected",
      "rejected",
      "rejected",
      "rejected",
    ]);
    expect(outcomeOf(accounts[0])).toMatchObject({
      status: "failed",
      detail: "The balance scan stopped before the end",
    });
  });
});
