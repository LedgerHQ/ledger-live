import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { isCurrentMemberCredentials } from "./isCurrentMemberCredentials";

const RUN_CREDENTIALS: MemberCredentials = { pubkey: "run-pubkey", privatekey: "run-privatekey" };

function stateWith(memberCredentials: MemberCredentials | null) {
  return { trustchain: { trustchain: null, memberCredentials } };
}

describe("isCurrentMemberCredentials", () => {
  it("should be true when the store still holds the run's credentials", () => {
    expect(isCurrentMemberCredentials(stateWith({ ...RUN_CREDENTIALS }), RUN_CREDENTIALS)).toBe(
      true,
    );
  });

  it("should be false when a reset rotated the credentials", () => {
    const rotated = { pubkey: "rotated-pubkey", privatekey: "rotated-privatekey" };

    expect(isCurrentMemberCredentials(stateWith(rotated), RUN_CREDENTIALS)).toBe(false);
  });

  it("should be false when the store holds no credentials", () => {
    expect(isCurrentMemberCredentials(stateWith(null), RUN_CREDENTIALS)).toBe(false);
  });
});
