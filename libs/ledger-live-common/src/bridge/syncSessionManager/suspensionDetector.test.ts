import { createSuspensionDetector } from "./suspensionDetector";

describe("createSuspensionDetector", () => {
  let mockNow = 0;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNow = 0;
    jest.spyOn(performance, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("is not suspended initially", () => {
    const detector = createSuspensionDetector();
    expect(detector.wasSuspended()).toBe(false);
  });

  it("latches suspended on large clock gap between ticks", () => {
    const detector = createSuspensionDetector();
    detector.start();

    mockNow += 5_000;
    jest.advanceTimersByTime(5_000);
    expect(detector.wasSuspended()).toBe(false);

    mockNow += 40_000;
    jest.advanceTimersByTime(5_000);
    expect(detector.wasSuspended()).toBe(true);
  });

  it("latches suspended when markSuspended is called", () => {
    const detector = createSuspensionDetector();
    detector.start();
    detector.markSuspended();
    expect(detector.wasSuspended()).toBe(true);
  });

  it("reset clears the suspended flag", () => {
    const detector = createSuspensionDetector();
    detector.markSuspended();
    detector.reset();
    expect(detector.wasSuspended()).toBe(false);
  });

  it("stop prevents further gap detection", () => {
    const detector = createSuspensionDetector();
    detector.start();
    detector.stop();

    mockNow += 60_000;
    jest.advanceTimersByTime(60_000);
    expect(detector.wasSuspended()).toBe(false);
  });
});
