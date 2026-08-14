import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

jest.mock("@ledgerhq/coin-module-framework/currencies/index", () => ({
  formatCurrencyUnit: (_u: unknown, v: BigNumber) => v.toString(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/currencies", () => ({
  getCryptoCurrencyById: () => ({ units: [{ code: "ICP", magnitude: 8 }] }),
}));

const call = (transaction: Transaction) =>
  getDeviceTransactionConfig({
    account: {} as any,
    parentAccount: null,
    transaction,
    status: {} as any,
  });
const tx = (over: Partial<Transaction>): Transaction =>
  ({ amount: new BigNumber(1000), fees: new BigNumber(10000), ...over }) as Transaction;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const labels = (fields: any[]): Record<string, string> =>
  Object.fromEntries(fields.map(f => [f.label, f.value]));

describe("getDeviceTransactionConfig", () => {
  it("shows the payment fields for a transfer", async () => {
    const fields = labels(await call(tx({ type: "send", memo: "5" })));
    expect(fields["Transaction Type"]).toBe("Send ICP");
    expect(fields["Payment (ICP)"]).toBe("1000");
    expect(fields["Memo"]).toBe("5");
  });

  it("shows the neuron id (and no payment) for a governance op", async () => {
    const fields = labels(await call(tx({ type: "start_dissolving", neuronId: "7" })));
    expect(fields["Transaction Type"]).toBe("Start Dissolving");
    expect(fields["Neuron ID"]).toBe("7");
    expect(fields["Payment (ICP)"]).toBeUndefined();
  });

  it("surfaces each governance op's signed parameters", async () => {
    const split = labels(
      await call(tx({ type: "split_neuron", neuronId: "7", amount: new BigNumber(200_000_000) })),
    );
    expect(split["Split Amount (ICP)"]).toBe("200000000");

    const delay = labels(
      await call(tx({ type: "set_dissolve_delay", neuronId: "7", dissolveDelay: "63115200" })),
    );
    expect(delay["Dissolve Delay (s)"]).toBe("63115200");

    const hotkey = labels(
      await call(tx({ type: "add_hot_key", neuronId: "7", hotKeyToAdd: "2vxsx-fae" })),
    );
    expect(hotkey["Hot Key"]).toBe("2vxsx-fae");

    const follow = labels(
      await call(
        tx({ type: "follow", neuronId: "7", followTopic: "Governance", followeesIds: ["1", "2"] }),
      ),
    );
    expect(follow["Topic"]).toBe("Governance");
    expect(follow["Followees"]).toBe("1, 2");
  });
});
