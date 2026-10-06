import { SEND_FLOW_COMPLETION } from "../types";
import { reportSponsoredTransferOutcome } from "./transferOutcome";

const makeActions = () => ({
  onTransferSuccess: jest.fn(),
  onTransferError: jest.fn(),
  setContractDataFailure: jest.fn(),
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

  it("routes a contract-data refusal to its recovery", () => {
    const actions = makeActions();
    const refusal = Object.assign(new Error("refused"), {
      name: "TransportStatusError",
      statusCode: 0x6a80,
    });

    reportSponsoredTransferOutcome({
      actions,
      signedPaymentTxId: "txA",
      completion: SEND_FLOW_COMPLETION.FAILURE,
      error: refusal,
    });

    expect(actions.setContractDataFailure).toHaveBeenCalledWith(refusal, "txA");
    expect(actions.onTransferError).not.toHaveBeenCalled();
  });

  it("reports any other failure as a transfer error, with an error even when none was given", () => {
    const actions = makeActions();

    reportSponsoredTransferOutcome({
      actions,
      signedPaymentTxId: "txA",
      completion: SEND_FLOW_COMPLETION.FAILURE,
    });

    expect(actions.onTransferError).toHaveBeenCalledWith(expect.any(Error), "txA");
    expect(actions.setContractDataFailure).not.toHaveBeenCalled();
  });
});
