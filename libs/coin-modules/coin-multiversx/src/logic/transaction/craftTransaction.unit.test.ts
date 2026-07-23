import { craftTransaction } from "./craftTransaction";
import type { MultiversXNetworkApi } from "../../network/api";
import type {
  TransactionIntent,
  StakingTransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  CHAIN_ID,
  MULTIVERSX_STAKING_POOL,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
} from "../../constants";

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

function makeApi(nonce = 10): MultiversXNetworkApi {
  return {
    getAccountNonce: jest.fn().mockResolvedValue(nonce),
    getNetworkConfig: jest.fn().mockResolvedValue({ chainID: CHAIN_ID }),
  } as unknown as MultiversXNetworkApi;
}

function nativeIntent(amount = 1000000000000000000n): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount,
    asset: { type: "native" },
  };
}

describe("craftTransaction", () => {
  it("crafts a native EGLD transfer", async () => {
    const api = makeApi(7);
    const result = await craftTransaction(api, nativeIntent());

    const tx = JSON.parse(result.transaction);
    expect(tx.sender).toBe(SENDER);
    expect(tx.receiver).toBe(RECIPIENT);
    expect(tx.value).toBe("1000000000000000000");
    expect(tx.nonce).toBe(7);
    expect(tx.chainID).toBe(CHAIN_ID);
    expect(tx.version).toBe(TRANSACTION_VERSION_DEFAULT);
    expect(tx.options).toBe(TRANSACTION_OPTIONS_TX_HASH_SIGN);
    expect(tx.data).toBeUndefined();
  });

  it("crafts an ESDT transfer with correct data field", async () => {
    const api = makeApi(3);
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 500n,
      asset: { type: "esdt", assetReference: "USDC-c76f1f" },
    };
    const result = await craftTransaction(api, intent);

    const tx = JSON.parse(result.transaction);
    expect(tx.value).toBe("0");
    // data must be base64-encoded (protocol requirement)
    const decoded = Buffer.from(tx.data, "base64").toString();
    expect(decoded).toMatch(/^ESDTTransfer@/);
    // Hex-encoded identifier must appear
    const hexId = Buffer.from("USDC-c76f1f").toString("hex");
    expect(decoded).toContain(hexId);
    // amount 500 = 0x1f4 (odd length) must be padded to even-length "01f4"
    expect(decoded.endsWith("@01f4")).toBe(true);
  });

  it("crafts a delegate staking transaction", async () => {
    const api = makeApi(1);
    const intent = {
      intentType: "staking",
      type: "delegate",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000000000000000000n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await craftTransaction(api, intent);

    const tx = JSON.parse(result.transaction);
    expect(Buffer.from(tx.data, "base64").toString()).toBe("delegate");
    expect(tx.value).toBe("1000000000000000000");
    expect(tx.receiver).toBe(RECIPIENT); // uses the given provider, not the pool default
  });

  it("requires an explicit recipient for delegate (no staking-pool default)", async () => {
    const api = makeApi(1);
    const intent = {
      intentType: "staking",
      type: "delegate",
      sender: SENDER,
      recipient: "",
      amount: 1000000000000000000n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    await expect(craftTransaction(api, intent)).rejects.toThrow("Invalid recipient");
  });

  it("crafts an unDelegate transaction (value 0, unDelegate@<amount> data)", async () => {
    const api = makeApi(5);
    const intent = {
      intentType: "staking",
      type: "unDelegate",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000000000000000000n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await craftTransaction(api, intent);

    const tx = JSON.parse(result.transaction);
    expect(tx.value).toBe("0");
    expect(Buffer.from(tx.data, "base64").toString()).toMatch(/^unDelegate@/);
  });

  it("crafts a reDelegateRewards transaction (value 0)", async () => {
    const api = makeApi(6);
    const intent = {
      intentType: "staking",
      type: "reDelegateRewards",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 0n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await craftTransaction(api, intent);

    const tx = JSON.parse(result.transaction);
    expect(tx.value).toBe("0");
    expect(Buffer.from(tx.data, "base64").toString()).toBe("reDelegateRewards");
  });

  it("crafts a claimRewards transaction with 0 value", async () => {
    const api = makeApi(2);
    const intent = {
      intentType: "staking",
      type: "claimRewards",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 0n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await craftTransaction(api, intent);

    const tx = JSON.parse(result.transaction);
    expect(Buffer.from(tx.data, "base64").toString()).toBe("claimRewards");
    expect(tx.value).toBe("0");
  });

  it("throws for invalid sender address", async () => {
    const api = makeApi();
    const intent = nativeIntent();
    const bad = { ...intent, sender: "not-a-valid-address" };
    await expect(craftTransaction(api, bad)).rejects.toThrow("Invalid sender");
  });

  it("uses the chainID from the network config (not a hardcoded value)", async () => {
    const api = {
      getAccountNonce: jest.fn().mockResolvedValue(1),
      getNetworkConfig: jest.fn().mockResolvedValue({ chainID: "D" }),
    } as unknown as MultiversXNetworkApi;
    const result = await craftTransaction(api, nativeIntent());

    const tx = JSON.parse(result.transaction);
    expect(tx.chainID).toBe("D");
  });

  it("defaults the withdraw receiver to the staking pool when no recipient is given", async () => {
    const api = makeApi(4);
    const intent = {
      intentType: "staking",
      type: "withdraw",
      sender: SENDER,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await craftTransaction(api, intent);

    const tx = JSON.parse(result.transaction);
    expect(tx.receiver).toBe(MULTIVERSX_STAKING_POOL);
    expect(Buffer.from(tx.data, "base64").toString()).toBe("withdraw");
  });

  it("throws for a missing recipient address", async () => {
    const api = makeApi();
    const intent = { ...nativeIntent(), recipient: "" };
    await expect(craftTransaction(api, intent)).rejects.toThrow("Invalid recipient");
  });

  it("throws for an invalid recipient address", async () => {
    const api = makeApi();
    const intent = { ...nativeIntent(), recipient: "not-a-valid-address" };
    await expect(craftTransaction(api, intent)).rejects.toThrow("Invalid recipient");
  });

  it("throws for unknown asset type", async () => {
    const api = makeApi();
    const intent = {
      ...nativeIntent(),
      asset: { type: "unknown-token" },
    } as unknown as TransactionIntent;
    await expect(craftTransaction(api, intent)).rejects.toThrow("Unsupported asset type");
  });
});
