import { updateTransaction } from "./updateTransaction";

function makeBaseTx(extra: Record<string, unknown> = {}) {
  return {
    family: "bitcoin" as const,
    amount: 0,
    recipient: "",
    useAllAmount: false,
    feePerByte: null,
    networkInfo: null,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    rbf: false,
    ...extra,
  };
}

describe("updateTransaction", () => {
  it("lowercases bc1 segwit recipients", () => {
    const tx = makeBaseTx();
    const result = updateTransaction(tx as never, { recipient: "BC1QTEST" });
    expect(result.recipient).toBe("bc1qtest");
  });

  it("leaves non-segwit recipients untouched", () => {
    const tx = makeBaseTx();
    const result = updateTransaction(tx as never, {
      recipient: "1B1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
    });
    expect(result.recipient).toBe("1B1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8");
  });
});
