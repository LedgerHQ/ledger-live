import {
  afterFirstHomeLayout,
  consumeFirstHomeLayout,
  resetStartupTimeMarker,
} from "../startupTimeMarkerState";

describe("startupTimeMarkerState", () => {
  beforeEach(() => {
    resetStartupTimeMarker();
  });

  it("should run afterFirstHomeLayout immediately after consumeFirstHomeLayout", () => {
    const cb = jest.fn();
    consumeFirstHomeLayout();
    afterFirstHomeLayout(cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("should flush queued listeners once", () => {
    const cb = jest.fn();
    afterFirstHomeLayout(cb);
    expect(cb).not.toHaveBeenCalled();
    expect(consumeFirstHomeLayout()).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(consumeFirstHomeLayout()).toBe(false);
  });
});
