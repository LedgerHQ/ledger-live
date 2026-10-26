import { Cbor } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { BigNumber } from "bignumber.js";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { InvalidMemoICP } from "../errors";
import { decodeCanisterIdlArgs, getCanisterIdlFunc, ledgerIdlFactory } from "../network/candid";
import type { Transaction } from "../types";
import { createUnsignedSendTransaction, type TransferRawRequest } from "./buildTransaction";
import type { DecodedCallContent } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "./crypto";
import type { IcpIntent } from "./intent";

const PUBKEY =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const SENDER = deriveAddressFromPubkey(PUBKEY);
const RECIPIENT = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const NOW = 1_750_760_220_000;

const intent = (overrides: Partial<IcpIntent> = {}): IcpIntent => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  senderPublicKey: PUBKEY,
  recipient: RECIPIENT,
  amount: 100_000_000n,
  asset: { type: "native" },
  ...overrides,
});

const { senderPublicKey: _publicKey, ...withoutPublicKey } = intent();

const decode = (hex: string) => {
  const { content } = Cbor.decode<{ content: DecodedCallContent }>(Buffer.from(hex, "hex"));
  const [request] = decodeCanisterIdlArgs<[TransferRawRequest]>(
    getCanisterIdlFunc(ledgerIdlFactory, "transfer"),
    content.arg,
  );
  return { content, request };
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});
afterEach(() => jest.useRealTimers());

describe("craftTransaction", () => {
  it("crafts a ledger transfer signed by the sender's principal", () => {
    const { transaction } = craftTransaction(intent());
    const { content, request } = decode(transaction);

    expect(Principal.fromUint8Array(content.canister_id).toText()).toBe(MAINNET_LEDGER_CANISTER_ID);
    expect(content.method_name).toBe("transfer");
    expect(Principal.fromUint8Array(content.sender).toText()).toBe(
      derivePrincipalFromPubkey(PUBKEY).toText(),
    );
    expect(request).toMatchObject({
      amount: { e8s: 100_000_000n },
      fee: { e8s: 10_000n },
      memo: 0n,
      created_at_time: [{ timestamp_nanos: BigInt(NOW) * 1_000_000n }],
    });
    expect(Buffer.from(request.to).toString("hex")).toBe(RECIPIENT);
  });

  it("crafts the blob the account bridge signs", () => {
    const { transaction } = craftTransaction(
      intent({ memo: { type: "string", kind: "memo", value: "42" } } as Partial<IcpIntent>),
    );
    const { unsignedTransaction } = createUnsignedSendTransaction(
      { recipient: RECIPIENT, amount: new BigNumber(100_000_000), memo: "42" } as Transaction,
      PUBKEY,
    );

    expect(transaction).toBe(
      Buffer.from(Cbor.encode({ content: unsignedTransaction })).toString("hex"),
    );
  });

  it("reports when the signed call expires", () => {
    const { transaction, details } = craftTransaction(intent());
    const { content } = decode(transaction);

    expect(details?.expiresAt).toBe(Number(content.ingress_expiry / 1_000_000n));
    expect(details?.expiresAt).toBeGreaterThan(NOW + 3 * 60 * 1000);
    expect(details?.expiresAt).toBeLessThanOrEqual(NOW + 4 * 60 * 1000);
  });

  it("accepts the sender in upper case", () => {
    expect(() => craftTransaction(intent({ sender: SENDER.toUpperCase() }))).not.toThrow();
  });

  it.each([
    ["the ledger fee", 10_000n],
    ["a fee not set yet", 0n],
  ])("accepts %s as a custom fee", (_, value) => {
    expect(() => craftTransaction(intent(), { value })).not.toThrow();
  });

  it("refuses an invalid memo", () => {
    expect(() =>
      craftTransaction(
        intent({ memo: { type: "string", kind: "memo", value: "-1" } } as Partial<IcpIntent>),
      ),
    ).toThrow(InvalidMemoICP);
  });

  it.each([
    ["a staking intent", intent({ intentType: "staking" }), /staking intents/],
    ["a neuron stake", intent({ type: "create_neuron" }), /create_neuron transactions/],
    [
      "a token",
      intent({ asset: { type: "icrc1", assetReference: "x" } as IcpIntent["asset"] }),
      /icrc1 assets/,
    ],
    ["no public key", withoutPublicKey, /senderPublicKey is required/],
    ["another sender", intent({ sender: RECIPIENT }), /not the default account/],
    ["an invalid recipient", intent({ recipient: "00".repeat(32) }), /Invalid recipient/],
    ["a zero amount", intent({ amount: 0n }), /Invalid amount/],
    ["a negative amount", intent({ amount: -1n }), /Invalid amount/],
    ["an amount past Nat64", intent({ amount: 2n ** 64n }), /Invalid amount/],
  ])("refuses %s", (_, input, error) => {
    expect(() => craftTransaction(input)).toThrow(error);
  });

  it("refuses a fee other than the ledger fee", () => {
    expect(() => craftTransaction(intent(), { value: 5_000n })).toThrow(/fee must be/);
  });
});
