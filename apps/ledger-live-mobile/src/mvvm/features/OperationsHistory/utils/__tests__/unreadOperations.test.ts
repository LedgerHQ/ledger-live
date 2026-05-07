import type { Features } from "@ledgerhq/types-live";
import {
  parseLastSeenMs,
  isOperationUnread,
  getAddressPoisoningFamiliesForFilter,
} from "../unreadOperations";

describe("parseLastSeenMs", () => {
  it("returns null for null or empty string", () => {
    expect(parseLastSeenMs(null)).toBeNull();
    expect(parseLastSeenMs("")).toBeNull();
  });

  it("returns ms timestamp for valid ISO string", () => {
    expect(parseLastSeenMs("2024-06-01T12:00:00.000Z")).toBe(
      new Date("2024-06-01T12:00:00.000Z").getTime(),
    );
  });
});

describe("isOperationUnread", () => {
  const t = new Date("2024-12-01T00:00:00.000Z").getTime();

  it("returns false when lastSeenTs is null", () => {
    expect(isOperationUnread(new Date(), null)).toBe(false);
  });

  it("returns false when operation date equals lastSeenTs", () => {
    expect(isOperationUnread(new Date(t), t)).toBe(false);
  });

  it("returns false when operation date is before lastSeenTs", () => {
    expect(isOperationUnread(new Date(t - 1), t)).toBe(false);
  });

  it("returns true when operation date is after lastSeenTs", () => {
    expect(isOperationUnread(new Date(t + 1), t)).toBe(true);
  });
});

describe("getAddressPoisoningFamiliesForFilter", () => {
  it("returns null when shouldFilter is false", () => {
    expect(getAddressPoisoningFamiliesForFilter(false, undefined)).toBeNull();
  });

  it("returns env-based families when shouldFilter is true and feature is off or missing", () => {
    const fromEnv = getAddressPoisoningFamiliesForFilter(true, undefined);
    expect(fromEnv).not.toBeNull();
    expect(fromEnv!.every(f => f.length > 0)).toBe(true);

    const whenDisabled = getAddressPoisoningFamiliesForFilter(true, {
      enabled: false,
      params: { families: ["ignored"] },
    } satisfies Features["addressPoisoningOperationsFilter"]);
    expect(whenDisabled).toEqual(fromEnv);
  });

  it("returns feature params families when feature is enabled", () => {
    expect(
      getAddressPoisoningFamiliesForFilter(true, {
        enabled: true,
        params: { families: ["solana", "xrp"] },
      } satisfies Features["addressPoisoningOperationsFilter"]),
    ).toEqual(["solana", "xrp"]);
  });
});
