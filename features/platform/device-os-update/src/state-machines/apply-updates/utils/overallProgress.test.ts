import type { OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import { overallProgress, type OverallProgressContext } from "./overallProgress";

const anUpdate = (
  overrides: { shouldFlashMcu?: boolean; hasFinalFirmware?: boolean } = {},
): OsUpdate =>
  ({
    shouldFlashMcu: overrides.shouldFlashMcu ?? true,
    finalFirmware: {
      firmware: overrides.hasFinalFirmware === false ? null : "final-firmware",
    },
  }) as OsUpdate;

const aContext = (overrides: Partial<OverallProgressContext> = {}): OverallProgressContext => ({
  osUpdates: [anUpdate()],
  updateIndex: 0,
  osuProgress: 0,
  flashesDone: 0,
  currentFlashProgress: 0,
  flashCompleted: false,
  finalProgress: 0,
  restoreProgress: 0,
  lastProgress: 0,
  ...overrides,
});

describe("overallProgress", () => {
  describe("a single update", () => {
    it("should report nothing before anything has been installed", () => {
      expect(overallProgress(aContext())).toBe(0);
    });

    it("should give the OSU install the largest share", () => {
      // 0.6 of the only update, of the 0.9 the updates are worth.
      expect(overallProgress(aContext({ osuProgress: 1 }))).toBeCloseTo(0.54);
    });

    it("should top the updates out at their share of the bar", () => {
      expect(
        overallProgress(aContext({ osuProgress: 1, finalProgress: 1, flashCompleted: true })),
      ).toBeCloseTo(0.9);
    });

    it("should fill the rest of the bar with the restore", () => {
      expect(
        overallProgress(
          aContext({
            osuProgress: 1,
            finalProgress: 1,
            flashCompleted: true,
            restoreProgress: 1,
          }),
        ),
      ).toBeCloseTo(1);
    });
  });

  describe("skipped work", () => {
    it("should snap the flash term when the update does not flash the MCU", () => {
      const context = aContext({
        osUpdates: [anUpdate({ shouldFlashMcu: false })],
      });

      expect(overallProgress(context)).toBeCloseTo(0.27);
    });

    it("should snap the final install term when there is no final firmware", () => {
      const context = aContext({
        osUpdates: [anUpdate({ shouldFlashMcu: true, hasFinalFirmware: false })],
      });

      expect(overallProgress(context)).toBeCloseTo(0.09);
    });

    it("should leave the restore share empty until the restore step reports", () => {
      expect(overallProgress(aContext())).toBe(0);
    });
  });

  describe("the flash loop", () => {
    it("should cover a fixed share of what is left at each pass", () => {
      const context = aContext({
        osUpdates: [anUpdate({ shouldFlashMcu: true })],
      });

      const first = overallProgress({ ...context, flashesDone: 1 });
      const second = overallProgress({ ...context, flashesDone: 2 });
      const third = overallProgress({ ...context, flashesDone: 3 });

      expect(first).toBeLessThan(second);
      expect(second).toBeLessThan(third);
      expect(second - first).toBeGreaterThan(third - second);
    });

    it("should never reach the end of its share on its own", () => {
      const context = aContext({
        osUpdates: [anUpdate({ shouldFlashMcu: true })],
        flashesDone: 10,
      });

      expect(overallProgress(context)).toBeLessThan(
        overallProgress({ ...context, flashCompleted: true }),
      );
    });

    it("should advance within a pass as the flash reports progress", () => {
      const context = aContext({
        osUpdates: [anUpdate({ shouldFlashMcu: true })],
      });

      expect(overallProgress({ ...context, currentFlashProgress: 0.5 })).toBeGreaterThan(
        overallProgress(context),
      );
    });
  });

  describe("several updates", () => {
    it("should split the bar evenly between the updates", () => {
      const context = aContext({
        osUpdates: [anUpdate(), anUpdate(), anUpdate()],
        updateIndex: 1,
        osuProgress: 1,
        finalProgress: 1,
        flashCompleted: true,
      });

      // Two of three updates done, of the 0.9 the updates are worth.
      expect(overallProgress(context)).toBeCloseTo(0.6);
    });
  });

  describe("monotonicity", () => {
    it("should never go backwards", () => {
      expect(overallProgress(aContext({ lastProgress: 0.8 }))).toBe(0.8);
    });

    it("should never exceed a full bar", () => {
      const context = aContext({
        osuProgress: 1,
        finalProgress: 1,
        flashCompleted: true,
        restoreProgress: 2,
      });

      expect(overallProgress(context)).toBe(1);
    });

    it("should report nothing while the update path is still unresolved", () => {
      expect(overallProgress(aContext({ osUpdates: [] }))).toBe(0);
    });
  });
});
