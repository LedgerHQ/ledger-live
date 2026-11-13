import { PORTFOLIO_ID, entry, evm, fakeService, group, serverAccountId } from "../fakeService.mock";
import { PortfolioReadCancelledError } from "../portfolio";
import { readBalanceGroups } from "./read";

const accounts = (count: number) => Array.from({ length: count }, (_, index) => evm(index + 1));

describe("readBalanceGroups", () => {
  it("reads up to three accounts with one filtered call each", async () => {
    const descriptors = accounts(3);
    const { client } = fakeService({ groups: descriptors.map(each => group(each)) });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), descriptors.map(serverAccountId));

    expect(client.getBalance.mock.calls.map(([, params]) => params)).toEqual(
      descriptors.map(each => ({ account: serverAccountId(each), size: 100 })),
    );
    expect([...read.groups.keys()]).toEqual(descriptors.map(serverAccountId));
    expect(read).toMatchObject({ truncated: false, calls: 3 });
  });

  it("keeps the groups of the filtered calls that succeeded when one fails", async () => {
    const [ok, broken] = accounts(2);
    const { client } = fakeService({ groups: [group(ok)] });
    client.getBalance.mockImplementation(async (_id, { account }) => {
      if (account === serverAccountId(broken)) throw new Error("500");
      return { items: [group(ok)], nextToken: undefined };
    });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), [ok, broken].map(serverAccountId));

    expect([...read.groups.keys()]).toEqual([serverAccountId(ok)]);
    expect([...(read.failed ?? [])]).toEqual([serverAccountId(broken)]);
  });

  it("pages through the portfolio above three accounts, forwarding the token and merging pages", async () => {
    const descriptors = accounts(4);
    const { client } = fakeService({ groups: descriptors.map(each => group(each)), pageSize: 2 });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), descriptors.map(serverAccountId));

    expect(client.getBalance.mock.calls.map(([, params]) => params)).toEqual([
      { size: 100, token: undefined },
      { size: 100, token: "2" },
    ]);
    expect([...read.groups.keys()]).toEqual(descriptors.map(serverAccountId));
    expect(read).toMatchObject({ truncated: false, calls: 2 });
  });

  it("falls back to one read per account when the scan fails, dropping its partial pages", async () => {
    const descriptors = accounts(4);
    const { client } = fakeService({ groups: descriptors.map(each => group(each)), pageSize: 2 });
    const scan = client.getBalance.getMockImplementation();
    client.getBalance.mockImplementation(async (id, params) => {
      if (params.account === undefined && params.token !== undefined) throw new Error("504");
      if (!scan) throw new Error("no fake");
      return scan(id, params);
    });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), descriptors.map(serverAccountId));

    expect(client.getBalance.mock.calls.map(([, params]) => params.account)).toEqual([
      undefined,
      undefined,
      ...descriptors.map(serverAccountId),
    ]);
    expect([...read.groups.keys()]).toEqual(descriptors.map(serverAccountId));
    expect(read).toMatchObject({ truncated: false, calls: 6, failed: new Set() });
  });

  it("starts no fallback once cancelled during the scan", async () => {
    const descriptors = accounts(4);
    const { client } = fakeService({ groups: descriptors.map(each => group(each)) });
    const cancel = new AbortController();
    client.getBalance.mockImplementation(async () => {
      cancel.abort();
      throw new Error("aborted");
    });

    await expect(
      readBalanceGroups(client, PORTFOLIO_ID(), descriptors.map(serverAccountId), cancel.signal),
    ).rejects.toBeInstanceOf(PortfolioReadCancelledError);

    expect(client.getBalance).toHaveBeenCalledTimes(1);
  });

  it("keeps the failure of a later page over the items of the first", async () => {
    const descriptor = evm(1);
    const { client } = fakeService();
    client.getBalance
      .mockResolvedValueOnce({ items: [group(descriptor)], nextToken: "1" })
      .mockResolvedValueOnce({
        items: [{ ...group(descriptor), error: "timeout" }],
        nextToken: undefined,
      });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), [serverAccountId(descriptor)]);

    expect(read.groups.get(serverAccountId(descriptor))).toHaveProperty("error", "timeout");
  });

  it("stops at 50 pages and says pages were left", async () => {
    const groups = accounts(60).map(each => group(each));
    const { client } = fakeService({ groups, pageSize: 1 });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), accounts(4).map(serverAccountId));

    expect(client.getBalance).toHaveBeenCalledTimes(50);
    expect(read.groups.size).toBe(50);
    expect(read).toMatchObject({ truncated: true, calls: 50 });
  });

  it("follows the token of a filtered read and merges the account's groups", async () => {
    const [account] = accounts(1);
    const token = entry(account, { asset: "token", cal_id: "ethereum/erc20/usdt" });
    const { client } = fakeService({
      groups: [group(account), group(account, [token])],
      pageSize: 1,
    });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), [serverAccountId(account)]);

    expect(client.getBalance.mock.calls.map(([, params]) => params.token)).toEqual([
      undefined,
      "1",
    ]);
    expect(read.groups.get(serverAccountId(account))).toMatchObject({
      items: [{ asset: "native" }, { asset: "token" }],
    });
    expect(read).toMatchObject({ calls: 2, failed: new Set() });
  });

  it("counts every call of a filtered read that fails on a later page", async () => {
    const descriptor = evm(1);
    const { client } = fakeService({ groups: [group(descriptor)] });
    client.getBalance
      .mockResolvedValueOnce({ items: [group(descriptor)], nextToken: "1" })
      .mockRejectedValueOnce(new Error("500"));

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), [serverAccountId(descriptor)]);

    expect(read.calls).toBe(2);
    expect(read.failed).toEqual(new Set([serverAccountId(descriptor)]));
  });

  it("fails a filtered read that hits the page cap", async () => {
    const [account] = accounts(1);
    const { client } = fakeService({
      groups: Array.from({ length: 51 }, () => group(account)),
      pageSize: 1,
    });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), [serverAccountId(account)]);

    expect(client.getBalance).toHaveBeenCalledTimes(50);
    expect([...(read.failed ?? [])]).toEqual([serverAccountId(account)]);
  });

  it("keeps a failed group of an account over its successful ones", async () => {
    const descriptors = accounts(4);
    const [first] = descriptors;
    const failure = {
      type: "error",
      network: first.network,
      account_id: serverAccountId(first),
      error: "boom",
    };
    const { client } = fakeService({
      groups: [
        group(first),
        failure,
        group(first),
        ...descriptors.slice(1).map(each => group(each)),
      ],
      pageSize: 2,
    });

    const read = await readBalanceGroups(client, PORTFOLIO_ID(), descriptors.map(serverAccountId));

    expect(read.groups.get(serverAccountId(first))).toEqual(failure);
  });
});
