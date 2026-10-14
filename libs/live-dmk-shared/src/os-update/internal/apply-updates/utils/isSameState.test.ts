import { ApplyUpdatesStateType } from "../../../api/model/ApplyUpdatesState";
import { isSameState } from "./isSameState";

const noop = () => undefined;

describe("isSameState", () => {
  describe("success", () => {
    it("should return true when both states are the same type", () => {
      expect(
        isSameState(
          { type: ApplyUpdatesStateType.LOADING },
          { type: ApplyUpdatesStateType.LOADING },
        ),
      ).toBe(true);
      expect(
        isSameState(
          { type: ApplyUpdatesStateType.AWAITING_GRANT_CONSENT },
          { type: ApplyUpdatesStateType.AWAITING_GRANT_CONSENT },
        ),
      ).toBe(true);
    });

    it("should ignore the callbacks carried by a state", () => {
      expect(
        isSameState(
          {
            type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
            retry: noop,
            cancel: noop,
          },
          {
            type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED,
            retry: () => undefined,
            cancel: () => undefined,
          },
        ),
      ).toBe(true);
    });

    it("should return true when two updating states carry the same progress and counters", () => {
      expect(
        isSameState(
          {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.5,
            updateIndex: 1,
            updateCount: 2,
          },
          {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.5,
            updateIndex: 1,
            updateCount: 2,
          },
        ),
      ).toBe(true);
    });

    it("should return true when two restoring states carry the same progress", () => {
      expect(
        isSameState(
          { type: ApplyUpdatesStateType.RESTORING, progress: 0.95 },
          { type: ApplyUpdatesStateType.RESTORING, progress: 0.95 },
        ),
      ).toBe(true);
    });
  });

  describe("error", () => {
    it("should return false when the state types differ", () => {
      expect(
        isSameState(
          { type: ApplyUpdatesStateType.LOADING },
          { type: ApplyUpdatesStateType.DEVICE_LOCKED },
        ),
      ).toBe(false);
    });

    it("should return false when the progress of an updating state moved", () => {
      expect(
        isSameState(
          {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.5,
            updateIndex: 1,
            updateCount: 2,
          },
          {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.6,
            updateIndex: 1,
            updateCount: 2,
          },
        ),
      ).toBe(false);
    });

    it("should return false when only the update counter moved", () => {
      expect(
        isSameState(
          {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.5,
            updateIndex: 1,
            updateCount: 2,
          },
          {
            type: ApplyUpdatesStateType.UPDATING,
            progress: 0.5,
            updateIndex: 2,
            updateCount: 2,
          },
        ),
      ).toBe(false);
    });

    it("should return false when the progress of a restoring state moved", () => {
      expect(
        isSameState(
          { type: ApplyUpdatesStateType.RESTORING, progress: 0.9 },
          { type: ApplyUpdatesStateType.RESTORING, progress: 1 },
        ),
      ).toBe(false);
    });
  });
});
