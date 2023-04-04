import { formatCountdown } from "~/renderer/screens/exchange/Swap2/Form/Rates/utils/formatCountdown";
describe("formatCountdown", () => {
  it("formats countdown to timer", () => {
    expect(formatCountdown(1)).toBe("00:01");
    expect(formatCountdown(10)).toBe("00:10");
    expect(formatCountdown(60)).toBe("01:00");
    expect(formatCountdown(61)).toBe("01:01");
  });
});
