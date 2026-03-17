import * as ConcordiumOnboard from "./Onboard/Onboard";
import * as ConcordiumFamily from "./index";

describe("Concordium Family", () => {
  it("should export ConcordiumOnboard module", () => {
    expect(ConcordiumFamily.ConcordiumOnboard).toBeDefined();
    expect(ConcordiumFamily.ConcordiumOnboard).toBe(ConcordiumOnboard);
  });

  it("should have the expected exports", () => {
    expect(ConcordiumFamily.ConcordiumOnboard.component).toBeDefined();
    expect(ConcordiumFamily.ConcordiumOnboard.options).toBeDefined();
  });

  it("should export component as a function and options as an object", () => {
    expect(typeof ConcordiumFamily.ConcordiumOnboard.component).toBe("function");
    expect(typeof ConcordiumFamily.ConcordiumOnboard.options).toBe("object");
  });
});
