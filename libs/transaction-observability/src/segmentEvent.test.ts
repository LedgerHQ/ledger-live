import { toSegmentTrackEvent } from "./segmentEvent";
import { ErrorCategory, TransactionFlow, TransactionStage, type LogEvent } from "./logEvent";

const common = {
  appVersion: "t",
  flow: TransactionFlow.Send,
  currencyId: "cardano",
  family: "cardano",
  isTestnet: false,
  isSendMax: false,
  productFlow: "stake" as const,
  transactionType: "delegate",
  validators: ["pool123"],
};

describe("toSegmentTrackEvent", () => {
  it("maps a broadcast success to a distinct event with product props (no signature)", () => {
    const result = toSegmentTrackEvent({
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
    } as LogEvent);
    expect(result).not.toBeNull();
    expect(result!.event).toBe("Transaction Broadcast Success");
    expect(result!.properties).toMatchObject({
      productFlow: "stake",
      currencyId: "cardano",
      validators: ["pool123"],
      stage: "broadcast",
    });
    expect(result!.properties).not.toHaveProperty("txPayload");
    expect(result!.properties).not.toHaveProperty("error");
  });

  it("maps a sign failure to errorCategory + errorName (no raw error object)", () => {
    const result = toSegmentTrackEvent({
      status: "failure",
      stage: TransactionStage.Sign,
      error: Object.assign(new Error("refused"), { name: "UserRefusedOnDevice" }),
      errorCategory: ErrorCategory.UserDeviceRefused,
      ...common,
    } as LogEvent);
    expect(result!.event).toBe("Transaction Sign Failed");
    expect(result!.properties).toMatchObject({
      errorCategory: ErrorCategory.UserDeviceRefused,
      errorName: "UserRefusedOnDevice",
      productFlow: "stake",
    });
    expect(result!.properties).not.toHaveProperty("error");
  });

  it("maps a sign started event", () => {
    const result = toSegmentTrackEvent({
      status: "started",
      stage: TransactionStage.Sign,
      ...common,
    } as LogEvent);
    expect(result!.event).toBe("Transaction Sign Started");
  });

  it("returns null for unmapped combinations", () => {
    const result = toSegmentTrackEvent({
      status: "started",
      stage: TransactionStage.Broadcast,
      ...common,
    } as unknown as LogEvent);
    expect(result).toBeNull();
  });
});
