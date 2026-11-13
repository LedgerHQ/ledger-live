import {
  ETH,
  PORTFOLIO_ID,
  evm,
  fakeService,
  historyGroup,
  serverAccountId,
} from "../fakeService.mock";
import { readHistory } from "./read";

describe("readHistory", () => {
  it("reads every page of the account over the range", async () => {
    const { client } = fakeService({ histories: [historyGroup(ETH), historyGroup(ETH)] });
    client.getBalanceHistory.mockImplementation(async (_id, { token }) =>
      token
        ? { items: [historyGroup(ETH)], nextToken: undefined }
        : { items: [historyGroup(ETH), historyGroup(evm(2))], nextToken: "t2" },
    );

    const read = await readHistory(client, PORTFOLIO_ID(), serverAccountId(ETH), "week");

    expect(client.getBalanceHistory.mock.calls.map(([, params]) => params)).toEqual([
      { account: serverAccountId(ETH), range: "week", size: 100, token: undefined },
      { account: serverAccountId(ETH), range: "week", size: 100, token: "t2" },
    ]);
    expect(read).toMatchObject({ truncated: false, calls: 2 });
    expect(read.groups).toHaveLength(2);
  });

  it("stops at its page cap and says the read was truncated", async () => {
    const { client } = fakeService();
    client.getBalanceHistory.mockResolvedValue({ items: [historyGroup(ETH)], nextToken: "more" });

    const read = await readHistory(client, PORTFOLIO_ID(), serverAccountId(ETH), "all");

    expect(read).toMatchObject({ truncated: true, calls: 20 });
  });
});
