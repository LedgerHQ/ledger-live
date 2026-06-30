import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { CosmosDelegation } from "../types";
import {
  fetchQueuedStakingMessages,
  mergeQueuedMessages,
  parseQueuedMessage,
  QueuedStakingMessage,
} from "./babylonEpoching";

jest.mock("@ledgerhq/live-network/network");
jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));
const mockedNetwork = jest.mocked(network);
const mockedLog = jest.mocked(log);

afterEach(() => {
  jest.clearAllMocks();
});

describe("parseQueuedMessage", () => {
  // live sample from /babylon/epoching/v1/epochs/{epoch}/messages
  const delegateText =
    'delegator_address:"bbn1tng3l589auzpvr6dtwujhqvkhqgrk2hwlqxe2k" validator_address:"bbnvaloper10042ualva0yqh7ccpzhg9ya2gd9xpfsrcd6m4w" amount:<denom:"ubbn" amount:"398688" >';

  it("parses a queued MsgDelegate", () => {
    expect(parseQueuedMessage("cosmos.staking.v1beta1.MsgDelegate", delegateText)).toEqual({
      type: "delegate",
      delegatorAddress: "bbn1tng3l589auzpvr6dtwujhqvkhqgrk2hwlqxe2k",
      validatorAddress: "bbnvaloper10042ualva0yqh7ccpzhg9ya2gd9xpfsrcd6m4w",
      amount: new BigNumber(398688),
      denom: "ubbn",
    });
  });

  it("parses a queued MsgUndelegate", () => {
    expect(parseQueuedMessage("cosmos.staking.v1beta1.MsgUndelegate", delegateText)).toEqual(
      expect.objectContaining({ type: "undelegate" }),
    );
  });

  it("parses a queued MsgBeginRedelegate", () => {
    const text =
      'delegator_address:"bbn1delegator" validator_src_address:"bbnvaloper1src" validator_dst_address:"bbnvaloper1dst" amount:<denom:"ubbn" amount:"42" >';
    expect(parseQueuedMessage("cosmos.staking.v1beta1.MsgBeginRedelegate", text)).toEqual({
      type: "redelegate",
      delegatorAddress: "bbn1delegator",
      validatorSrcAddress: "bbnvaloper1src",
      validatorDstAddress: "bbnvaloper1dst",
      amount: new BigNumber(42),
      denom: "ubbn",
    });
  });

  it("tolerates curly-brace proto text and a leading slash in msg_type", () => {
    const text =
      'delegator_address:"bbn1delegator" validator_address:"bbnvaloper1val" amount:{denom:"ubbn" amount:"7"}';
    expect(parseQueuedMessage("/cosmos.staking.v1beta1.MsgDelegate", text)).toEqual({
      type: "delegate",
      delegatorAddress: "bbn1delegator",
      validatorAddress: "bbnvaloper1val",
      amount: new BigNumber(7),
      denom: "ubbn",
    });
  });

  it("returns undefined for non-staking msg types", () => {
    expect(
      parseQueuedMessage("cosmos.staking.v1beta1.MsgCancelUnbondingDelegation", delegateText),
    ).toBeUndefined();
    expect(
      parseQueuedMessage("cosmos.staking.v1beta1.MsgEditValidator", delegateText),
    ).toBeUndefined();
  });

  it("returns undefined when expected fields are missing", () => {
    expect(parseQueuedMessage("cosmos.staking.v1beta1.MsgDelegate", "garbage")).toBeUndefined();
    expect(
      parseQueuedMessage(
        "cosmos.staking.v1beta1.MsgDelegate",
        'delegator_address:"bbn1delegator" amount:<denom:"ubbn" amount:"7" >',
      ),
    ).toBeUndefined();
    expect(
      parseQueuedMessage(
        "cosmos.staking.v1beta1.MsgBeginRedelegate",
        'delegator_address:"bbn1delegator" validator_src_address:"bbnvaloper1src" amount:<denom:"ubbn" amount:"7" >',
      ),
    ).toBeUndefined();
  });

  it("warns on a known staking msg_type that fails to parse, stays silent for unknown types", () => {
    expect(parseQueuedMessage("cosmos.staking.v1beta1.MsgDelegate", "garbage")).toBeUndefined();
    expect(mockedLog).toHaveBeenCalledWith("warn", expect.stringContaining("failed to parse"), {
      msgType: "cosmos.staking.v1beta1.MsgDelegate",
    });

    mockedLog.mockClear();
    expect(
      parseQueuedMessage("cosmos.staking.v1beta1.MsgEditValidator", "garbage"),
    ).toBeUndefined();
    expect(mockedLog).not.toHaveBeenCalled();
  });
});

describe("mergeQueuedMessages", () => {
  const params = { blockHeight: 100, epochBoundary: 360, unbondingPeriodDays: 2 };

  const delegation = (validatorAddress: string, amount: number): CosmosDelegation => ({
    validatorAddress,
    amount: new BigNumber(amount),
    pendingRewards: new BigNumber(0),
    status: "bonded",
  });
  const delegate = (validatorAddress: string, amount: number): QueuedStakingMessage => ({
    type: "delegate",
    delegatorAddress: "bbn1me",
    validatorAddress,
    amount: new BigNumber(amount),
    denom: "ubbn",
  });
  const undelegate = (validatorAddress: string, amount: number): QueuedStakingMessage => ({
    type: "undelegate",
    delegatorAddress: "bbn1me",
    validatorAddress,
    amount: new BigNumber(amount),
    denom: "ubbn",
  });
  const redelegate = (src: string, dst: string, amount: number): QueuedStakingMessage => ({
    type: "redelegate",
    delegatorAddress: "bbn1me",
    validatorSrcAddress: src,
    validatorDstAddress: dst,
    amount: new BigNumber(amount),
    denom: "ubbn",
  });
  const sumOf = (arrays: { amount: BigNumber }[][]): BigNumber =>
    arrays.flat().reduce((acc, item) => acc.plus(item.amount), new BigNumber(0));

  it("creates a pending delegation entry for a queued delegate", () => {
    const result = mergeQueuedMessages(
      { delegations: [], redelegations: [], unbondings: [] },
      [delegate("bbnvaloper1aaa", 30)],
      params,
    );
    expect(result.delegations).toEqual([
      {
        validatorAddress: "bbnvaloper1aaa",
        amount: new BigNumber(30),
        pendingRewards: new BigNumber(0),
        status: "bonded",
      },
    ]);
    expect(result.unbondings).toEqual([]);
    expect(result.redelegations).toEqual([]);
  });

  it("increments an existing delegation for a queued delegate, without mutating the input", () => {
    const existing = [delegation("bbnvaloper1aaa", 50)];
    const result = mergeQueuedMessages(
      { delegations: existing, redelegations: [], unbondings: [] },
      [delegate("bbnvaloper1aaa", 30)],
      params,
    );
    expect(result.delegations).toEqual([expect.objectContaining({ amount: new BigNumber(80) })]);
    expect(existing[0].amount).toEqual(new BigNumber(50));
  });

  it("moves a queued undelegate from delegations to unbondings", () => {
    const result = mergeQueuedMessages(
      { delegations: [delegation("bbnvaloper1aaa", 50)], redelegations: [], unbondings: [] },
      [undelegate("bbnvaloper1aaa", 10)],
      params,
    );
    expect(result.delegations).toEqual([expect.objectContaining({ amount: new BigNumber(40) })]);
    expect(result.unbondings).toEqual([
      expect.objectContaining({ validatorAddress: "bbnvaloper1aaa", amount: new BigNumber(10) }),
    ]);
  });

  it("estimates the unbonding completion date from the epoch boundary distance", () => {
    const before = Date.now();
    const { unbondings } = mergeQueuedMessages(
      { delegations: [delegation("bbnvaloper1aaa", 50)], redelegations: [], unbondings: [] },
      [undelegate("bbnvaloper1aaa", 10)],
      params,
    );
    const after = Date.now();
    // (360 - 100) blocks of ~10s + 2 days of unbonding
    const offsetMs = 260 * 10_000 + 2 * 86_400_000;
    expect(unbondings[0].completionDate.getTime()).toBeGreaterThanOrEqual(before + offsetMs);
    expect(unbondings[0].completionDate.getTime()).toBeLessThanOrEqual(after + offsetMs);
  });

  it("clamps over-undelegations so the merge stays balance-neutral", () => {
    const initial = {
      delegations: [delegation("bbnvaloper1aaa", 60)],
      redelegations: [],
      unbondings: [],
    };
    const result = mergeQueuedMessages(
      initial,
      [undelegate("bbnvaloper1aaa", 30), undelegate("bbnvaloper1aaa", 50)],
      params,
    );
    // 30, then min(50, remaining 30): the delegation is consumed, nothing is invented
    expect(result.delegations).toEqual([]);
    expect(result.unbondings.map(u => u.amount)).toEqual([new BigNumber(30), new BigNumber(30)]);
    expect(sumOf([result.delegations, result.unbondings])).toEqual(
      sumOf([initial.delegations, initial.unbondings]),
    );
  });

  it("ignores an undelegate without a matching delegation", () => {
    const result = mergeQueuedMessages(
      { delegations: [], redelegations: [], unbondings: [] },
      [undelegate("bbnvaloper1aaa", 10)],
      params,
    );
    expect(result.delegations).toEqual([]);
    expect(result.unbondings).toEqual([]);
  });

  it("moves a queued redelegate between validators, clamped to the source delegation", () => {
    const initial = {
      delegations: [delegation("bbnvaloper1src", 50)],
      redelegations: [],
      unbondings: [],
    };
    const result = mergeQueuedMessages(
      initial,
      [redelegate("bbnvaloper1src", "bbnvaloper1dst", 80)],
      params,
    );
    expect(result.delegations).toEqual([
      expect.objectContaining({ validatorAddress: "bbnvaloper1dst", amount: new BigNumber(50) }),
    ]);
    expect(result.redelegations).toEqual([
      expect.objectContaining({
        validatorSrcAddress: "bbnvaloper1src",
        validatorDstAddress: "bbnvaloper1dst",
        amount: new BigNumber(50),
      }),
    ]);
    expect(sumOf([result.delegations])).toEqual(sumOf([initial.delegations]));
  });

  it("applies messages in queue order (delegate then redelegate of the same funds)", () => {
    const result = mergeQueuedMessages(
      { delegations: [], redelegations: [], unbondings: [] },
      [delegate("bbnvaloper1aaa", 30), redelegate("bbnvaloper1aaa", "bbnvaloper1bbb", 30)],
      params,
    );
    expect(result.delegations).toEqual([
      expect.objectContaining({ validatorAddress: "bbnvaloper1bbb", amount: new BigNumber(30) }),
    ]);
  });

  it("drops delegation entries that reach zero", () => {
    const result = mergeQueuedMessages(
      { delegations: [delegation("bbnvaloper1aaa", 50)], redelegations: [], unbondings: [] },
      [undelegate("bbnvaloper1aaa", 50)],
      params,
    );
    expect(result.delegations).toEqual([]);
    expect(result.unbondings).toEqual([expect.objectContaining({ amount: new BigNumber(50) })]);
  });
});

describe("fetchQueuedStakingMessages", () => {
  const endpoint = "https://lcd.test";
  const address = "bbn1me";
  const stakingMsg = (delegator: string, denom: string, amount: string) => ({
    msg_type: "cosmos.staking.v1beta1.MsgDelegate",
    msg: `delegator_address:"${delegator}" validator_address:"bbnvaloper1aaa" amount:<denom:"${denom}" amount:"${amount}" >`,
  });

  // network is mocked; the AxiosResponse envelope is irrelevant here, so build just `{ data }`
  const mockNetworkByUrl = (handler: (url: string) => unknown) => {
    mockedNetwork.mockImplementation(((opts: { url: string }) =>
      Promise.resolve({ data: handler(opts.url) })) as any);
  };

  it("follows pagination and merges every page, url-encoding the page key", async () => {
    const requested: string[] = [];
    mockNetworkByUrl(url => {
      requested.push(url);
      if (url.includes("current_epoch")) {
        return { current_epoch: "5", epoch_boundary: "360" };
      }
      const isSecondPage = url.includes("pagination.key=");
      return {
        msgs: [stakingMsg(address, "ubbn", isSecondPage ? "20" : "10")],
        pagination: { next_key: isSecondPage ? null : "K/y+=", total: "2" },
      };
    });

    const result = await fetchQueuedStakingMessages(endpoint, address, "ubbn");

    expect(result?.epochBoundary).toEqual(360);
    expect(result?.messages.map(m => m.amount)).toEqual([new BigNumber(10), new BigNumber(20)]);
    expect(requested.some(u => u.includes("pagination.key=K%2Fy%2B%3D"))).toBe(true);
  });

  it("filters out foreign delegators and denoms", async () => {
    mockNetworkByUrl(url => {
      if (url.includes("current_epoch")) {
        return { current_epoch: "5", epoch_boundary: "360" };
      }
      return {
        msgs: [
          stakingMsg(address, "ubbn", "10"),
          stakingMsg("bbn1stranger", "ubbn", "99"),
          stakingMsg(address, "ibc/ABC123", "77"),
        ],
        pagination: { next_key: null, total: "3" },
      };
    });

    const result = await fetchQueuedStakingMessages(endpoint, address, "ubbn");

    expect(result?.messages).toEqual([
      expect.objectContaining({
        delegatorAddress: address,
        denom: "ubbn",
        amount: new BigNumber(10),
      }),
    ]);
  });

  it("skips the merge (returns null) when the queue exceeds the pagination cap", async () => {
    mockNetworkByUrl(url => {
      if (url.includes("current_epoch")) {
        return { current_epoch: "5", epoch_boundary: "360" };
      }
      // next_key never clears -> the page cap is reached with more pages remaining
      return {
        msgs: [stakingMsg(address, "ubbn", "1")],
        pagination: { next_key: "more", total: "9999" },
      };
    });

    const result = await fetchQueuedStakingMessages(endpoint, address, "ubbn");

    expect(result).toBeNull();
    expect(mockedLog).toHaveBeenCalledWith("warn", expect.stringContaining("pagination cap"));
  });

  it("skips the merge (returns null) when the epoch rolls over between reads", async () => {
    let epochCall = 0;
    mockNetworkByUrl(url => {
      if (url.includes("current_epoch")) {
        const epoch = epochCall === 0 ? "5" : "6";
        epochCall += 1;
        return { current_epoch: epoch, epoch_boundary: "360" };
      }
      return {
        msgs: [stakingMsg(address, "ubbn", "10")],
        pagination: { next_key: null, total: "1" },
      };
    });

    const result = await fetchQueuedStakingMessages(endpoint, address, "ubbn");

    expect(result).toBeNull();
  });

  it("fails open (returns null) when the endpoint errors", async () => {
    mockedNetwork.mockRejectedValue(new Error("404"));

    const result = await fetchQueuedStakingMessages(endpoint, address, "ubbn");

    expect(result).toBeNull();
  });
});
