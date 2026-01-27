import { BlePlxManager } from "./BlePlxManager";

describe("BlePlxManager", () => {
  describe("instance", () => {
    it("provides same instance of RNBlePlxManager", () => {
      // given
      const prevInstance = BlePlxManager.instance;
      // when
      const newInstance = BlePlxManager.instance;
      // then
      expect(prevInstance).toStrictEqual(newInstance);
    });
  });
  describe("onStateChange", () => {
    it.each([true, false])(
      "calls ble plx onStateChange with emitCurrentState=%s",
      emitCurrentState => {
        // given
        const instance = BlePlxManager.instance;
        jest.spyOn(instance, "onStateChange");
        const listener = jest.fn();
        // when
        BlePlxManager.onStateChange(listener, emitCurrentState);
        // then
        expect(instance.onStateChange).toHaveBeenCalledWith(listener, emitCurrentState);
      },
    );
  });
});
