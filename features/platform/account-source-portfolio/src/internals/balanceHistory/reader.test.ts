import type { AccountTarget } from "@domain/api-account-data";
import type { AccountBalanceHistoryQuery } from "@domain/entity-account-balance-history";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  ETH,
  depsOf,
  evm,
  fakeService,
  historyGroup,
  reasonOf,
  serviceAccount,
  synced,
  targetOf,
  DOT,
} from "../fakeService.mock";
import { PortfolioReadError } from "../readiness";
import { balanceHistoryReader } from "./reader";

function setup(service = fakeService()) {
  const deps = depsOf(service.client);
  const read = (targets: AccountTarget[], query?: AccountBalanceHistoryQuery) =>
    balanceHistoryReader(deps)(targets, query);
  return { ...service, deps, read };
}

describe("balanceHistoryReader", () => {
  it("serves the history of the range asked", async () => {
    const { read, client, deps } = setup(
      fakeService({ portfolio: synced([ETH]), histories: [historyGroup(ETH)] }),
    );

    const [settled] = await read([targetOf(ETH)], { range: "year" });

    expect(settled).toMatchObject({
      status: "fulfilled",
      value: { range: "year", series: [{ assetId: "ethereum" }] },
    });
    expect(client.getBalanceHistory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ range: "year" }),
      undefined,
    );
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: true,
      summary: "Balance history (year) of 1 accounts in 1 calls: 1 served",
    });
  });

  it("reads the default range when the query names none", async () => {
    const { read } = setup(
      fakeService({ portfolio: synced([ETH]), histories: [historyGroup(ETH)] }),
    );
    const [settled] = await read([targetOf(ETH)]);
    expect(settled).toMatchObject({ status: "fulfilled", value: { range: "month" } });
  });

  it("registers, waits, then fails the accounts the service never gets ready", async () => {
    const utxo = DOT;
    const { read, client } = setup(
      fakeService({ portfolio: synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }) }),
    );

    const settled = await read([
      targetOf(ETH),
      targetOf(evm(2)),
      { accountUUID: computeAccountUUID(utxo), descriptor: utxo },
    ]);

    expect(client.addRegistrations).toHaveBeenCalledTimes(1);
    expect(client.getPortfolio).toHaveBeenCalledTimes(41);
    expect(client.getBalanceHistory).not.toHaveBeenCalled();
    expect(settled.map(each => String(reasonOf(each)))).toEqual([
      expect.stringContaining("Service account uninitialized"),
      expect.stringContaining("Service account not created yet"),
      expect.stringContaining("Not an account the Portfolio service serves"),
    ]);
  });

  it("fails only the account whose call failed, keeping the body out", async () => {
    const service = fakeService({ portfolio: synced([ETH, evm(2)]) });
    service.client.getBalanceHistory.mockImplementation(async (_id, { account }) => {
      if (account.endsWith(evm(2).address)) throw new Error(`500 for ${evm(2).address}`);
      return { items: [historyGroup(ETH)], nextToken: undefined };
    });
    const { read } = setup(service);

    const [eth, failed] = await read([targetOf(ETH), targetOf(evm(2))]);

    expect(eth.status).toBe("fulfilled");
    expect(reasonOf(failed)).toBeInstanceOf(PortfolioReadError);
    expect(String(reasonOf(failed))).not.toContain(evm(2).address);
  });

  it("cancels the calls of an account whose read is cancelled, and frees the source", async () => {
    const service = fakeService({ portfolio: synced([ETH]) });
    const cancel = new AbortController();
    service.client.getBalanceHistory.mockImplementation(
      (_id, _params, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(new Error("aborted")));
          cancel.abort();
        }),
    );
    const { read, deps } = setup(service);

    const [settled] = await read([{ ...targetOf(ETH), signal: cancel.signal }]);

    expect(String(reasonOf(settled))).toContain("No read waits for these accounts any more");
    expect(deps.store.get().busy).toBe(false);
  });

  it("serves no account when listing the portfolio fails", async () => {
    const service = fakeService();
    service.client.getPortfolio.mockRejectedValue(new Error("boom"));
    const { read, deps } = setup(service);

    const settled = await read([targetOf(ETH)]);

    expect(reasonOf(settled[0])).toBeInstanceOf(PortfolioReadError);
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: false,
      summary: "Balance history read failed: Unexpected error",
    });
  });
});
