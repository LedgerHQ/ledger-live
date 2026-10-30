import { serverAccountId } from "../../evm";
import { PORTFOLIO_ID, evm, fakeService, group } from "../fakeService.mock";
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

  it("stops at 50 pages and says pages were left", async () => {
    const groups = accounts(60).map(each => group(each));
    const { client } = fakeService({ groups, pageSize: 1 });

    const read = await readBalanceGroups(client, PORTFOLIO_ID, accounts(4).map(serverAccountId));

    expect(client.getBalance).toHaveBeenCalledTimes(50);
    expect(read.groups.size).toBe(50);
    expect(read).toMatchObject({ truncated: true, calls: 50 });
  });
});
