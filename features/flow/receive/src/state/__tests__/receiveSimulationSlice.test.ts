import {
  receiveSimulationSlice,
  selectIsSanctionSimulated,
  setSanctionSimulated,
} from "../receiveSimulationSlice";

const reduce = receiveSimulationSlice.reducer;

describe("receiveSimulationSlice", () => {
  it("should simulate no sanction by default", () => {
    expect(
      selectIsSanctionSimulated({ receiveSimulation: reduce(undefined, { type: "init" }) }),
    ).toBe(false);
  });

  it("should simulate a sanctioned address when the DevTools turn it on", () => {
    const state = reduce(undefined, setSanctionSimulated(true));

    expect(selectIsSanctionSimulated({ receiveSimulation: state })).toBe(true);
  });
});
