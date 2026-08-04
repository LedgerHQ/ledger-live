import { BigNumber } from "bignumber.js";
import { updateTransaction } from "./updateTransaction";
import type { Transaction } from "../types/bridge";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const U_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

const transaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "zcash",
    transferType: "transparent",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...overrides,
  }) as Transaction;

describe("updateTransaction", () => {
  // Both halves of the (sender, recipient) pair feed the derivation, so a patch
  // to either has to re-derive the flow -- see logic/address.ts.
  it.each([
    ["a transparent recipient", { recipient: T_ADDRESS }, "transparent", "public"],
    ["a unified recipient", { recipient: U_ADDRESS }, "transparent-to-shielded", "private"],
    [
      "a shielded sender paying a transparent recipient",
      { sender: "private", recipient: T_ADDRESS },
      "shielded-to-transparent",
      "public",
    ],
    [
      "a shielded sender paying a unified recipient",
      { sender: "private", recipient: U_ADDRESS },
      "shielded",
      "private",
    ],
    ["a shielded sender with no recipient yet", { sender: "private" }, "shielded", undefined],
  ] as [string, Partial<Transaction>, Transaction["transferType"], string | undefined][])(
    "derives the flow of %s",
    (_label, patch, transferType, recipientType) => {
      const updated = updateTransaction(transaction(), patch);

      expect(updated.transferType).toBe(transferType);
      expect(updated.recipientType).toBe(recipientType);
    },
  );

  it("forgets the recipient class when the recipient is cleared", () => {
    const shielding = updateTransaction(transaction(), { recipient: U_ADDRESS });

    const cleared = updateTransaction(shielding, { recipient: "" });

    expect(cleared).not.toHaveProperty("recipientType");
    expect(cleared.transferType).toBe("transparent");
  });

  // Neither an unparseable address nor a Sapling one classifies: the flow stays
  // transparent, and getTransactionStatus is what refuses the send.
  it.each(["not-an-address", "zs1nonsense"])("classifies nothing from %s", recipient => {
    const updated = updateTransaction(transaction(), { recipient });

    expect(updated).not.toHaveProperty("recipientType");
    expect(updated.transferType).toBe("transparent");
  });

  // The send modal toggles the sender, so the flow has to fall back as well as
  // it rises.
  it("re-derives the flow when the sender goes back to transparent", () => {
    const shielded = updateTransaction(transaction(), {
      sender: "private",
      recipient: U_ADDRESS,
    });

    expect(updateTransaction(shielded, { sender: "public" })).toMatchObject({
      transferType: "transparent-to-shielded",
      recipientType: "private",
    });
  });

  it("keeps the rest of the patch", () => {
    const updated = updateTransaction(transaction(), {
      recipient: U_ADDRESS,
      amount: new BigNumber(42),
      useAllAmount: true,
    });

    expect(updated).toMatchObject({ amount: new BigNumber(42), useAllAmount: true });
  });
});
