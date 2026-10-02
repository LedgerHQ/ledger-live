// segment.ts sits in a require cycle with ~/analytics, so it must not be the first app module
// this file loads: its exports would be read while still uninitialised.
import "~/actions/settings";
import type { Subscription } from "rxjs";
import { analyticsEvents$, type LoggableEvent } from "@shared/analytics";
import * as segment from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

describe("segment before start()", () => {
  let logged: LoggableEvent[];
  let subscription: Subscription;

  beforeEach(() => {
    logged = [];
    subscription = analyticsEvents$.subscribe(event => logged.push(event));
    logged.length = 0; // analyticsEvents$ is a ReplaySubject: drop what it replays from earlier tests
  });

  afterEach(() => subscription.unsubscribe());

  it("should not log [Identify] when the store is not initialised", async () => {
    await segment.updateIdentify();

    expect(logged).toEqual([]);
  });
});
