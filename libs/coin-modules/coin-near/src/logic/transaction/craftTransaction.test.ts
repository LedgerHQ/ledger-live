import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import * as nearAPI from "near-api-js";
import { getAccessKey } from "../../network";
import { craftTransaction } from "./craftTransaction";

jest.mock("../../network", () => ({ getAccessKey: jest.fn() }));

const SENDER = "sender.near";
const RECIPIENT = "recipient.near";
const VALIDATOR = "astro-stakers.poolv1.near";
const PUBLIC_KEY = "ed25519:HYgHRZBqhvhV4RLsBTz2CoM3JMVYFHDs1QLLZfDdWfPn";
const BLOCK_HASH = "6ykMPuAsmyPvVMSLKvfg7DBUZP9tYcgKNzVLrLxSnLpj";
const NONCE = 41;

/** exactOptionalPropertyTypes is on, so an explicit `undefined` override needs the union. */
type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

const intent = (overrides: Overrides<TransactionIntent> = {}): TransactionIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 5_000_000_000_000_000_000_000_000n,
    asset: { type: "native" },
    senderPublicKey: PUBLIC_KEY,
    ...overrides,
  }) as TransactionIntent;

const stakingIntent = (
  mode: StakingTransactionIntent["mode"],
  overrides: Overrides<StakingTransactionIntent> = {},
): StakingTransactionIntent =>
  ({
    ...intent(),
    intentType: "staking",
    type: mode,
    mode,
    valAddress: VALIDATOR,
    ...overrides,
  }) as StakingTransactionIntent;

/** What the framework actually hands us for NEAR: the operation in `type`, the pool as recipient. */
const typedStakingIntent = (type: string): StakingTransactionIntent =>
  ({
    ...intent(),
    intentType: "staking",
    type,
    recipient: VALIDATOR,
  }) as StakingTransactionIntent;

const decode = (base64: string) =>
  nearAPI.transactions.Transaction.decode(Buffer.from(base64, "base64"));

const methodOf = (base64: string) =>
  (decode(base64).actions[0] as unknown as { functionCall: { methodName: string } }).functionCall
    .methodName;

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessKey as jest.Mock).mockResolvedValue({ nonce: NONCE, block_hash: BLOCK_HASH });
  });

  it("crafts a transfer addressed to the recipient", async () => {
    const { transaction, details } = await craftTransaction(intent());
    const decoded = decode(transaction);

    expect(decoded.signerId).toBe(SENDER);
    expect(decoded.receiverId).toBe(RECIPIENT);
    // Borsh decoding yields a plain { keyType, data }, so compare the raw key bytes.
    expect(Buffer.from(decoded.publicKey.data).toString("hex")).toBe(
      Buffer.from(nearAPI.utils.PublicKey.fromString(PUBLIC_KEY).data).toString("hex"),
    );
    expect(details).toMatchObject({ mode: "send", receiverId: RECIPIENT });
  });

  it("takes the next nonce from the sender's access key", async () => {
    const { transaction, details } = await craftTransaction(intent());

    expect(getAccessKey).toHaveBeenCalledWith({ address: SENDER, publicKey: PUBLIC_KEY });
    expect(decode(transaction).nonce.toString()).toBe(String(NONCE + 1));
    expect(details).toMatchObject({ nonce: NONCE + 1 });
  });

  it.each([
    ["delegate", "stake"],
    ["undelegate", "unstake"],
    ["withdraw", "withdraw"],
  ] as const)("addresses a %s intent to the staking pool as mode %s", async (mode, expected) => {
    const { transaction, details } = await craftTransaction(stakingIntent(mode));

    expect(decode(transaction).receiverId).toBe(VALIDATOR);
    expect(details).toMatchObject({ mode: expected, receiverId: VALIDATOR });
  });

  it("uses the _all pool method when a staking intent spends everything", async () => {
    const { transaction } = await craftTransaction(
      stakingIntent("undelegate", { useAllAmount: true }),
    );

    expect(methodOf(transaction)).toBe("unstake_all");
  });

  it.each([
    ["stake", "deposit_and_stake"],
    ["unstake", "unstake"],
    ["finalize_unstake", "withdraw"],
  ] as const)(
    "calls %s on the pool when the operation only comes as an intent type",
    async (type, method) => {
      const { transaction } = await craftTransaction(typedStakingIntent(type));

      expect(decode(transaction).receiverId).toBe(VALIDATOR);
      expect(methodOf(transaction)).toBe(method);
    },
  );

  it("rejects a staking operation the module does not implement", async () => {
    await expect(craftTransaction(stakingIntent("redelegate"))).rejects.toThrow(
      "staking operation redelegate is not supported",
    );
  });

  it("requires a validator address for a staking intent", async () => {
    await expect(
      craftTransaction(stakingIntent("delegate", { valAddress: "", recipient: "" })),
    ).rejects.toThrow("validator address is required");
  });

  it("requires the sender public key, which carries the nonce's access key", async () => {
    await expect(craftTransaction(intent({ senderPublicKey: undefined }))).rejects.toThrow(
      "senderPublicKey is required",
    );
    expect(getAccessKey).not.toHaveBeenCalled();
  });

  it("requires a recipient", async () => {
    await expect(craftTransaction(intent({ recipient: "" }))).rejects.toThrow(
      "recipient is required",
    );
  });

  it("rejects a malformed sender before hitting the network", async () => {
    await expect(craftTransaction(intent({ sender: "NOT VALID" }))).rejects.toThrow(
      "invalid sender address NOT VALID",
    );
    expect(getAccessKey).not.toHaveBeenCalled();
  });

  it("rejects a malformed recipient before hitting the network", async () => {
    await expect(craftTransaction(intent({ recipient: "NOT VALID" }))).rejects.toThrow(
      "invalid recipient address NOT VALID",
    );
    expect(getAccessKey).not.toHaveBeenCalled();
  });

  it("fails clearly when the account has no access key for that public key", async () => {
    (getAccessKey as jest.Mock).mockResolvedValue({});

    await expect(craftTransaction(intent())).rejects.toThrow(`no access key found for ${SENDER}`);
  });
});
