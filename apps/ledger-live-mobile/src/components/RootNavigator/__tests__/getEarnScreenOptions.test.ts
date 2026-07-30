import type { TFunction } from "i18next";
import { getEarnScreenOptions } from "../getEarnScreenOptions";

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getStakeLabelLocaleBased: () => "account.earn",
}));

const t = ((key: string) => key) as unknown as TFunction;
const CANVAS = "#000000";

describe("getEarnScreenOptions", () => {
  it.each(["deposit", "withdraw"])(
    "shows the locale stake header without canvas styling for the %s intent when swapToEarn is off",
    intent => {
      const options = getEarnScreenOptions(intent, t, CANVAS, false);

      expect(options).toMatchObject({
        headerShown: true,
        closable: false,
        headerTitle: "account.earn",
      });
      expect(options.headerStyle).toBeUndefined();
      expect(options.contentStyle).toBeUndefined();
    },
  );

  it("paints the deposit intent header and content on the live-app canvas when swapToEarn is on", () => {
    const options = getEarnScreenOptions("deposit", t, CANVAS, true);

    expect(options).toMatchObject({
      headerShown: true,
      closable: false,
      headerTitle: "account.earn",
      headerShadowVisible: false,
      headerStyle: { backgroundColor: CANVAS },
      contentStyle: { backgroundColor: CANVAS },
    });
  });

  it("keeps withdraw without canvas styling when swapToEarn is on", () => {
    const options = getEarnScreenOptions("withdraw", t, CANVAS, true);

    expect(options).toMatchObject({
      headerShown: true,
      closable: false,
      headerTitle: "account.earn",
    });
    expect(options.headerStyle).toBeUndefined();
    expect(options.contentStyle).toBeUndefined();
  });

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
