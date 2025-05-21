import { resetGesture, handleGesture, canSwipe } from "../gesture";
import { GestureParams } from "../../types";
import { SwipeDirection } from "../../enums";

describe("gesture utilities", () => {
  describe("resetGesture", () => {
    it("resets swipeX and swipeY values to 0", () => {
      const params: GestureParams = {
        swipeX: { value: 40 },
        swipeY: { value: 30 },
        velocityX: 100,
        velocityY: 200,
      };

      resetGesture(params);

      expect(params.swipeX.value).toBe(0);
      expect(params.swipeY.value).toBe(0);
    });
  });

  describe("handleGesture", () => {
    it("handle Horizontal Gesture", () => {
      const params: GestureParams = {
        swipeX: { value: 400 },
        swipeY: { value: 0 },
        velocityX: 500,
        velocityY: 0,
      };

      handleGesture(SwipeDirection.Horizontal, params);

      expect(params.swipeX.value).toBeGreaterThan(0);
      expect(params.swipeY.value).toEqual(0);
    });

    it("handle Vertical Gesture", () => {
      const params: GestureParams = {
        swipeX: { value: 0 },
        swipeY: { value: 400 },
        velocityX: 0,
        velocityY: 500,
      };

      handleGesture(SwipeDirection.Vertical, params);

      expect(params.swipeX.value).toEqual(0);
      expect(params.swipeY.value).toBeGreaterThan(0);
    });

    it("handles zero velocity for Horizontal Gesture", () => {
      const params: GestureParams = {
        swipeX: { value: 0 },
        swipeY: { value: 0 },
        velocityX: 0,
        velocityY: 0,
      };

      handleGesture(SwipeDirection.Horizontal, params);

      expect(params.swipeX.value).toEqual(0);
      expect(params.swipeY.value).toEqual(0);
    });

    it("handles zero velocity for Vertical Gesture", () => {
      const params: GestureParams = {
        swipeX: { value: 0 },
        swipeY: { value: 0 },
        velocityX: 0,
        velocityY: 0,
      };

      handleGesture(SwipeDirection.Vertical, params);

      expect(params.swipeX.value).toEqual(0);
      expect(params.swipeY.value).toEqual(0);
    });

    it("handles negative velocity for Horizontal Gesture", () => {
      const params: GestureParams = {
        swipeX: { value: 0 },
        swipeY: { value: 0 },
        velocityX: -500,
        velocityY: 0,
      };

      handleGesture(SwipeDirection.Horizontal, params);

      expect(params.swipeX.value).toEqual(0);
      expect(params.swipeY.value).toEqual(0);
    });

    it("handles negative velocity for Vertical Gesture", () => {
      const params: GestureParams = {
        swipeX: { value: 0 },
        swipeY: { value: 0 },
        velocityX: 0,
        velocityY: -500,
      };

      handleGesture(SwipeDirection.Vertical, params);

      expect(params.swipeX.value).toEqual(0);
      expect(params.swipeY.value).toEqual(0);
    });
  });
});

describe("canSwipe", () => {
  it("returns true when velocity exceeds the velocity threshold", () => {
    expect(canSwipe(10, 500, 50)).toBe(true);
  });

  it("returns true when value exceeds the threshold", () => {
    expect(canSwipe(60, 300, 50)).toBe(true);
  });

  it("returns false when neither value nor velocity exceeds their thresholds", () => {
    expect(canSwipe(40, 300, 50)).toBe(false);
  });

  it("returns true when both value and velocity exceed their thresholds", () => {
    expect(canSwipe(60, 500, 50)).toBe(true);
  });
});
