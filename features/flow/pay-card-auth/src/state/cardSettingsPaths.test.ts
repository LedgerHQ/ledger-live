import { buildAccessBaanxPath } from "./cardSettingsPaths";

describe("buildAccessBaanxPath", () => {
  it("addresses the Baanx root with no app id", () => {
    expect(buildAccessBaanxPath()).toBe("/");
  });

  it("names the US app when the holder belongs to it", () => {
    expect(buildAccessBaanxPath("LEDGERUS")).toBe("/?app_id=LEDGERUS");
  });

  it.each([
    ["null", null],
    ["an empty value", ""],
  ])("names no app when the US app id is %s", (_case, usAppId) => {
    expect(buildAccessBaanxPath(usAppId)).toBe("/");
  });
});
