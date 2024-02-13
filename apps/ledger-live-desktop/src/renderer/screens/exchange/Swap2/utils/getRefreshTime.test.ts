import { describe, it, expect, jest } from "@jest/globals";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { getRefreshTime } from "~/renderer/screens/exchange/Swap2/utils/getRefreshTime";
const mockDate = new Date("2020-01-01");
jest.useFakeTimers().setSystemTime(mockDate);
describe("getRefreshTime", () => {
  it("returns default refresh time when no rates provided", () => {
    expect(getRefreshTime(undefined)).toEqual(20000);
  });

  it("returns the default refresh time when no rates have an expirationTime", () => {
    expect(
      getRefreshTime([
        {
          rateId: "1",
        } as ExchangeRate,
      ]),
    ).toEqual(20000);
  });

  it("returns the a refresh time that is the earliest expirationTime in the list of rates if it's under 60s", () => {
    const mockTimeSinceEpoch = mockDate.getTime();
    expect(
      getRefreshTime([
        {
          rateId: "1",
          expirationTime: mockTimeSinceEpoch + 19000,
        },
        {
          rateId: "2",
          expirationTime: mockTimeSinceEpoch + 18000,
        },
        {
          rateId: "3",
        },
      ] as ExchangeRate[]),
    ).toEqual(18000);
  });

  it("returns 60s when the earliest expirationTime in the list of rates is over 60s", () => {
    const mockTimeSinceEpoch = mockDate.getTime();
    expect(
      getRefreshTime([
        {
          rateId: "1",
          expirationTime: mockTimeSinceEpoch + 21000,
        },
        {
          rateId: "2",
          expirationTime: mockTimeSinceEpoch + 22000,
        },
        {
          rateId: "3",
        },
      ] as ExchangeRate[]),
    ).toEqual(20000);
  });
});
