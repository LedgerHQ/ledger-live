// @flow
import { getRefreshTime } from "~/renderer/screens/exchange/Swap2/utils/getRefreshTime";

const mockDate = new Date("2020-01-01");
jest.useFakeTimers().setSystemTime(mockDate);

describe("getRefreshTime", () => {
  it("returns default refresh time when no rates provided", () => {
    expect(getRefreshTime(undefined)).toEqual(60000);
  });

  it("returns the default refresh time when no rates have an expirationTime", () => {
    expect(getRefreshTime([{ rateId: "1" }])).toEqual(60000);
  });

  it("returns the a refresh time that is the earliest expirationTime in the list of rates", () => {
    const mockTimeSinceEpoch = mockDate.getTime();

    expect(
      getRefreshTime([
        { rateId: "1", expirationTime: mockTimeSinceEpoch + 1000 },
        { rateId: "2", expirationTime: mockTimeSinceEpoch + 2000 },
        { rateId: "3" },
      ]),
    ).toEqual(1000);
  });
});
