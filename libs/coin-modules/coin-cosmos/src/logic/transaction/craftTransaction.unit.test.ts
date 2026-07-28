import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";
import { craftTransaction, CosmosCraftedTransaction } from "./craftTransaction";

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq",
  recipient: "cosmos1recipient",
  amount: 1000000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

const makeApi = () =>
  ({
    getCurrency: () => ({ id: "cosmos", units: [{}, { code: "uatom" }] }),
    getAccount: jest.fn().mockResolvedValue({
      accountNumber: 7,
      sequence: 3,
      pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      pubKey: "",
    }),
    getNodeInfo: jest.fn().mockResolvedValue({
      default_node_info: { network: "cosmoshub-4" },
    }),
  }) as unknown as CosmosAPI;

describe("logic/transaction/craftTransaction", () => {
  it("crafts a send payload with proto MsgSend, fee, sequence and chain id", async () => {
    const api = makeApi();

    const crafted = await craftTransaction(api, "cosmos", sendIntent, {
      value: 500n,
      parameters: { gasLimit: "200000" },
    });
    const payload = JSON.parse(crafted.transaction) as CosmosCraftedTransaction;

    expect(payload.protoMsgs).toHaveLength(1);
    expect(payload.protoMsgs[0].typeUrl).toBe("/cosmos.bank.v1beta1.MsgSend");
    expect(payload.sequence).toBe("3");
    expect(payload.accountNumber).toBe("7");
    expect(payload.gasLimit).toBe("200000");
    expect(payload.feeAmount).toEqual([{ denom: "uatom", amount: "500" }]);
    expect(payload.chainId).toBe("cosmoshub-4");
    expect(payload.signable.length).toBeGreaterThan(0);
  });

  it("crafts a delegate staking transaction with a MsgDelegate proto message", async () => {
    const api = makeApi();

    const delegateIntent = {
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      sender: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "cosmosvaloper1validator",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const crafted = await craftTransaction(api, "cosmos", delegateIntent, {
      value: 500n,
      parameters: { gasLimit: "250000" },
    });
    const payload = JSON.parse(crafted.transaction) as CosmosCraftedTransaction;

    expect(payload.protoMsgs).toHaveLength(1);
    expect(payload.protoMsgs[0].typeUrl).toContain("MsgDelegate");
  });

  it("throws when customFees carries no gas limit", async () => {
    const api = makeApi();

    await expect(craftTransaction(api, "cosmos", sendIntent, { value: 500n })).rejects.toThrow(
      "missing gas limit",
    );
  });

  it("rejects an unsupported staking mode", async () => {
    const api = makeApi();

    const withdrawIntent = {
      intentType: "staking",
      mode: "withdraw",
      sender: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq",
      recipient: "",
      amount: 0n,
      valAddress: "cosmosvaloper1validator",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    await expect(craftTransaction(api, "cosmos", withdrawIntent)).rejects.toThrow(
      "unsupported staking mode",
    );
  });

  it("throws on an invalid sender address before hitting the network", async () => {
    const api = makeApi();
    const badSender = { ...sendIntent, sender: "cosmos1invalid" } as unknown as TransactionIntent;

    await expect(
      craftTransaction(api, "cosmos", badSender, {
        value: 500n,
        parameters: { gasLimit: "200000" },
      }),
    ).rejects.toThrow("invalid sender address");
    expect(api.getAccount).not.toHaveBeenCalled();
  });
});
