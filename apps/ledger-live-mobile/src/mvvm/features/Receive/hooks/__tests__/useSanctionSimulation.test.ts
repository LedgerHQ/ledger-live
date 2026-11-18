import { act, renderHook } from "@tests/test-renderer";
import { useSanctionSimulation } from "../useSanctionSimulation";

describe("useSanctionSimulation", () => {
  it("shares the switch between its readers until it is turned off", () => {
    const tool = renderHook(() => useSanctionSimulation());
    const screen = renderHook(() => useSanctionSimulation());

    act(() => tool.result.current.setSimulated(true));
    expect(screen.result.current.isSimulated).toBe(true);

    act(() => tool.result.current.setSimulated(false));
    expect(screen.result.current.isSimulated).toBe(false);
  });
});
