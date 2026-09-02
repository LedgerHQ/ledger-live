// segment.ts sits in a require cycle with ~/analytics, so it must not be the first app module
// this file loads: its exports would be read while still uninitialised.
import "~/actions/settings";
import type { Subscription } from "rxjs";
import * as segment from "../segment";
import type { LoggableEvent } from "../segment";

jest.unmock("../segment");

describe("segment before start()", () => {
  let logged: LoggableEvent[];
  let subscription: Subscription;

  beforeEach(() => {
    logged = [];
    subscription = segment.trackSubject.subscribe(event => logged.push(event));
    logged.length = 0; // trackSubject is a ReplaySubject: drop what it replays from earlier tests
  });

  afterEach(() => subscription.unsubscribe());

  it("should log track as skipped_no_store when the store is not initialised", async () => {
    await segment.track("TestEvent", { foo: "bar" });

    expect(logged).toEqual([
      expect.objectContaining({
        eventName: "TestEvent",
        eventProperties: { foo: "bar" },
        deliveryStatus: "skipped_no_store",
      }),
    ]);
  });

  it("should not log [Identify] when the store is not initialised", async () => {
    await segment.updateIdentify();

    expect(logged).toEqual([]);
  });

  it("should log screen as skipped_no_store when the store is not initialised", async () => {
    await segment.screen("Portfolio", "Detail");

    expect(logged).toEqual([
      expect.objectContaining({
        eventName: "Page Portfolio Detail",
        deliveryStatus: "skipped_no_store",
      }),
    ]);
  });
});
