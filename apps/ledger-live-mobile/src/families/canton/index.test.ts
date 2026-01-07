import * as CantonOnboard from "./Onboard/Onboard";
import * as CantonFamily from "./index";

describe("Canton Family", () => {
  it("should export CantonOnboard module", () => {
    expect(CantonFamily.CantonOnboard).toBeDefined();
    expect(CantonFamily.CantonOnboard).toBe(CantonOnboard);
  });

  it("should have the expected exports", () => {
    expect(CantonFamily.CantonOnboard.component).toBeDefined();
    expect(CantonFamily.CantonOnboard.options).toBeDefined();
  });

  it("should export component and options from Onboard", () => {
    expect(typeof CantonFamily.CantonOnboard.component).toBe("function");
    expect(typeof CantonFamily.CantonOnboard.options).toBe("object");
  });
});
