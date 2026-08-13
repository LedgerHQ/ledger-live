import { toSegmentTrackEvent } from "./segmentEvent";
import { ErrorCategory, TransactionFlow, TransactionStage, type LogEvent } from "./logEvent";

const common = {
  appVersion: "t",
  flow: TransactionFlow.Send,
  currencyId: "cardano",
  family: "cardano",
  currencyTicker: "ADA",
  isTestnet: false,
  isSendMax: false,
  earnTransactionType: "delegate" as const,
  rawTransactionType: "delegate",
  validators: ["pool123"],
};

// A message with a distinctive marker, so the leak assertion below can't pass or fail
// by colliding with a legitimate value like `user_device_refused`.
const refused = Object.assign(new Error("declined for 0xSENSITIVE_ADDR"), {
  name: "UserRefusedOnDevice",
});

describe("toSegmentTrackEvent", () => {
  // `flow` is what dashboards slice on, and it is deliberately Ledger Wallet's word, not
  // the Earn live-app's. Pinned separately so a change has to be intentional.
  it.each([TransactionFlow.Send, TransactionFlow.Dapp, TransactionFlow.Swap])(
    "always reports flow=stake, whatever the route (%s)",
    flow => {
      const result = toSegmentTrackEvent({
        status: "success",
        stage: TransactionStage.Broadcast,
        ...common,
        flow,
      } as LogEvent);

      expect(result!.properties).toMatchObject({ flow: "stake", tx_pathway: flow });
    },
  );

  it("maps a broadcast success to earn_transaction_completed", () => {
    const result = toSegmentTrackEvent({
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
    } as LogEvent);

    expect(result!.event).toBe("earn_transaction_completed");
    expect(result!.properties).toMatchObject({
      // Ledger Wallet's staking vocabulary, not the Earn live-app's "earn".
      flow: "stake",
      stage: "broadcast",
      status: "success",
      transaction_type: "delegate",
      raw_transaction_type: "delegate",
      input_currency: "ada",
      network: "cardano",
      validators: ["pool123"],
    });
    expect(result!.properties).not.toHaveProperty("txPayload");
    expect(result!.properties).not.toHaveProperty("error");
  });

  it("maps a failure to earn_transaction_failed with the classified reason", () => {
    const result = toSegmentTrackEvent({
      status: "failure",
      stage: TransactionStage.Sign,
      error: refused,
      errorCategory: ErrorCategory.UserDeviceRefused,
      ...common,
    } as LogEvent);

    expect(result!.event).toBe("earn_transaction_failed");
    expect(result!.properties).toMatchObject({
      stage: "sign",
      status: "failed",
      error_category: ErrorCategory.UserDeviceRefused,
      error_reason: "UserRefusedOnDevice",
    });
    // Raw error objects and messages must never reach analytics.
    expect(result!.properties).not.toHaveProperty("error");
    expect(JSON.stringify(result!.properties)).not.toContain("0xSENSITIVE_ADDR");
  });

  it("reports a token's own ticker as input_currency, with the network alongside", () => {
    const result = toSegmentTrackEvent({
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
      currencyId: "ethereum",
      family: "evm",
      currencyTicker: "ETH",
      tokenTicker: "USDC",
      tokenId: "ethereum/erc20/usdc",
      earnTransactionType: "deposit",
    } as LogEvent);

    expect(result!.properties).toMatchObject({
      input_currency: "usdc",
      network: "ethereum",
    });
  });

  it("exposes the manifest id as provider", () => {
    const result = toSegmentTrackEvent({
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
      manifestId: "kiln",
    } as LogEvent);

    expect(result!.properties.provider).toBe("kiln");
  });

  describe("does not emit", () => {
    it("for a non-staking transaction (plain send / swap)", () => {
      const result = toSegmentTrackEvent({
        status: "success",
        stage: TransactionStage.Broadcast,
        ...common,
        earnTransactionType: undefined,
        rawTransactionType: "send",
      } as unknown as LogEvent);
      expect(result).toBeNull();
    });

    it("for the Earn live-app, which emits earn_transaction_* itself", () => {
      const result = toSegmentTrackEvent({
        status: "success",
        stage: TransactionStage.Broadcast,
        ...common,
        manifestId: "earn",
      } as LogEvent);
      expect(result).toBeNull();
    });

    it("for the funnel-top started signal, which this schema has no name for", () => {
      const result = toSegmentTrackEvent({
        status: "started",
        stage: TransactionStage.Sign,
        ...common,
      } as unknown as LogEvent);
      expect(result).toBeNull();
    });
  });
});
