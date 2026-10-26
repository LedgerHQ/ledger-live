import { toDatadogBroadcastLog } from "./datadogEvent";
import {
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "./logEvent";
import { ErrorCategory } from "./errorCategory";

// A plain send: no staking action derived, which the Segment mapping would drop.
const common = {
  appVersion: "t",
  pathway: TransactionPathway.WalletApiSignAndBroadcast,
  manifestId: "some-live-app",
  source: { type: "live-app", name: "some-live-app" } as const,
  currencyId: "ethereum",
  family: "evm",
  tokenId: "ethereum/erc20/usd__coin",
  currencyTicker: "ETH",
  isTestnet: false,
  isSendMax: true,
  dataSource: TransactionDataSource.Broadcast,
  validators: ["0xVALIDATOR"],
};

describe("toDatadogBroadcastLog", () => {
  it("ignores sign-stage events", () => {
    expect(
      toDatadogBroadcastLog({ status: "intent", stage: TransactionStage.Sign, ...common }),
    ).toBeNull();
    expect(
      toDatadogBroadcastLog({
        status: "failure",
        stage: TransactionStage.Sign,
        error: new Error("refused"),
        errorCategory: ErrorCategory.UserDeviceRefused,
        ...common,
      }),
    ).toBeNull();
  });

  it("keeps a broadcast success with no staking action, with the allow-listed attributes", () => {
    expect(
      toDatadogBroadcastLog({ status: "success", stage: TransactionStage.Broadcast, ...common }),
    ).toEqual({
      message: "tx_broadcast",
      status: "success",
      attributes: {
        family: "evm",
        currency_id: "ethereum",
        token_id: "ethereum/erc20/usd__coin",
        pathway: TransactionPathway.WalletApiSignAndBroadcast,
        source_type: "live-app",
        manifest_id: "some-live-app",
        is_testnet: false,
        is_send_max: true,
        app_version: "t",
      },
    });
  });

  it("reports a broadcast failure with its sanitized message, never the signed payload", () => {
    // The node controls the message, and it can quote the transaction.
    const rawTx = "0x02f8b1" + "ab".repeat(120);
    const error = Object.assign(new Error(`rejected ${rawTx}: nonce too low`), {
      name: "NonceTooLow",
    });
    const event: LogEvent = {
      status: "failure",
      stage: TransactionStage.Broadcast,
      error,
      errorCategory: ErrorCategory.Blockchain,
      txPayload: { signature: "0xSIGNED_TX", rawData: { secret: "0xRAW" } },
      ...common,
    };

    const log = toDatadogBroadcastLog(event);

    expect(log).toMatchObject({
      message: "tx_broadcast",
      status: "failure",
      attributes: {
        error_name: "NonceTooLow",
        error_message: "rejected [id]: nonce too low",
        error_category: ErrorCategory.Blockchain,
        family: "evm",
      },
    });
    // The whole log, not only `attributes`: it is everything a host can send.
    const serialized = JSON.stringify(log);
    expect(serialized).not.toContain(rawTx);
    expect(serialized).not.toContain("0xSIGNED_TX");
    expect(serialized).not.toContain("0xRAW");
    expect(serialized).not.toContain("0xVALIDATOR");
    expect(Object.keys(log ?? {})).toEqual(["message", "status", "attributes"]);
  });

  // Named and numeric accounts, which no length-based redaction would catch.
  it.each([
    ["Near: no access key found for alice.near", "alice.near"],
    ["hedera: evm address is missing for 0.0.1234", "0.0.1234"],
  ])("never sends the account a broadcast error names: %s", (message, account) => {
    const log = toDatadogBroadcastLog({
      status: "failure",
      stage: TransactionStage.Broadcast,
      error: new Error(message),
      errorCategory: ErrorCategory.Unknown,
      ...common,
    });

    expect(log?.attributes.error_message).toContain("[id]");
    expect(JSON.stringify(log)).not.toContain(account);
  });
});
