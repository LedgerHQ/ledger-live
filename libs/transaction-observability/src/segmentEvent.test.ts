import { toSegmentTrackEvent } from "./segmentEvent";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";
import { ErrorCategory } from "./errorCategory";

const common = {
  appVersion: "t",
  pathway: TransactionPathway.Send,
  currencyId: "cardano",
  family: "cardano",
  currencyTicker: "ADA",
  isTestnet: false,
  isSendMax: false,
  dataSource: TransactionDataSource.Sign,
  earnTransactionType: "delegate" as const,
  rawTransactionType: "delegate",
  validators: ["pool123"],
};

// A distinctive marker, so the leak assertion below cannot pass or fail by colliding with a
// legitimate value like `user_device_refused`.
const refused = Object.assign(new Error("declined for 0xSENSITIVE_ADDR"), {
  name: "UserRefusedOnDevice",
});

describe("toSegmentTrackEvent", () => {
  // The analytics `flow` is the product funnel and is always "stake" — Ledger Wallet's word,
  // not the Earn live-app's. The route travels separately as `tx_pathway`. Pinned so a change
  // has to be intentional.
  it.each([TransactionPathway.Send, TransactionPathway.Dapp, TransactionPathway.Swap])(
    "always reports flow=stake, whatever the route (%s)",
    pathway => {
      const result = toSegmentTrackEvent({
        status: "success",
        stage: TransactionStage.Broadcast,
        ...common,
        pathway,
      } as LogEvent);

      expect(result!.properties).toMatchObject({ flow: "stake", tx_pathway: pathway });
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
      flow: "stake",
      stage: "broadcast",
      status: "success",
      transaction_type: "delegate",
      raw_transaction_type: "delegate",
      input_currency: "ada",
      network: "cardano",
      validators: ["pool123"],
      tx_data_source: "sign",
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
    } as LogEvent);

    expect(result!.properties).toMatchObject({ input_currency: "usdc", network: "ethereum" });
  });

  it("reports the broadcast fallback as tx_data_source=broadcast", () => {
    const result = toSegmentTrackEvent({
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
      dataSource: TransactionDataSource.Broadcast,
      rawTransactionType: "DELEGATE",
    } as LogEvent);

    expect(result!.properties).toMatchObject({
      tx_data_source: "broadcast",
      raw_transaction_type: "DELEGATE",
      transaction_type: "delegate",
    });
  });

  it("exposes the manifest id as manifest_id", () => {
    const result = toSegmentTrackEvent({
      status: "success",
      stage: TransactionStage.Broadcast,
      ...common,
      manifestId: "kiln",
    } as LogEvent);

    expect(result!.properties.manifest_id).toBe("kiln");
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

    it.each(["earn", "earn-stg", "earn-prd-eks"])(
      "for the %s live-app, which emits earn_transaction_* itself",
      manifestId => {
        const result = toSegmentTrackEvent({
          status: "success",
          stage: TransactionStage.Broadcast,
          ...common,
          manifestId,
        } as LogEvent);
        expect(result).toBeNull();
      },
    );
  });
});
