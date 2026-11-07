import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockSendRequest } from "@domain/entity-account-transaction/schema.mock";
import { lastValueFrom, toArray } from "rxjs";
import { mockDescriptors } from "./generate";
import { mockSender } from "./mockSender";
import { mockSource } from "./mockSource";

const device = { dmk: undefined, sessionId: "", compatDeviceId: "" } as never;

async function fundedTarget() {
  for (const descriptor of mockDescriptors("ethereum", 20, [])) {
    const target = { accountUUID: computeAccountUUID(descriptor), descriptor };
    const balances = (await mockSource.read?.balance?.(target, undefined)) ?? [];
    const native = balances.find(row => row.assetId === "ethereum");
    if (native && BigInt(native.spendableBalance) > 10n ** 16n) return { target, native };
  }
  throw new Error("no funded mock account");
}

describe("mockSender", () => {
  it("prepares a send within the balance, with the network's fixed fee", async () => {
    const { target } = await fundedTarget();
    const prepared = await mockSender.prepare(target, mockSendRequest({ amount: "1000" }));
    expect(prepared).toEqual(
      expect.objectContaining({
        amount: "1000",
        fees: "100000000000000",
        totalSpent: "100000000001000",
        feeAssetId: "ethereum",
        errors: [],
      }),
    );
  });

  it("sends everything spendable, fees deducted, and refuses more", async () => {
    const { target, native } = await fundedTarget();
    const all = await mockSender.prepare(target, mockSendRequest({ useAllAmount: true }));
    expect(all.totalSpent).toBe(native.spendableBalance);
    const tooMuch = await mockSender.prepare(
      target,
      mockSendRequest({ amount: native.spendableBalance }),
    );
    expect(tooMuch.errors).toEqual([expect.objectContaining({ name: "NotEnoughBalance" })]);
  });

  it("signs after an approval pause, then broadcasts a pending operation from the account", async () => {
    jest.useFakeTimers();
    try {
      const { target } = await fundedTarget();
      const prepared = await mockSender.prepare(target, mockSendRequest());
      const events = lastValueFrom(mockSender.sign(target, prepared, device).pipe(toArray()));
      jest.advanceTimersByTime(600);
      const [requested, granted, signed] = await events;
      expect([requested.type, granted.type, signed.type]).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
      if (signed.type !== "signed") throw new Error("not signed");
      const broadcasted = await mockSender.broadcast(target, prepared, signed.signed);
      expect(broadcasted.operations).toEqual([
        expect.objectContaining({
          hash: broadcasted.hash,
          type: "OUT",
          blockHeight: null,
          value: "1000",
          recipients: [prepared.request.recipient],
        }),
      ]);
    } finally {
      jest.useRealTimers();
    }
  });
});
