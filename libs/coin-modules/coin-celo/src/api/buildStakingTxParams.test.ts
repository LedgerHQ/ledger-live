import { accountsABI, electionABI, lockedGoldABI } from "@celo/abis";
import type { BufferTxData, MemoNotSupported } from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { encodeFunctionData } from "viem";

jest.mock("../network/registry", () => ({ getRegistryAddressFor: jest.fn() }));
jest.mock("../network/sdk", () => ({ getPendingWithdrawals: jest.fn() }));
jest.mock("./voteNeighbors", () => ({ getVoteNeighbors: jest.fn() }));

import { getRegistryAddressFor } from "../network/registry";
import { getPendingWithdrawals } from "../network/sdk";
import { buildStakingTxParams } from "./buildStakingTxParams";
import type { CeloStakingIntent, CeloStakingType } from "./stakingIntent";
import { getVoteNeighbors } from "./voteNeighbors";

const ACCOUNTS = "0x1111111111111111111111111111111111111111" as `0x${string}`;
const LOCKED = "0x2222222222222222222222222222222222222222" as `0x${string}`;
const ELECTION = "0x3333333333333333333333333333333333333333" as `0x${string}`;
const GROUP = "0x4444444444444444444444444444444444444444" as `0x${string}`;
const LESSER = "0x5555555555555555555555555555555555555555" as `0x${string}`;
const GREATER = "0x6666666666666666666666666666666666666666" as `0x${string}`;
const SENDER = "0x7777777777777777777777777777777777777777";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as `0x${string}`;

const REGISTRY: Record<string, `0x${string}`> = {
  Accounts: ACCOUNTS,
  LockedGold: LOCKED,
  Election: ELECTION,
};

const makeIntent = (
  type: CeloStakingType,
  overrides: Partial<CeloStakingIntent> = {},
): CeloStakingIntent =>
  ({
    intentType: "staking",
    type,
    sender: SENDER,
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    data: { type: "buffer", value: Buffer.from([]) } as BufferTxData,
    ...overrides,
  }) as CeloStakingIntent & { data: BufferTxData; memo?: MemoNotSupported };

describe("buildStakingTxParams", () => {
  beforeEach(() => {
    (getRegistryAddressFor as unknown as jest.Mock)
      .mockReset()
      .mockImplementation(async (name: string) => REGISTRY[name]);
    (getVoteNeighbors as jest.Mock)
      .mockReset()
      .mockResolvedValue({ lesser: LESSER, greater: GREATER });
    (getPendingWithdrawals as jest.Mock).mockReset();
  });

  it("register → Accounts.createAccount(), value 0", async () => {
    const params = await buildStakingTxParams(makeIntent("celo.register"));
    expect(params.to).toBe(ACCOUNTS);
    expect(params.value).toBe(0n);
    expect(params.data).toBe(
      encodeFunctionData({ abi: accountsABI, functionName: "createAccount" }),
    );
  });

  it("lock → LockedGold.lock(), value = amount", async () => {
    const params = await buildStakingTxParams(makeIntent("celo.lock", { amount: 100n }));
    expect(params.to).toBe(LOCKED);
    expect(params.value).toBe(100n);
    expect(params.data).toBe(encodeFunctionData({ abi: lockedGoldABI, functionName: "lock" }));
  });

  it("unlock → LockedGold.unlock(amount), value 0", async () => {
    const params = await buildStakingTxParams(makeIntent("celo.unlock", { amount: 60n }));
    expect(params.to).toBe(LOCKED);
    expect(params.value).toBe(0n);
    expect(params.data).toBe(
      encodeFunctionData({ abi: lockedGoldABI, functionName: "unlock", args: [60n] }),
    );
  });

  it("withdraw → LockedGold.withdraw(earliest matured index)", async () => {
    const past = Math.floor(Date.now() / 1000) - 100;
    (getPendingWithdrawals as jest.Mock).mockResolvedValue([
      { value: new BigNumber(10), time: new BigNumber(past), index: 2 },
    ]);
    const params = await buildStakingTxParams(makeIntent("celo.withdraw"));
    expect(params.to).toBe(LOCKED);
    expect(params.data).toBe(
      encodeFunctionData({ abi: lockedGoldABI, functionName: "withdraw", args: [2n] }),
    );
  });

  it("withdraw → throws when no pending withdrawal has matured", async () => {
    const future = Math.floor(Date.now() / 1000) + 100_000;
    (getPendingWithdrawals as jest.Mock).mockResolvedValue([
      { value: new BigNumber(10), time: new BigNumber(future), index: 0 },
    ]);
    await expect(buildStakingTxParams(makeIntent("celo.withdraw"))).rejects.toThrow(/no matured/);
  });

  it("vote → Election.vote(group, amount, lesser, greater), neighbors added", async () => {
    const params = await buildStakingTxParams(
      makeIntent("celo.vote", { valAddress: GROUP, amount: 100n }),
    );
    expect(getVoteNeighbors).toHaveBeenCalledWith(ELECTION, GROUP, 100n, true);
    expect(params.to).toBe(ELECTION);
    expect(params.value).toBe(0n);
    expect(params.data).toBe(
      encodeFunctionData({
        abi: electionABI,
        functionName: "vote",
        args: [GROUP, 100n, LESSER, GREATER],
      }),
    );
  });

  it("activate → Election.activate(group)", async () => {
    const params = await buildStakingTxParams(makeIntent("celo.activate", { valAddress: GROUP }));
    expect(params.to).toBe(ELECTION);
    expect(params.data).toBe(
      encodeFunctionData({ abi: electionABI, functionName: "activate", args: [GROUP] }),
    );
  });

  it("revokePending → Election.revokePending(...), neighbors removed", async () => {
    const params = await buildStakingTxParams(
      makeIntent("celo.revokePending", { valAddress: GROUP, amount: 40n }),
    );
    expect(getVoteNeighbors).toHaveBeenCalledWith(ELECTION, GROUP, 40n, false);
    expect(params.data).toBe(
      encodeFunctionData({
        abi: electionABI,
        functionName: "revokePending",
        args: [GROUP, 40n, LESSER, GREATER, 0n],
      }),
    );
  });

  it("revokeActive → Election.revokeActive(...)", async () => {
    const params = await buildStakingTxParams(
      makeIntent("celo.revokeActive", { valAddress: GROUP, amount: 40n }),
    );
    expect(params.data).toBe(
      encodeFunctionData({
        abi: electionABI,
        functionName: "revokeActive",
        args: [GROUP, 40n, LESSER, GREATER, 0n],
      }),
    );
  });

  it("uses recipient as the group when valAddress is absent", async () => {
    await buildStakingTxParams(makeIntent("celo.activate", { recipient: GROUP }));
    // activate encodes the group from recipient
    const params = await buildStakingTxParams(makeIntent("celo.activate", { recipient: GROUP }));
    expect(params.data).toBe(
      encodeFunctionData({ abi: electionABI, functionName: "activate", args: [GROUP] }),
    );
  });

  it("throws when a group operation has no validator group", async () => {
    await expect(buildStakingTxParams(makeIntent("celo.vote", { amount: 1n }))).rejects.toThrow(
      /validator group/,
    );
  });

  it("attaches feeCurrency to the params when provided", async () => {
    const params = await buildStakingTxParams(
      makeIntent("celo.lock", { amount: 1n }),
      USDC_ADAPTER,
    );
    expect(params.feeCurrency).toBe(USDC_ADAPTER);
  });
});
