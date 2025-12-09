import { logStartupEvent, startupEvents } from "../logStartupTime";
import { resolveStartupEvents } from "../resolveStartupEvents";

describe("logStartupTime", () => {
  beforeEach(() => {
    startupEvents.splice(0); // Clear the array before each test
  });

  it("should log startup events and resolve them correctly", async () => {
    jest.useRealTimers();
    logStartupEvent("Step 1");
    const p = new Promise(r => setTimeout(() => r(logStartupEvent("Step 3"))));
    logStartupEvent("Step 2");
    expect(startupEvents).toEqual([
      { event: "Step 1", time: expect.any(Number) },
      { event: "Step 2", time: expect.any(Number) },
    ]);
    await p;
    expect(await resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 1 },
      { event: "Step 2", time: expect.any(Number), count: 1 },
      { event: "Step 3", time: expect.any(Number), count: 1 },
    ]);
  });

  it("should group identical events", async () => {
    logStartupEvent("Step 1");
    logStartupEvent("Step 2");
    logStartupEvent("Step 1");
    expect(await resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 2 },
      { event: "Step 2", time: expect.any(Number), count: 1 },
    ]);
  });

  it("should keep logging events regardless of resolve calls", async () => {
    logStartupEvent("Step 1");
    expect(await resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 1 },
    ]);
    logStartupEvent("Step 2");
    expect(await resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 1 },
      { event: "Step 2", time: expect.any(Number), count: 1 },
    ]);
  });
});
