// Mock the address classifier so tests are isolated from F4Jumble.
// Keep this before the module-under-test import so the mock is applied
// deterministically regardless of the Jest/TS transform.
jest.mock("./chain-adapters/zcash/address", () => ({
  classifyZcashRecipient: jest.fn(),
  deriveZcashTransferType: jest.requireActual("./chain-adapters/zcash/address")
    .deriveZcashTransferType,
}));

import * as addressModule from "./chain-adapters/zcash/address";
import { updateTransaction } from "./updateTransaction";

const mockClassify = jest.mocked(addressModule.classifyZcashRecipient);

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateTransaction — Zcash shielded context", () => {
  it("sets recipientType=private and transferType=transparent-to-shielded for public sender + Orchard UA", () => {
    mockClassify.mockReturnValue({ recipientType: "private" });

    const tx = makeBaseTx({ transferType: "transparent", sender: "public" });
    const result = updateTransaction(tx as never, {
      recipient: "u1orchardaddress",
    }) as unknown as typeof tx & { recipientType: string; transferType: string };

    expect(result.recipientType).toBe("private");
    expect(result.transferType).toBe("transparent-to-shielded");
    expect(mockClassify).toHaveBeenCalledWith("u1orchardaddress");
  });

  it("sets recipientType=public and transferType=shielded-to-transparent for private sender + t1 address", () => {
    mockClassify.mockReturnValue({ recipientType: "public" });

    const tx = makeBaseTx({ transferType: "shielded", sender: "private" });
    const result = updateTransaction(tx as never, {
      recipient: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
    }) as unknown as typeof tx & { recipientType: string; transferType: string };

    expect(result.recipientType).toBe("public");
    expect(result.transferType).toBe("shielded-to-transparent");
  });

  it("clears recipientType and sets transferType=transparent when recipient is invalid/Sapling", () => {
    mockClassify.mockReturnValue({ error: "sapling-unsupported" });

    const tx = makeBaseTx({
      transferType: "transparent",
      sender: "public",
      recipientType: "public",
    });
    const result = updateTransaction(tx as never, {
      recipient: "zs1saplingaddress",
    }) as unknown as typeof tx & { recipientType: unknown; transferType: string };

    // recipientType cleared because classify returned an error
    expect(result.recipientType).toBeUndefined();
    // public sender + undefined recipientType = transparent
    expect(result.transferType).toBe("transparent");
  });

  it("clears recipientType when recipient is empty", () => {
    const tx = makeBaseTx({
      transferType: "transparent-to-shielded",
      sender: "public",
      recipientType: "private",
    });
    const result = updateTransaction(tx as never, {
      recipient: "",
    }) as unknown as typeof tx & { recipientType: unknown; transferType: string };

    expect(result.recipientType).toBeUndefined();
    // public sender + undefined = transparent
    expect(result.transferType).toBe("transparent");
    // classify should not be called when recipient is empty
    expect(mockClassify).not.toHaveBeenCalled();
  });
});

describe("updateTransaction — non-Zcash / flag-off passthrough", () => {
  it("does not set recipientType on a non-Zcash tx (no sender field)", () => {
    const tx = makeBaseTx({ transferType: "transparent" });
    const result = updateTransaction(tx as never, {
      recipient: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
    }) as unknown as typeof tx & { recipientType?: unknown };

    expect(result.recipientType).toBeUndefined();
    expect(mockClassify).not.toHaveBeenCalled();
  });

  it("lowercases bc1 segwit recipients unchanged by shielded logic", () => {
    const tx = makeBaseTx();
    const result = updateTransaction(tx as never, { recipient: "BC1QTEST" });
    expect(result.recipient).toBe("bc1qtest");
    expect(mockClassify).not.toHaveBeenCalled();
  });
});
