import type { TFunction } from "i18next";
import { getEarnScreenOptions } from "../getEarnScreenOptions";

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getStakeLabelLocaleBased: () => "account.earn",
}));

const t = ((key: string) => key) as unknown as TFunction;
const CANVAS = "#000000";

describe("getEarnScreenOptions", () => {
  it.each(["deposit", "withdraw"])(
    "shows the locale stake header without canvas styling for the %s intent",
    intent => {
      const options = getEarnScreenOptions(intent, t, CANVAS);

      expect(options).toMatchObject({
        headerShown: true,
        closable: false,
        headerTitle: "account.earn",
      });
      // deposit / withdraw keep the default background (canvas styling is simulate-only).
      expect(options.headerStyle).toBeUndefined();
      expect(options.contentStyle).toBeUndefined();
    },
  );

  it("paints the simulator full-screen on the live-app canvas", () => {
    const options = getEarnScreenOptions("simulate", t, CANVAS);

    expect(options).toMatchObject({
      headerShown: true,
      closable: false,
      headerTitle: "earn.simulator.title",
      headerShadowVisible: false,
      headerStyle: { backgroundColor: CANVAS },
      contentStyle: { backgroundColor: CANVAS },
    });
  });

  it("hides the header for the dashboard (no intent)", () => {
    expect(getEarnScreenOptions(undefined, t, CANVAS)).toEqual({ headerShown: false });
  });

  it("hides the header for an unknown intent", () => {
    expect(getEarnScreenOptions("something-else", t, CANVAS)).toEqual({ headerShown: false });
  });
});
