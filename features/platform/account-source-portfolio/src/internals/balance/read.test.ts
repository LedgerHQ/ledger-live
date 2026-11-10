import { PORTFOLIO_ID, entry, evm, fakeService, group, serverAccountId } from "../fakeService.mock";
import { readBalanceGroups } from "./read";

const accounts = (count: number) => Array.from({ length: count }, (_, index) => evm(index + 1));

describe("readBalanceGroups", () => {
  it("reads up to three accounts with one filtered call each", async () => {
    const descriptors = accounts(3);
    const { client } = fakeService({ groups: descriptors.map(each => group(each)) });

    const read = await readBalanceGroups(client, PORTFOLIO_ID, descriptors.map(serverAccountId));

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

    const read = await readBalanceGroups(client, PORTFOLIO_ID, [ok, broken].map(serverAccountId));

    expect([...read.groups.keys()]).toEqual([serverAccountId(ok)]);
    expect([...(read.failed ?? [])]).toEqual([serverAccountId(broken)]);
  });

  it("pages through the portfolio above three accounts, forwarding the token and merging pages", async () => {
    const descriptors = accounts(4);
    const { client } = fakeService({ groups: descriptors.map(each => group(each)), pageSize: 2 });

    const read = await readBalanceGroups(client, PORTFOLIO_ID, descriptors.map(serverAccountId));

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

    const read = await readBalanceGroups(client, PORTFOLIO_ID, descriptors.map(serverAccountId));

    expect(client.getBalance.mock.calls.map(([, params]) => params.account)).toEqual([
      undefined,
      undefined,
      ...descriptors.map(serverAccountId),
    ]);
    expect([...read.groups.keys()]).toEqual(descriptors.map(serverAccountId));
    expect(read).toMatchObject({ truncated: false, calls: 6, failed: new Set() });
  });

  it("stops at 50 pages and says pages were left", async () => {
    const groups = accounts(60).map(each => group(each));
    const { client } = fakeService({ groups, pageSize: 1 });

    const read = await readBalanceGroups(client, PORTFOLIO_ID, accounts(4).map(serverAccountId));

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

    const read = await readBalanceGroups(client, PORTFOLIO_ID, [serverAccountId(account)]);

    expect(client.getBalance.mock.calls.map(([, params]) => params.token)).toEqual([
      undefined,
      "1",
    ]);
    expect(read.groups.get(serverAccountId(account))).toMatchObject({
      items: [{ asset: "native" }, { asset: "token" }],
    });
    expect(read).toMatchObject({ calls: 2, failed: new Set() });
  });

  it("fails a filtered read that hits the page cap", async () => {
    const [account] = accounts(1);
    const { client } = fakeService({
      groups: Array.from({ length: 51 }, () => group(account)),
      pageSize: 1,
    });

    const read = await readBalanceGroups(client, PORTFOLIO_ID, [serverAccountId(account)]);

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

    const read = await readBalanceGroups(client, PORTFOLIO_ID, descriptors.map(serverAccountId));

    expect(read.groups.get(serverAccountId(first))).toEqual(failure);
  });
});
