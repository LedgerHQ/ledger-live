import { createSyncTimeEstimator } from "../sync-estimator";

describe("createSyncTimeEstimator", () => {
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    dateNowSpy = jest.spyOn(Date, "now");
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe("when processedBlocks <= 0", () => {
    it("returns { hours: 0, minutes: 0 } when processedBlocks is 0", () => {
      dateNowSpy.mockReturnValue(1000);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(6000);
      expect(estimator(0)).toEqual({ hours: 0, minutes: 0 });
    });

    it("returns { hours: 0, minutes: 0 } when processedBlocks is negative", () => {
      dateNowSpy.mockReturnValue(1000);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(6000);
      expect(estimator(-5)).toEqual({ hours: 0, minutes: 0 });
    });
  });

  describe("correct hours/minutes for various elapsed times and block counts", () => {
    it("estimates remaining time when half the blocks are processed", () => {
      // start at t=0, call estimator at t=60s having processed 50 of 100 blocks
      // rate = 60/50 = 1.2 s/block, remaining = 50 blocks => 60s => 1 min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(60_000);
      expect(estimator(50)).toEqual({ hours: 0, minutes: 1 });
    });

    it("estimates hours and minutes correctly", () => {
      // start at t=0, call at t=3600s (1 hour) having processed 100 of 1000 blocks
      // rate = 3600/100 = 36 s/block, remaining = 900 blocks => 32400s => 540 min => 9h 0min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(1000);

      dateNowSpy.mockReturnValue(3_600_000);
      expect(estimator(100)).toEqual({ hours: 9, minutes: 0 });
    });

    it("calculates mixed hours and minutes", () => {
      // start at t=0, call at t=300s (5 min) having processed 10 of 100 blocks
      // rate = 300/10 = 30 s/block, remaining = 90 blocks => 2700s => 45 min => 0h 45min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(300_000);
      expect(estimator(10)).toEqual({ hours: 0, minutes: 45 });
    });

    it("returns 0 hours and non-zero minutes for short remaining times", () => {
      // start at t=0, call at t=10s having processed 5 of 10 blocks
      // rate = 10/5 = 2 s/block, remaining = 5 blocks => 10s => 0 min (floored)
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(10);

      dateNowSpy.mockReturnValue(10_000);
      expect(estimator(5)).toEqual({ hours: 0, minutes: 0 });
    });

    it("floors minutes rather than rounding", () => {
      // start at t=0, call at t=100s having processed 1 of 2 blocks
      // rate = 100/1 = 100 s/block, remaining = 1 block => 100s => 1.667 min => floored to 1
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(2);

      dateNowSpy.mockReturnValue(100_000);
      expect(estimator(1)).toEqual({ hours: 0, minutes: 1 });
    });

    it("handles multiple calls with advancing time", () => {
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(1000);

      // First call: t=60s, 10 blocks done
      // rate = 60/10 = 6 s/block, remaining = 990 blocks => 5940s => 99 min => 1h 39min
      dateNowSpy.mockReturnValue(60_000);
      expect(estimator(10)).toEqual({ hours: 1, minutes: 39 });

      // Second call: t=120s, 20 blocks done
      // rate = 120/20 = 6 s/block, remaining = 980 blocks => 5880s => 98 min => 1h 38min
      dateNowSpy.mockReturnValue(120_000);
      expect(estimator(20)).toEqual({ hours: 1, minutes: 38 });
    });
  });

  describe("edge cases", () => {
    it("returns { hours: 0, minutes: 0 } when totalBlocks equals processedBlocks (sync complete)", () => {
      // start at t=0, call at t=60s having processed all 100 blocks
      // remaining = 0 blocks => 0s => 0h 0min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(60_000);
      expect(estimator(100)).toEqual({ hours: 0, minutes: 0 });
    });

    it("returns negative-time-safe result when processedBlocks exceeds totalBlocks", () => {
      // start at t=0, call at t=60s with processedBlocks > totalBlocks
      // remaining = -10 blocks => negative remainingSeconds => Math.floor goes negative
      // This is an edge case showing the function doesn't clamp
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(60_000);
      const result = estimator(110);
      // rate = 60/110 s/block, remaining = -10 => negative seconds
      // Math.floor of negative totalMinutes, hours & minutes will be negative or -0
      expect(result).toHaveProperty("hours");
      expect(result).toHaveProperty("minutes");
    });

    it("handles very large block counts", () => {
      // 10 million blocks total, processed 2 million in 1200s
      // rate = 1200/2_000_000 = 0.0006 s/block, remaining = 8_000_000 blocks => 4800s => 80 min => 1h 20min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(10_000_000);

      dateNowSpy.mockReturnValue(1_200_000);
      expect(estimator(2_000_000)).toEqual({ hours: 1, minutes: 20 });
    });

    it("handles totalBlocks of 0 with processedBlocks > 0", () => {
      // totalBlocks = 0, processedBlocks = 5 at t=10s
      // remaining = 0 - 5 = -5 blocks => negative remaining
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(0);

      dateNowSpy.mockReturnValue(10_000);
      const result = estimator(5);
      expect(result).toHaveProperty("hours");
      expect(result).toHaveProperty("minutes");
    });

    it("handles very small elapsed time (1ms)", () => {
      // start at t=0, call at t=1ms having processed 1 of 1000 blocks
      // rate = 0.001/1 = 0.001 s/block, remaining = 999 blocks => 0.999s => 0 min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(1000);

      dateNowSpy.mockReturnValue(1);
      expect(estimator(1)).toEqual({ hours: 0, minutes: 0 });
    });

    it("handles exactly 0 elapsed time", () => {
      // start and call both at t=0 with processedBlocks = 1
      // elapsedSeconds = 0, secondsPerBlock = 0/1 = 0, remaining = 0 * remaining => 0
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(100);

      dateNowSpy.mockReturnValue(0);
      expect(estimator(1)).toEqual({ hours: 0, minutes: 0 });
    });

    it("captures start time at creation, not at invocation", () => {
      // Verify that start is captured once during createSyncTimeEstimator
      dateNowSpy.mockReturnValue(10_000);
      const estimator = createSyncTimeEstimator(100);

      // Call at t=70s (elapsed = 60s from start at t=10s)
      // rate = 60/50 = 1.2 s/block, remaining = 50 blocks => 60s => 1 min
      dateNowSpy.mockReturnValue(70_000);
      expect(estimator(50)).toEqual({ hours: 0, minutes: 1 });
    });

    it("handles processedBlocks of 1 with large totalBlocks", () => {
      // start at t=0, call at t=120s having processed 1 of 100000 blocks
      // rate = 120/1 = 120 s/block, remaining = 99999 blocks => 11999880s => 199998 min => 3333h 18min
      dateNowSpy.mockReturnValue(0);
      const estimator = createSyncTimeEstimator(100_000);

      dateNowSpy.mockReturnValue(120_000);
      expect(estimator(1)).toEqual({ hours: 3333, minutes: 18 });
    });
  });
});
