import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";
import { FLOW_STATUS } from "../../../wizard/types";
import type { SendFlowOperationResult } from "../../types";
import { getConfirmationStatus } from "../getConfirmationStatus";

const bitcoin = getCryptoCurrencyById("bitcoin");
const operation = { id: "op-1" } as Operation;

const result = (overrides: Partial<SendFlowOperationResult> = {}): SendFlowOperationResult => ({
  optimisticOperation: null,
  transactionError: null,
  signed: false,
  ...overrides,
});

describe("getConfirmationStatus", () => {
  it("returns SUCCESS when signed with an optimistic operation", () => {
    expect(
      getConfirmationStatus(result({ signed: true, optimisticOperation: operation }), bitcoin),
    ).toBe(FLOW_STATUS.SUCCESS);
  });

  it("returns ERROR when signed but broadcast failed (no optimistic operation)", () => {
    expect(
      getConfirmationStatus(
        result({ signed: true, transactionError: new Error("broadcast failed") }),
        bitcoin,
      ),
    ).toBe(FLOW_STATUS.ERROR);
  });

  it("returns IDLE when the user refused the transaction on device", () => {
    const error = new Error("refused");
    error.name = sendFeatures.getUserRefusedTransactionErrorName(bitcoin);
    expect(getConfirmationStatus(result({ transactionError: error }), bitcoin)).toBe(
      FLOW_STATUS.IDLE,
    );
  });

  it("returns ERROR for a non-refusal signing error", () => {
    const error = new Error("device unplugged");
    error.name = "DisconnectedDevice";
    expect(getConfirmationStatus(result({ transactionError: error }), bitcoin)).toBe(
      FLOW_STATUS.ERROR,
    );
  });

  it("returns ERROR for an unrefused error when currency is null", () => {
    const error = new Error("refused");
    error.name = sendFeatures.getUserRefusedTransactionErrorName(bitcoin);
    expect(getConfirmationStatus(result({ transactionError: error }), null)).toBe(
      FLOW_STATUS.ERROR,
    );
  });

  it("returns IDLE when there is no result yet", () => {
    expect(getConfirmationStatus(result(), bitcoin)).toBe(FLOW_STATUS.IDLE);
  });
});
