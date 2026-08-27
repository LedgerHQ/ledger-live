import { log } from "@ledgerhq/logs";
import { applyValidatorApy } from "./staking";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const logMock = log as unknown as jest.Mock;

const plan = (suiAddress: string) => ({
  suiAddress,
  exchangeRatesId: "0xrates",
  currentRate: { sui_amount: "200", pool_token_amount: "100" },
  pastEpoch: 100,
});

beforeEach(() => logMock.mockClear());

describe("applyValidatorApy degraded telemetry", () => {
  // Pins the exact keys: `sui-graphql:` is what this event ships under today, so a rename would
  // break anything alerting on it.
  it.each([
    ["graphql", "sui-graphql:rate-fetch-degraded"],
    ["grpc", "sui-grpc:rate-fetch-degraded"],
  ] as const)("keys the %s degradation as %s", (transport, key) => {
    const apy = applyValidatorApy([plan("0xa")], [null], 130, 0, transport);

    expect(apy.has("0xa")).toBe(false);
    expect(logMock).toHaveBeenCalledWith(
      "warn",
      key,
      expect.objectContaining({ source: "validator-apy", missing: 1, total: 1 }),
    );
  });

  it("reports a failed chunk even when no rate is missing", () => {
    applyValidatorApy(
      [plan("0xa")],
      [{ sui_amount: "100", pool_token_amount: "100" }],
      130,
      2,
      "grpc",
    );

    expect(logMock).toHaveBeenCalledWith(
      "warn",
      "sui-grpc:rate-fetch-degraded",
      expect.objectContaining({ missing: 0, chunksFailed: 2 }),
    );
  });

  it("stays silent when every rate resolves", () => {
    applyValidatorApy(
      [plan("0xa")],
      [{ sui_amount: "100", pool_token_amount: "100" }],
      130,
      0,
      "grpc",
    );

    expect(logMock).not.toHaveBeenCalled();
  });
});
