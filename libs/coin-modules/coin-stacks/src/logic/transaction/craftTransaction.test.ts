import type {
  MemoNotSupported,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { makeUnsignedContractCall, Pc, transactionToHex } from "@stacks/transactions";
import {
  createStxTransferTransaction,
  createTokenTransferTransaction,
} from "../../bridge/utils/transactions";
import { STACKS_DUMMY_ADDRESS } from "../../constants";
import { fetchPoxInfo } from "../../network/pox";
import type { StacksTxData } from "../../types";
import { getBalance } from "../account/getBalance";
import { getNextSequence } from "../account/getNextSequence";
import { getStakes } from "../getStakes";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";

jest.mock("../account/getBalance");
jest.mock("../account/getNextSequence");
jest.mock("./estimateFees");
jest.mock("../../bridge/utils/transactions");
jest.mock("../../network/pox");
jest.mock("../getStakes");
jest.mock("@stacks/transactions", () => {
  const actual = jest.requireActual("@stacks/transactions");
  return {
    ...actual,
    makeUnsignedContractCall: jest.fn(),
    transactionToHex: jest.fn(),
  };
});

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";
const PUBLIC_KEY = "02" + "ab".repeat(32);
const FAKE_TX = { payload: {} };

function transferIntent(
  overrides: Partial<TransactionIntent<MemoNotSupported, StacksTxData>> = {},
): TransactionIntent<MemoNotSupported, StacksTxData> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1000n,
    asset: { type: "native" },
    senderPublicKey: PUBLIC_KEY,
    data: { type: "stacks-pox" },
    ...overrides,
  };
}

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getNextSequence as jest.Mock).mockResolvedValue(5n);
    (estimateFees as jest.Mock).mockResolvedValue({ value: 300n });
    (transactionToHex as jest.Mock).mockReturnValue("0xcrafted");
  });

  it("crafts a native STX transfer, resolving nonce and fee when not provided", async () => {
    (createStxTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);

    const result = await craftTransaction(transferIntent());

    expect(getNextSequence).toHaveBeenCalledWith(SENDER);
    expect(estimateFees).toHaveBeenCalled();
    expect(createStxTransferTransaction).toHaveBeenCalledWith(
      expect.anything(),
      RECIPIENT,
      expect.anything(),
      "mainnet",
      PUBLIC_KEY,
      expect.objectContaining({ fee: expect.anything(), nonce: expect.anything() }),
    );
    expect(result).toEqual({ transaction: "0xcrafted" });
  });

  it("uses the intent's sequence and customFees when provided, skipping resolution", async () => {
    (createStxTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);

    await craftTransaction(transferIntent({ sequence: 42n }), { value: 900n });

    expect(getNextSequence).not.toHaveBeenCalled();
    expect(estimateFees).not.toHaveBeenCalled();
    const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
    expect(call[5].fee.toString()).toBe("900");
    expect(call[5].nonce.toString()).toBe("42");
  });

  it("crafts a SIP-010 transfer, parsing the composite assetReference", async () => {
    (createTokenTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);

    await craftTransaction(
      transferIntent({ asset: { type: "token", assetReference: "SP_CONTRACT.token-x::token-x" } }),
    );

    expect(createTokenTransferTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        contractAddress: "SP_CONTRACT",
        contractName: "token-x",
        assetName: "token-x",
        senderAddress: SENDER,
        recipientAddress: RECIPIENT,
        network: "mainnet",
        publicKey: PUBLIC_KEY,
      }),
    );
  });

  it("throws when senderPublicKey is missing", async () => {
    await expect(craftTransaction(transferIntent({ senderPublicKey: undefined }))).rejects.toThrow(
      "senderPublicKey is required",
    );
  });

  describe("useAllAmount", () => {
    // Defensive resolution: the generic-coin-framework's own `prepareTransaction` step already
    // resolves useAllAmount before calling craftTransaction, but the CoinModuleApi is a
    // general-purpose interface -- another caller (coin-service, coin-tester, direct use) could
    // hand this a raw `{useAllAmount: true, amount: 0n}` intent.
    it("sweeps the native balance minus fee", async () => {
      (createStxTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);
      (getBalance as jest.Mock).mockResolvedValue([{ value: 100000n, asset: { type: "native" } }]);

      await craftTransaction(transferIntent({ useAllAmount: true, amount: 0n }), { value: 300n });

      const call = (createStxTransferTransaction as jest.Mock).mock.calls[0];
      expect(call[0].toString()).toBe("99700");
    });

    it("sweeps the full token balance without subtracting the (native) fee", async () => {
      (createTokenTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);
      (getBalance as jest.Mock).mockResolvedValue([
        { value: 100000n, asset: { type: "native" } },
        { value: 5000n, asset: { type: "token", assetReference: "SP_CONTRACT.token-x::token-x" } },
      ]);

      await craftTransaction(
        transferIntent({
          useAllAmount: true,
          amount: 0n,
          asset: { type: "token", assetReference: "SP_CONTRACT.token-x::token-x" },
        }),
        { value: 300n },
      );

      const call = (createTokenTransferTransaction as jest.Mock).mock.calls[0][0];
      expect(call.amount.toString()).toBe("5000");
    });

    it("throws when the resolved amount is zero (nothing spendable)", async () => {
      (getBalance as jest.Mock).mockResolvedValue([{ value: 100n, asset: { type: "native" } }]);

      await expect(
        craftTransaction(transferIntent({ useAllAmount: true, amount: 0n }), { value: 300n }),
      ).rejects.toThrow("amount must be positive");
    });

    it("substitutes the dummy address for an empty/invalid recipient (fee-estimation probe)", async () => {
      // Same scenario: the Send form probes estimateFees before a recipient has been entered.
      // A c32 address is embedded structurally in the tx, so unlike amount there's no "encode
      // empty" fallback -- the legacy bridge already substitutes STACKS_DUMMY_ADDRESS for this.
      (createStxTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);

      await craftTransaction(transferIntent({ recipient: "" }), { value: 300n });

      expect(createStxTransferTransaction).toHaveBeenCalledWith(
        expect.anything(),
        STACKS_DUMMY_ADDRESS,
        expect.anything(),
        "mainnet",
        PUBLIC_KEY,
        expect.anything(),
      );
    });

    it("does not throw on a not-yet-filled-in draft (amount 0, useAllAmount false)", async () => {
      // Mirrors the generic-coin-framework's default GenericTransaction, which probes
      // estimateFees with a zero amount before the user has entered anything on the Send form.
      (createStxTransferTransaction as jest.Mock).mockResolvedValue(FAKE_TX);

      await expect(
        craftTransaction(transferIntent({ amount: 0n }), { value: 300n }),
      ).resolves.toEqual({ transaction: "0xcrafted" });
    });
  });

  it("throws for a token asset with no assetReference", async () => {
    await expect(craftTransaction(transferIntent({ asset: { type: "token" } }))).rejects.toThrow(
      "token asset requires assetReference",
    );
  });

  it("throws for a malformed SIP-010 assetReference", async () => {
    await expect(
      craftTransaction(
        transferIntent({ asset: { type: "token", assetReference: "not-composite" } }),
      ),
    ).rejects.toThrow('invalid SIP-010 asset reference "not-composite"');
  });

  describe("staking", () => {
    function stakingIntent(
      overrides: Partial<StakingTransactionIntent<MemoNotSupported, StacksTxData>> = {},
    ): TransactionIntent<MemoNotSupported, StacksTxData> {
      return {
        intentType: "staking",
        type: "stake",
        mode: "delegate",
        sender: SENDER,
        recipient: SENDER,
        valAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.signer-manager",
        amount: 1000000n,
        asset: { type: "native" },
        senderPublicKey: PUBLIC_KEY,
        data: { type: "stacks-pox", numCycles: 12, startBurnHt: 961600 },
        ...overrides,
      };
    }

    beforeEach(() => {
      (fetchPoxInfo as jest.Mock).mockResolvedValue({
        contract_id: "SP000000000000000000002Q6VF78.pox-5",
        current_burnchain_block_height: 961566,
        current_cycle: { id: 141, min_threshold_ustx: 0, stacked_ustx: 0, is_pox_active: true },
        reward_cycle_length: 2100,
        first_burnchain_block_height: 0,
      });
      (makeUnsignedContractCall as jest.Mock).mockResolvedValue(FAKE_TX);
    });

    it("crafts a stake call against the dynamically-resolved pox contract", async () => {
      const pcSpy = jest.spyOn(Pc, "principal");

      await craftTransaction(stakingIntent());

      expect(makeUnsignedContractCall).toHaveBeenCalledWith(
        expect.objectContaining({
          contractAddress: "SP000000000000000000002Q6VF78",
          contractName: "pox-5",
          functionName: "stake",
          network: "mainnet",
          // Amount-guarded `staking-postcondition`, not a `pox-postcondition` -- `willPerformPox`
          // is reserved for calls that don't alter locking status (unstake), not `stake` itself.
          postConditions: [
            { type: "staking-postcondition", address: SENDER, condition: "eq", amount: "1000000" },
          ],
        }),
      );
      expect(pcSpy).toHaveBeenCalledWith(SENDER);
    });

    it("throws when delegate is missing numCycles/startBurnHt", async () => {
      await expect(
        craftTransaction(stakingIntent({ data: { type: "stacks-pox" } })),
      ).rejects.toThrow("numCycles and data.startBurnHt");
    });

    it("throws when senderPublicKey is missing", async () => {
      await expect(craftTransaction(stakingIntent({ senderPublicKey: undefined }))).rejects.toThrow(
        "senderPublicKey is required",
      );
    });

    it("crafts an unstake call using the active stake's signer-manager", async () => {
      (getStakes as jest.Mock).mockResolvedValue({
        items: [{ delegate: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.signer-manager" }],
      });

      await craftTransaction(stakingIntent({ mode: "undelegate" }));

      expect(makeUnsignedContractCall).toHaveBeenCalledWith(
        expect.objectContaining({ functionName: "unstake" }),
      );
    });

    it("throws unstake when there is no active stake to leave", async () => {
      (getStakes as jest.Mock).mockResolvedValue({ items: [] });

      await expect(craftTransaction(stakingIntent({ mode: "undelegate" }))).rejects.toThrow(
        "no active stake found",
      );
    });

    it.each(["redelegate", "claimReward", "compoundReward", "withdraw"] as const)(
      "throws for unsupported staking mode %s",
      async mode => {
        await expect(craftTransaction(stakingIntent({ mode }))).rejects.toThrow(
          `staking mode "${mode}" is not supported`,
        );
      },
    );
  });
});
