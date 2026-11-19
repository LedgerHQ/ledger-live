import {
  createOperationTracker,
  failOperation,
  getOperationId,
  isOperationActive,
  setOperationSink,
  startOperation,
  succeedOperation,
} from "./operationTracker";
import type { OperationSink, OperationTracker } from "./types";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

const createSink = (recording = true) => ({
  isRecording: jest.fn(() => recording),
  start: jest.fn<void, Parameters<OperationSink["start"]>>(),
  succeed: jest.fn<void, Parameters<OperationSink["succeed"]>>(),
  fail: jest.fn<void, Parameters<OperationSink["fail"]>>(),
});

describe("createOperationTracker", () => {
  let clock: number;
  let sink: ReturnType<typeof createSink>;
  let tracker: OperationTracker;

  beforeEach(() => {
    clock = 1_000;
    sink = createSink();
    tracker = createOperationTracker({ now: () => clock });
    tracker.setSink(sink);
  });

  it("should send nothing when no sink is registered", () => {
    tracker.setSink(null);

    expect(tracker.start("checkout")).toBeNull();
    expect(tracker.isActive("checkout")).toBe(false);
    expect(tracker.succeed("checkout")).toBe(false);
    expect(sink.start).not.toHaveBeenCalled();
  });

  it("should send nothing when the sink is not recording", () => {
    const idleSink = createSink(false);
    tracker.setSink(idleSink);

    expect(tracker.start("checkout")).toBeNull();
    expect(tracker.fail("checkout", "ERROR")).toBe(false);
    expect(idleSink.start).not.toHaveBeenCalled();
    expect(idleSink.fail).not.toHaveBeenCalled();
  });

  it("should not start when the sink cannot tell whether it records", () => {
    sink.isRecording.mockImplementation(() => {
      throw new Error("not initialized");
    });

    expect(tracker.start("checkout")).toBeNull();
    expect(sink.start).not.toHaveBeenCalled();
  });

  it("should keep the first start when an active operation is started again", () => {
    expect(tracker.start("checkout", { attributes: { attempt: 1 } })).not.toBeNull();
    expect(tracker.start("checkout", { attributes: { attempt: 2 } })).toBeNull();

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.start).toHaveBeenCalledWith("checkout", undefined, { attempt: 1 });
    expect(tracker.isActive("checkout")).toBe(true);
  });

  it("should send a single stop event when an operation is stopped twice", () => {
    tracker.start("checkout");

    expect(tracker.succeed("checkout")).toBe(true);
    expect(tracker.succeed("checkout")).toBe(false);
    expect(tracker.fail("checkout", "ABANDONED")).toBe(false);

    expect(sink.succeed).toHaveBeenCalledTimes(1);
    expect(sink.fail).not.toHaveBeenCalled();
    expect(tracker.isActive("checkout")).toBe(false);
  });

  it("should drop a stop event when its start was not sent", () => {
    expect(tracker.succeed("checkout")).toBe(false);
    expect(tracker.fail("checkout", "ERROR")).toBe(false);

    expect(sink.succeed).not.toHaveBeenCalled();
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should send the stop to the sink of the start when recording stopped since", () => {
    tracker.start("checkout");
    sink.isRecording.mockReturnValue(false);
    tracker.setSink(null);

    expect(tracker.fail("checkout", "ERROR")).toBe(true);
    expect(sink.fail).toHaveBeenCalledWith("checkout", undefined, "ERROR", {});
  });

  it("should merge the start attributes into the stop event and drop undefined values", () => {
    tracker.start("checkout", {
      attributes: { currency_id: "bitcoin", context: undefined, attempt: 1 },
    });
    tracker.fail("checkout", "OTHER", {
      attributes: { outcome: "nothing_to_add", error_name: undefined, attempt: 2 },
    });

    expect(sink.start.mock.calls[0][2]).toStrictEqual({ currency_id: "bitcoin", attempt: 1 });
    expect(sink.fail).toHaveBeenCalledTimes(1);
    const [name, operationKey, reason, attributes] = sink.fail.mock.calls[0];
    expect([name, operationKey, reason]).toEqual(["checkout", undefined, "OTHER"]);
    expect(attributes).toStrictEqual({
      currency_id: "bitcoin",
      attempt: 2,
      outcome: "nothing_to_add",
    });
  });

  it("should track each operation key separately", () => {
    expect(tracker.start("checkout", { operationKey: "a" })).not.toBeNull();
    expect(tracker.start("checkout", { operationKey: "b" })).not.toBeNull();
    expect(tracker.succeed("checkout", { operationKey: "a" })).toBe(true);

    expect(sink.start).toHaveBeenCalledWith("checkout", "a", {});
    expect(sink.start).toHaveBeenCalledWith("checkout", "b", {});
    expect(sink.succeed).toHaveBeenCalledWith("checkout", "a", {});
    expect(tracker.isActive("checkout", { operationKey: "a" })).toBe(false);
    expect(tracker.isActive("checkout", { operationKey: "b" })).toBe(true);
    expect(tracker.isActive("checkout")).toBe(false);
  });

  it("should swallow a throwing sink and still end the operation", () => {
    sink.start.mockImplementation(() => {
      throw new Error("bridge unavailable");
    });
    sink.fail.mockImplementation(() => {
      throw new Error("bridge unavailable");
    });

    expect(() => tracker.start("checkout")).not.toThrow();
    expect(tracker.isActive("checkout")).toBe(true);
    expect(() => tracker.fail("checkout", "ERROR")).not.toThrow();
    expect(tracker.isActive("checkout")).toBe(false);
  });

  it.each(["", "add account", "checkout/step", "émoji"])(
    "should ignore the invalid operation name %p",
    name => {
      expect(tracker.start(name)).toBeNull();
      expect(tracker.isActive(name)).toBe(false);
      expect(tracker.succeed(name)).toBe(false);
      expect(sink.start).not.toHaveBeenCalled();
    },
  );

  it.each(["add_account", "send.v2", "swap@provider", "$device-connect"])(
    "should accept the operation name %p",
    name => {
      expect(tracker.start(name)).not.toBeNull();
    },
  );

  describe("ids", () => {
    it("should give each started operation its own truthy id", () => {
      const firstId = tracker.start("checkout");
      tracker.fail("checkout", "ERROR");
      const secondId = tracker.start("checkout");

      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(secondId).not.toBe(firstId);
    });

    it("should give the id of the active operation of a name and key", () => {
      const id = tracker.start("checkout", { operationKey: "cart-1" });

      expect(tracker.getId("checkout", "cart-1")).toBe(id);
      expect(tracker.getId("checkout")).toBeNull();
      expect(tracker.getId("checkout/step")).toBeNull();

      tracker.succeed("checkout", { operationKey: "cart-1" });

      expect(tracker.getId("checkout", "cart-1")).toBeNull();
    });

    it("should stop only the operation of the expected id", () => {
      const firstId = tracker.start("checkout") ?? undefined;
      tracker.fail("checkout", "ABANDONED");
      const secondId = tracker.start("checkout") ?? undefined;

      expect(tracker.isActive("checkout", { expectedId: firstId })).toBe(false);
      expect(tracker.succeed("checkout", { expectedId: firstId })).toBe(false);
      expect(tracker.fail("checkout", "ABANDONED", { expectedId: firstId })).toBe(false);
      expect(tracker.isActive("checkout", { expectedId: secondId })).toBe(true);
      expect(tracker.succeed("checkout", { expectedId: secondId })).toBe(true);
      expect(sink.succeed).toHaveBeenCalledTimes(1);
    });
  });

  describe("with an operation older than a monitoring session", () => {
    it("should keep blocking a new start before 4 hours", () => {
      tracker.start("checkout");
      clock += FOUR_HOURS_MS - 1;

      expect(tracker.start("checkout")).toBeNull();
      expect(tracker.isActive("checkout")).toBe(true);
    });

    it("should replace the stale operation without sending its stop", () => {
      tracker.start("checkout", { attributes: { attempt: 1 } });
      clock += FOUR_HOURS_MS;

      expect(tracker.start("checkout", { attributes: { attempt: 2 } })).not.toBeNull();

      expect(sink.start).toHaveBeenCalledTimes(2);
      expect(sink.start).toHaveBeenLastCalledWith("checkout", undefined, { attempt: 2 });
      expect(sink.succeed).not.toHaveBeenCalled();
      expect(sink.fail).not.toHaveBeenCalled();
    });

    it("should drop the stop of a stale operation", () => {
      tracker.start("checkout");
      clock += FOUR_HOURS_MS;

      expect(tracker.isActive("checkout")).toBe(false);
      expect(tracker.fail("checkout", "ABANDONED")).toBe(false);
      expect(sink.fail).not.toHaveBeenCalled();
    });
  });
});

describe("app-wide tracker", () => {
  it("should send the operations of the default functions to the registered sink", () => {
    const sink = createSink();
    setOperationSink(sink);

    const id = startOperation("app_wide_checkout", { operationKey: "k" });
    expect(isOperationActive("app_wide_checkout", { operationKey: "k" })).toBe(true);
    expect(getOperationId("app_wide_checkout", "k")).toBe(id);
    expect(succeedOperation("app_wide_checkout", { operationKey: "k", expectedId: id ?? 0 })).toBe(
      true,
    );
    startOperation("app_wide_checkout");
    expect(failOperation("app_wide_checkout", "ABANDONED")).toBe(true);
    setOperationSink(null);

    expect(sink.start).toHaveBeenCalledTimes(2);
    expect(sink.succeed).toHaveBeenCalledWith("app_wide_checkout", "k", {});
    expect(sink.fail).toHaveBeenCalledWith("app_wide_checkout", undefined, "ABANDONED", {});
  });
});
