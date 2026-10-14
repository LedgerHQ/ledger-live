import { SEND_FLOW_COMPLETION } from "../types";
import { reportSponsoredTransferOutcome } from "./transferOutcome";

const makeActions = () => ({
  onTransferSuccess: jest.fn(),
  onTransferError: jest.fn(),
});

describe("reportSponsoredTransferOutcome", () => {
  it("reports a broadcast transfer as a success", () => {
    const actions = makeActions();

    reportSponsoredTransferOutcome({
      actions,
      signedPaymentTxId: "txA",
      completion: SEND_FLOW_COMPLETION.SUCCESS,
    });

    expect(actions.onTransferSuccess).toHaveBeenCalledWith("txA");
    expect(actions.onTransferError).not.toHaveBeenCalled();
  });

  it("reports a failure as a transfer error, with its error", () => {
    const actions = makeActions();
    const refusal = new Error("refused");

    reportSponsoredTransferOutcome({
      actions,
      signedPaymentTxId: "txA",
      completion: SEND_FLOW_COMPLETION.FAILURE,
      error: refusal,
    });

    expect(actions.onTransferError).toHaveBeenCalledWith(refusal, "txA");
    expect(actions.onTransferSuccess).not.toHaveBeenCalled();
  });

  it("reports a failure without an error as a transfer error all the same", () => {
    const actions = makeActions();

    reportSponsoredTransferOutcome({
      actions,
      signedPaymentTxId: "txA",
      completion: SEND_FLOW_COMPLETION.FAILURE,
    });

    expect(actions.onTransferError).toHaveBeenCalledWith(expect.any(Error), "txA");
  });
});
