jest.mock("../network/sdk", () => ({ getVotes: jest.fn(), getPendingWithdrawals: jest.fn() }));

import { BigNumber } from "bignumber.js";
import { getPendingWithdrawals, getVotes } from "../network/sdk";
import { getStakes } from "./getStakes";

const ADDR = "0x7777777777777777777777777777777777777777";
const GROUP = "0x4444444444444444444444444444444444444444";

describe("getStakes", () => {
  beforeEach(() => {
    (getVotes as jest.Mock).mockReset();
    (getPendingWithdrawals as jest.Mock).mockReset().mockResolvedValue([]);
  });

  it("maps pending and active votes to Stakes with delegate/state/actions", async () => {
    (getVotes as jest.Mock).mockResolvedValue([
      {
        validatorGroup: GROUP,
        amount: new BigNumber(100),
        activatable: true,
        revokable: true,
        type: "pending",
        index: 0,
      },
      {
        validatorGroup: GROUP,
        amount: new BigNumber(200),
        activatable: false,
        revokable: false,
        type: "active",
        index: 1,
      },
    ]);

    const page = await getStakes(ADDR);

    expect(page.items).toHaveLength(2);
    const [pending, active] = page.items;

    expect(pending.uid).toBe(`${ADDR}:${GROUP}:pending`);
    expect(pending.delegate).toBe(GROUP);
    expect(pending.state).toBe("activating");
    expect(pending.actions).toEqual(["undelegate"]);
    expect(pending.amount).toBe(100n);
    expect(pending.details).toMatchObject({ voteType: "pending", activatable: true });

    expect(active.state).toBe("active");
    expect(active.amount).toBe(200n);
    // this active vote is marked non-revokable (a pending vote for the group coexists)
    expect(active.actions).toEqual([]);
  });

  it("maps pending withdrawals to withdrawable/deactivating Stakes", async () => {
    (getVotes as jest.Mock).mockResolvedValue([]);
    const past = Math.floor(Date.now() / 1000) - 100;
    const future = Math.floor(Date.now() / 1000) + 100_000;
    (getPendingWithdrawals as jest.Mock).mockResolvedValue([
      { value: new BigNumber(50), time: new BigNumber(past), index: 0 },
      { value: new BigNumber(70), time: new BigNumber(future), index: 1 },
    ]);

    const page = await getStakes(ADDR);

    expect(page.items).toHaveLength(2);
    const [matured, notYet] = page.items;

    expect(matured.uid).toBe(`${ADDR}:withdrawal:0`);
    expect(matured.state).toBe("withdrawable");
    expect(matured.actions).toEqual(["withdraw"]);
    expect(matured.amount).toBe(50n);

    expect(notYet.state).toBe("deactivating");
    expect(notYet.actions).toEqual([]);
  });

  it("returns an empty page when the account has no positions", async () => {
    (getVotes as jest.Mock).mockResolvedValue([]);
    (getPendingWithdrawals as jest.Mock).mockResolvedValue([]);

    const page = await getStakes(ADDR);

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  it("tolerates a failing pending-withdrawals read (fresh account)", async () => {
    (getVotes as jest.Mock).mockResolvedValue([]);
    (getPendingWithdrawals as jest.Mock).mockRejectedValue(new Error("execution reverted"));

    const page = await getStakes(ADDR);

    expect(page.items).toEqual([]);
  });
});
