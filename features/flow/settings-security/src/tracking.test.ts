import { getSecurityStateEvents } from "./tracking";

describe("getSecurityStateEvents", () => {
  it("names the password and MEV protection states on desktop", () => {
    expect(getSecurityStateEvents({ passwordSet: true, mevProtection: false }, "desktop")).toEqual([
      { id: "appLock", event: "PasswordEnabled" },
      { id: "mevProtection", event: "mev_disactivated" },
    ]);
    expect(getSecurityStateEvents({ passwordSet: false, mevProtection: true }, "desktop")).toEqual([
      { id: "appLock", event: "PasswordDisabled" },
      { id: "mevProtection", event: "mev_activated" },
    ]);
  });

  it("only names the MEV protection state on mobile, which never sent the password events", () => {
    expect(getSecurityStateEvents({ passwordSet: true, mevProtection: true }, "mobile")).toEqual([
      { id: "mevProtection", event: "mev_activated" },
    ]);
  });
});
