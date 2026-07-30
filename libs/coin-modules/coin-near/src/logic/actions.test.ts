import { buildActions } from "./actions";

const AMOUNT = "1000000000000000000000000";

type FunctionCall = {
  methodName: string;
  deposit: { toString(): string };
  gas: { toString(): string };
  args: Uint8Array;
};

/** functionCall wraps the call in an enum; unwrap to the payload the test asserts on. */
const functionCallOf = (action: ReturnType<typeof buildActions>[number]) =>
  (action as unknown as { functionCall: FunctionCall }).functionCall;

const argsOf = (action: ReturnType<typeof buildActions>[number]) =>
  JSON.parse(Buffer.from(functionCallOf(action).args).toString());

describe("buildActions", () => {
  it("builds a transfer for the default mode", () => {
    const [action] = buildActions({ mode: "send", amount: AMOUNT });

    expect(
      (
        action as unknown as { transfer: { deposit: { toString(): string } } }
      ).transfer.deposit.toString(),
    ).toBe(AMOUNT);
  });

  it("stakes by attaching the amount as the deposit of deposit_and_stake", () => {
    const [action] = buildActions({ mode: "stake", amount: AMOUNT });

    expect(functionCallOf(action).methodName).toBe("deposit_and_stake");
    expect(functionCallOf(action).deposit.toString()).toBe(AMOUNT);
  });

  it("passes the amount as a call argument when unstaking a partial amount", () => {
    const [action] = buildActions({ mode: "unstake", amount: AMOUNT });

    expect(functionCallOf(action).methodName).toBe("unstake");
    expect(argsOf(action)).toEqual({ amount: AMOUNT });
    expect(functionCallOf(action).deposit.toString()).toBe("0");
  });

  it("calls unstake_all with no amount when unstaking everything", () => {
    const [action] = buildActions({ mode: "unstake", amount: AMOUNT, useAllAmount: true });

    expect(functionCallOf(action).methodName).toBe("unstake_all");
    expect(argsOf(action)).toEqual({});
  });

  it("passes the amount as a call argument when withdrawing a partial amount", () => {
    const [action] = buildActions({ mode: "withdraw", amount: AMOUNT });

    expect(functionCallOf(action).methodName).toBe("withdraw");
    expect(argsOf(action)).toEqual({ amount: AMOUNT });
  });

  it("calls withdraw_all with extra gas when withdrawing everything", () => {
    const [all] = buildActions({ mode: "withdraw", amount: AMOUNT, useAllAmount: true });
    const [partial] = buildActions({ mode: "withdraw", amount: AMOUNT });

    expect(functionCallOf(all).methodName).toBe("withdraw_all");
    expect(argsOf(all)).toEqual({});
    expect(Number(functionCallOf(all).gas)).toBeGreaterThan(Number(functionCallOf(partial).gas));
  });
});
