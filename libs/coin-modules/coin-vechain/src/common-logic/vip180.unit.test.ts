import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { decodeVip180Transfer, isVip180Transfer, VIP180_TRANSFER_TOPIC } from "./vip180";

// Verbatim from mainnet block 16407374, tx
// 0x5fdd7191c4d476a8e86060d516366e87421f65667b9b3c14c33a740c04921b10: a 10 VTHO transfer, which
// Thor reports as an event on the VTHO contract with an empty `transfers` array.
const TRANSFER_EVENT = {
  address: VTHO_ADDRESS,
  topics: [
    VIP180_TRANSFER_TOPIC,
    "0x000000000000000000000000cf130b42ae31c4931298b4b1c0f1d974b8732957",
    "0x0000000000000000000000000fe6688548f0c303932bb197b0a96034f1d74dba",
  ],
  data: "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
};

const SENDER = "0xcf130b42ae31c4931298b4b1c0f1d974b8732957";
const RECIPIENT = "0x0fe6688548f0c303932bb197b0a96034f1d74dba";
const AMOUNT = BigInt("10000000000000000000");

// Approval(address,address,uint256) — same contract, same arity, different topic 0.
const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

describe("isVip180Transfer", () => {
  it("accepts a VIP-180 Transfer emitted by the queried token", () => {
    expect(isVip180Transfer(TRANSFER_EVENT, VTHO_ADDRESS)).toBe(true);
  });

  it("rejects a log with no topics", () => {
    // A clause can emit an anonymous or topic-less log; `topics[0]` is then undefined, and the
    // optional chaining must reject rather than throw — decodeVip180Transfer would throw on it.
    expect(isVip180Transfer({ ...TRANSFER_EVENT, topics: [] }, VTHO_ADDRESS)).toBe(false);
  });

  it("rejects a non-Transfer event from the queried token", () => {
    const approval = {
      ...TRANSFER_EVENT,
      topics: [APPROVAL_TOPIC, ...TRANSFER_EVENT.topics.slice(1)],
    };
    expect(isVip180Transfer(approval, VTHO_ADDRESS)).toBe(false);
  });

  it("rejects a Transfer emitted by a different token contract", () => {
    const otherToken = { ...TRANSFER_EVENT, address: "0x5db3c8a942333f6468176a870db36eef120a34dc" };
    expect(isVip180Transfer(otherToken, VTHO_ADDRESS)).toBe(false);
  });

  // Thor and the SDK disagree on address casing (lowercase vs EIP-55 checksummed), and topic 0 can
  // come back either way, so the match is case-insensitive on both sides. Without this, VTHO
  // transfers would be silently dropped depending on which source produced the address.
  it("matches regardless of the casing of the event address, the token address, or topic 0", () => {
    const checksummedEvent = {
      ...TRANSFER_EVENT,
      address: VTHO_ADDRESS.toUpperCase().replace("0X", "0x"),
      topics: [
        VIP180_TRANSFER_TOPIC.toUpperCase().replace("0X", "0x"),
        ...TRANSFER_EVENT.topics.slice(1),
      ],
    };

    expect(isVip180Transfer(checksummedEvent, VTHO_ADDRESS)).toBe(true);
    expect(isVip180Transfer(TRANSFER_EVENT, VTHO_ADDRESS.toUpperCase().replace("0X", "0x"))).toBe(
      true,
    );
  });
});

describe("decodeVip180Transfer", () => {
  it("decodes from, to and value from a real VTHO transfer log", () => {
    expect(decodeVip180Transfer(TRANSFER_EVENT)).toEqual({
      from: SENDER,
      to: RECIPIENT,
      value: AMOUNT,
    });
  });

  it("lowercases the checksummed addresses the SDK returns", () => {
    const { from, to } = decodeVip180Transfer(TRANSFER_EVENT);

    // Thor reports `origin`, `gasPayer` and VET transfer participants in lowercase, so a decoded
    // transfer must be lowercase too or it will not compare equal to them.
    expect(from).toBe(from.toLowerCase());
    expect(to).toBe(to.toLowerCase());
  });

  it("throws on a log that is not a Transfer — callers must narrow first", () => {
    const approval = {
      ...TRANSFER_EVENT,
      topics: [APPROVAL_TOPIC, ...TRANSFER_EVENT.topics.slice(1)],
    };

    // The point is that decoding an un-narrowed log fails loudly instead of returning a bogus
    // transfer — not which error surfaces. The SDK does not reject the Approval log itself; it
    // returns args without `from`/`to`, and reading them throws. That is an implementation detail
    // of the SDK, so only `Error` is pinned: a stricter matcher would break on an SDK upgrade.
    expect(() => decodeVip180Transfer(approval)).toThrow(Error);
  });
});
