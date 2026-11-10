import type { Portfolio } from "@domain/api-account-portfolio";
import {
  BTC,
  DOT,
  ETH,
  TRX,
  evm,
  serverAccountId,
  serviceAccount,
  synced,
} from "./fakeService.mock";
import { readinessOf } from "./readiness";

describe("readinessOf", () => {
  it.each<[string, Portfolio, object]>([
    ["synchronized", synced([ETH]), { state: "ready", serverAccountId: serverAccountId(ETH) }],
    [
      "not created yet",
      synced([]),
      { state: "pending", detail: "Service account not created yet" },
    ],
    [
      "uninitialized",
      synced([], { accounts: [serviceAccount(ETH, "uninitialized")] }),
      { state: "pending", detail: "Service account uninitialized" },
    ],
    [
      "failed to register",
      synced([], { accounts: [serviceAccount(ETH, "registration_failure")] }),
      { state: "failed", detail: "Service account registration_failure" },
    ],
    [
      "on a network the fan-out does not track",
      synced([], { accounts: [serviceAccount(evm(1, "bsc"))] }),
      { state: "failed", detail: "The fan-out tracks no ethereum account" },
    ],
  ])("reads an account %s", (_, portfolio, readiness) => {
    expect(readinessOf(ETH, portfolio)).toEqual(readiness);
  });

  it("fails an account the service does not serve", () => {
    expect(readinessOf(DOT, synced([]))).toEqual({
      state: "failed",
      detail: "Not an account the Portfolio service serves",
    });
  });

  it.each([
    ["Bitcoin", BTC],
    ["Tron", TRX],
  ])("finds a %s account under its own service id", (_, descriptor) => {
    expect(readinessOf(descriptor, synced([descriptor]))).toEqual({
      state: "ready",
      serverAccountId: serverAccountId(descriptor),
    });
    expect(readinessOf(descriptor, synced([]))).toEqual({
      state: "pending",
      detail: "Service account not created yet",
    });
  });
});
