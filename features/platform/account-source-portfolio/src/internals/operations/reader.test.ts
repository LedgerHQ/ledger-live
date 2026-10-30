import { AccountDataNotServedError, type AccountTarget } from "@domain/api-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  ETH,
  depsOf,
  evm,
  fakeService,
  reasonOf,
  serviceAccount,
  synced,
  targetOf,
  update,
} from "../fakeService.mock";
import { operationsReader } from "./reader";

const hashes = (count: number) =>
  Array.from({ length: count }, (_, index) => update(ETH, { tx: { hash: `0x${index}` } }));

function setup(service = fakeService()) {
  const deps = depsOf(service.client);
  const read = (targets: AccountTarget[], limit?: number) =>
    operationsReader(deps)(targets, limit === undefined ? undefined : { limit });
  return { ...service, deps, read };
}

describe("operationsReader", () => {
  it("serves a page of limit updates and the next one from its cursor", async () => {
    const { read, deps } = setup(fakeService({ portfolio: synced([ETH]), updates: hashes(3) }));

    const [first] = await read([targetOf(ETH)], 2);
    expect(first).toMatchObject({
      status: "fulfilled",
      value: { operations: [{ hash: "0x0" }, { hash: "0x1" }], nextCursor: "2" },
    });

    const [second] = await read([{ ...targetOf(ETH), cursor: "2" }], 2);
    expect(second).toEqual({
      status: "fulfilled",
      value: { operations: [expect.objectContaining({ hash: "0x2" })] },
    });
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: true,
      summary: "Operations of 1 accounts in 1 calls: 1 served",
    });
    expect(deps.store.get()).toMatchObject({ busy: false });
  });

  it("reads 20 updates by default", async () => {
    const { read, client } = setup(fakeService({ portfolio: synced([ETH]), updates: hashes(1) }));
    await read([targetOf(ETH)]);
    expect(client.getUpdates).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ size: 20 }),
    );
  });

  it("registers first and lets the accounts the service cannot answer yet fall through", async () => {
    const utxo = mockUtxoAccountDescriptor();
    const { read, client } = setup(
      fakeService({ portfolio: synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }) }),
    );

    const settled = await read([
      targetOf(ETH),
      targetOf(evm(2)),
      { accountUUID: computeAccountUUID(utxo), descriptor: utxo },
    ]);

    expect(client.addRegistrations).toHaveBeenCalledTimes(1);
    expect(client.getUpdates).not.toHaveBeenCalled();
    expect(settled.map(each => String(reasonOf(each)))).toEqual([
      expect.stringContaining("Service account uninitialized"),
      expect.stringContaining("Service account not created yet"),
      expect.stringContaining("Not an EVM account"),
    ]);
  });

  it("lets only the account whose call failed fall through, keeping the body out", async () => {
    const service = fakeService({ portfolio: synced([ETH, evm(2)]), updates: hashes(1) });
    service.client.getUpdates.mockImplementation(async (_id, { account }) => {
      if (account.endsWith(evm(2).address)) throw new Error(`500 for ${evm(2).address}`);
      return { items: hashes(1), nextToken: undefined };
    });
    const { read } = setup(service);

    const [eth, failed] = await read([targetOf(ETH), targetOf(evm(2))]);

    expect(eth.status).toBe("fulfilled");
    expect(reasonOf(failed)).toBeInstanceOf(AccountDataNotServedError);
    expect(String(reasonOf(failed))).toContain("Unexpected error");
    expect(String(reasonOf(failed))).not.toContain(evm(2).address);
  });

  it("serves no account when listing the portfolio fails", async () => {
    const service = fakeService();
    service.client.getPortfolio.mockRejectedValue(new Error("boom"));
    const { read, deps } = setup(service);

    const settled = await read([targetOf(ETH)]);

    expect(reasonOf(settled[0])).toBeInstanceOf(AccountDataNotServedError);
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: false,
      summary: "Operations read failed: Unexpected error",
    });
  });
});
