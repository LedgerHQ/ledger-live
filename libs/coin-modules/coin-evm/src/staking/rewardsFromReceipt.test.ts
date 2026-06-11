import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { enrichRewardOperationsValue, sumRewardFromReceiptLogs } from "./rewardsFromReceipt";
import { STAKING_CONTRACTS } from "./contracts";
import { LogWithAddress } from "../network/node/types";

const MONAD_DECODER = STAKING_CONTRACTS.monad.rewardsEventDecoder!;
const SEI_DECODER = STAKING_CONTRACTS.sei_evm.rewardsEventDecoder!;

const MONAD_STAKING = "0x0000000000000000000000000000000000001000";
const SEI_DISTRIBUTION = "0x0000000000000000000000000000000000001007";
const CLAIM_REWARDS_TOPIC = "0xcb607e6b63c89c95f6ae24ece9fe0e38a7971aa5ed956254f1df47490921727b";
const DELEGATE_TOPIC = "0xe4d4df1e1827dd28252fd5c3cd7ebccd3da6e0aa31f74c828f3c8542af49d840";
const SEI_REWARD_TOPIC = "0xe9a2d1cd042608da4ebdf1fafb4a4658dfc6954ce121138e784b3f9372505d11";

// Real Monad mainnet delegator (txs 0x8784… compound / 0xc056… claim).
const MONAD_DELEGATOR = "0x66c4371ae8ffed2ec1c2ebbbccfb7e494181e1e3";
const MONAD_DELEGATOR_TOPIC = "0x00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e3";
// Real Sei delegator (tx 0x59c8…).
const SEI_DELEGATOR = "0x0a3efc2b7ffb6cb6b2432850121f8fdf0dfde611";
const SEI_DELEGATOR_TOPIC = "0x0000000000000000000000000a3efc2b7ffb6cb6b2432850121f8fdf0dfde611";

// ClaimRewards data = (uint256 amount, uint256 epoch).
const monadClaimRewardsLog = (delegatorTopic: string, amountHex: string): LogWithAddress => ({
  address: MONAD_STAKING,
  topics: [CLAIM_REWARDS_TOPIC, "0x" + "00".repeat(31) + "17", delegatorTopic],
  data: "0x" + amountHex.padStart(64, "0") + "643".padStart(64, "0"),
});

describe("sumRewardFromReceiptLogs", () => {
  it("returns the ClaimRewards amount for a Monad claim (single log)", () => {
    const logs = [monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "030405ea888e")];
    expect(sumRewardFromReceiptLogs(logs, MONAD_DECODER, MONAD_DELEGATOR)).toBe(3315814008974n);
  });

  it("counts only ClaimRewards and ignores the Delegate restake log for a Monad compound", () => {
    const logs: LogWithAddress[] = [
      monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "020ab3a91aeb"),
      {
        address: MONAD_STAKING,
        topics: [DELEGATE_TOPIC, "0x" + "00".repeat(31) + "05", MONAD_DELEGATOR_TOPIC],
        data: "0x" + "020ab3a91aeb".padStart(64, "0") + "644".padStart(64, "0"),
      },
    ];
    expect(sumRewardFromReceiptLogs(logs, MONAD_DECODER, MONAD_DELEGATOR)).toBe(2244987132651n);
  });

  it("sums multiple validator ClaimRewards logs", () => {
    const logs = [
      monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "030405ea888e"),
      monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "020ab3a91aeb"),
    ];
    expect(sumRewardFromReceiptLogs(logs, MONAD_DECODER, MONAD_DELEGATOR)).toBe(
      3315814008974n + 2244987132651n,
    );
  });

  it("excludes logs emitted for a different delegator", () => {
    const otherDelegatorTopic = "0x" + "00".repeat(12) + "dead".repeat(10);
    const logs = [monadClaimRewardsLog(otherDelegatorTopic, "030405ea888e")];
    expect(sumRewardFromReceiptLogs(logs, MONAD_DECODER, MONAD_DELEGATOR)).toBe(0n);
  });

  it("ignores logs from a different contract or topic", () => {
    const logs: LogWithAddress[] = [
      { ...monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "030405ea888e"), address: SEI_DISTRIBUTION },
      { ...monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "030405ea888e"), topics: [DELEGATE_TOPIC] },
    ];
    expect(sumRewardFromReceiptLogs(logs, MONAD_DECODER, MONAD_DELEGATOR)).toBe(0n);
  });

  it("reads the amount after the string offset and scales usei→wei for Sei", () => {
    // data = (string validator, uint256 amount): word0 = string offset, word1 = amount (0x44f67).
    const logs: LogWithAddress[] = [
      {
        address: SEI_DISTRIBUTION,
        topics: [SEI_REWARD_TOPIC, SEI_DELEGATOR_TOPIC],
        data: "0x" + "40".padStart(64, "0") + "44f67".padStart(64, "0") + "31".padStart(64, "0"),
      },
    ];
    expect(sumRewardFromReceiptLogs(logs, SEI_DECODER, SEI_DELEGATOR)).toBe(282471n * 10n ** 12n);
  });
});

describe("enrichRewardOperationsValue", () => {
  const rewardOp = (hash: string, sender: string): Operation =>
    ({
      id: `js:2:monad:${sender}:${hash}-REWARD`,
      hash,
      type: "REWARD",
      value: new BigNumber(0),
      senders: [sender],
      recipients: [MONAD_STAKING],
    }) as Operation;

  it("patches the REWARD op value from the receipt logs", async () => {
    const op = rewardOp("0xabc", MONAD_DELEGATOR);
    const getReceipt = jest
      .fn()
      .mockResolvedValue({ logs: [monadClaimRewardsLog(MONAD_DELEGATOR_TOPIC, "030405ea888e")] });

    await enrichRewardOperationsValue("monad", [op], getReceipt);

    expect(getReceipt).toHaveBeenCalledWith("0xabc");
    expect(op.value).toStrictEqual(new BigNumber("3315814008974"));
  });

  it("is a no-op for a currency without a rewardsEventDecoder", async () => {
    const op = rewardOp("0xabc", MONAD_DELEGATOR);
    const getReceipt = jest.fn();

    await enrichRewardOperationsValue("ethereum", [op], getReceipt);

    expect(getReceipt).not.toHaveBeenCalled();
    expect(op.value).toStrictEqual(new BigNumber(0));
  });

  it("only fetches receipts for zero-value REWARD ops", async () => {
    const out = { ...rewardOp("0xout", MONAD_DELEGATOR), type: "OUT" } as Operation;
    const nonZero = { ...rewardOp("0xnz", MONAD_DELEGATOR), value: new BigNumber(5) } as Operation;
    const getReceipt = jest.fn().mockResolvedValue(null);

    await enrichRewardOperationsValue("monad", [out, nonZero], getReceipt);

    expect(getReceipt).not.toHaveBeenCalled();
  });

  it("leaves the op untouched when the receipt fetch fails", async () => {
    const op = rewardOp("0xabc", MONAD_DELEGATOR);
    const getReceipt = jest.fn().mockRejectedValue(new Error("rpc down"));

    await enrichRewardOperationsValue("monad", [op], getReceipt);

    expect(op.value).toStrictEqual(new BigNumber(0));
  });
});
