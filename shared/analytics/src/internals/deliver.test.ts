import { setAnalytics } from "../registry";
import type { Analytics, DeliveryStatus, LoggableEvent } from "../types";
import { deliver } from "./deliver";
import { analyticsEvents$ } from "./eventLog";
import { shouldBlockPii } from "./pii/shouldBlockPii";

jest.mock("./pii/shouldBlockPii", () => ({ shouldBlockPii: jest.fn(() => false) }));

const events: LoggableEvent[] = [];
let sub: ReturnType<typeof analyticsEvents$.subscribe>;

beforeAll(() => {
  sub = analyticsEvents$.subscribe(event => events.push(event));
});

afterAll(() => {
  sub.unsubscribe();
});

const createAnalyticsClient = ({
  track = jest.fn(),
  log = jest.fn(),
}: Partial<Analytics> = {}): jest.Mocked<Analytics> =>
  ({
    track: jest.fn(track),
    log: jest.fn(log),
  }) as unknown as jest.Mocked<Analytics>;

beforeEach(() => {
  events.length = 0;
  setAnalytics(undefined);
});

describe("deliver", () => {
  it("sends the event name and props to the analytics client", async () => {
    const analytics = createAnalyticsClient();
    setAnalytics(analytics);

    await deliver({
      type: "track",
      eventName: "Tracked",
      eventProperties: { foo: "bar" },
      eventPropertiesWithoutExtra: { foo: "bar" },
    });

    expect(analytics.track).toHaveBeenCalledWith("Tracked", { foo: "bar" });
  });

  it("logs before sending", async () => {
    const analytics = createAnalyticsClient();
    setAnalytics(analytics);

    await deliver({
      type: "track",
      eventName: "Logged",
      eventProperties: { foo: "bar" },
      eventPropertiesWithoutExtra: { foo: "bar" },
    });

    expect(analytics.log).toHaveBeenCalledWith("track", "Logged", {
      foo: "bar",
    });
  });

  it("still tracks when logging throws", async () => {
    const analytics = createAnalyticsClient({
      log: () => {
        throw new Error("logger is down");
      },
    });
    setAnalytics(analytics);

    await expect(
      deliver({
        type: "track",
        eventName: "Tracked",
        eventProperties: { foo: "bar" },
        eventPropertiesWithoutExtra: { foo: "bar" },
      }),
    ).resolves.toBeUndefined();

    expect(analytics.track).toHaveBeenCalledWith("Tracked", {
      foo: "bar",
    });
    expect(events[0].deliveryStatus).toBe("enqueued");
  });

  it("publishes enriched payloads", async () => {
    setAnalytics(createAnalyticsClient());

    await deliver({
      type: "track",
      eventName: "Both Payloads",
      eventProperties: { foo: "bar", appVersion: "1.2.3" },
      eventPropertiesWithoutExtra: { foo: "bar" },
    });

    expect(events[0]).toEqual({
      date: expect.any(Date),
      deliveryStatus: "enqueued",
      eventName: "Both Payloads",
      eventProperties: { foo: "bar", appVersion: "1.2.3" },
      eventPropertiesWithoutExtra: { foo: "bar" },
    });
  });

  describe("personal data guard", () => {
    const ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

    const deliverWithAddress = () =>
      deliver({
        type: "track",
        eventName: `Sent to ${ADDRESS}`,
        eventProperties: { flow: "send", recipient: ADDRESS, appVersion: "1.2.3" },
        eventPropertiesWithoutExtra: { flow: "send", recipient: ADDRESS },
      });

    describe("when the environment redacts", () => {
      beforeEach(() => {
        jest.mocked(shouldBlockPii).mockReturnValue(false);
      });

      it("sends the event with personal data redacted", async () => {
        const analytics = createAnalyticsClient();
        setAnalytics(analytics);

        await deliverWithAddress();

        expect(analytics.track).toHaveBeenCalledWith("Sent to [REDACTED:evm_address]", {
          flow: "send",
          recipient: "[REDACTED:evm_address]",
          appVersion: "1.2.3",
        });
      });

      it("logs the redacted event", async () => {
        const analytics = createAnalyticsClient();
        setAnalytics(analytics);

        await deliverWithAddress();

        expect(analytics.log).toHaveBeenCalledWith(
          "track",
          "Sent to [REDACTED:evm_address]",
          expect.objectContaining({ recipient: "[REDACTED:evm_address]" }),
        );
      });

      it("publishes where it found personal data, without the values", async () => {
        setAnalytics(createAnalyticsClient());

        await deliverWithAddress();

        expect(events[0]).toMatchObject({
          deliveryStatus: "enqueued",
          eventPropertiesWithoutExtra: { flow: "send", recipient: "[REDACTED:evm_address]" },
          piiFindings: [
            { path: "eventName", kind: "evm_address" },
            { path: "eventProperties.recipient", kind: "evm_address" },
          ],
        });
        expect(JSON.stringify(events[0])).not.toContain(ADDRESS);
      });

      it("publishes the findings when no analytics client is registered", async () => {
        await deliverWithAddress();

        expect(events[0]).toMatchObject({
          deliveryStatus: "skipped_no_client",
          piiFindings: expect.arrayContaining([
            { path: "eventProperties.recipient", kind: "evm_address" },
          ]),
        });
      });

      it("publishes findings in props that extra props overwrite", async () => {
        setAnalytics(createAnalyticsClient());

        await deliver({
          type: "track",
          eventName: "Overwritten",
          eventProperties: { platform: "mobile" },
          eventPropertiesWithoutExtra: { platform: ADDRESS },
        });

        expect(events[0].piiFindings).toEqual([
          { path: "eventProperties.platform", kind: "evm_address" },
        ]);
      });

      it("publishes a failed event redacted without sending it", async () => {
        const analytics = createAnalyticsClient();
        setAnalytics(analytics);

        await deliver({
          type: "track",
          eventName: "Unenrichable",
          eventProperties: { recipient: ADDRESS },
          eventPropertiesWithoutExtra: { recipient: ADDRESS },
          failure: "failed_enrichment",
        });

        expect(analytics.track).not.toHaveBeenCalled();
        expect(analytics.log).not.toHaveBeenCalled();
        expect(events[0]).toMatchObject({
          deliveryStatus: "failed_enrichment",
          eventProperties: { recipient: "[REDACTED:evm_address]" },
          piiFindings: [{ path: "eventProperties.recipient", kind: "evm_address" }],
        });
      });

      it("does not publish findings for a clean event", async () => {
        setAnalytics(createAnalyticsClient());

        await deliver({
          type: "track",
          eventName: "Clean",
          eventProperties: { flow: "send" },
          eventPropertiesWithoutExtra: { flow: "send" },
        });

        expect(events[0]).not.toHaveProperty("piiFindings");
      });
    });

    describe("when the environment blocks", () => {
      beforeEach(() => {
        jest.mocked(shouldBlockPii).mockReturnValue(true);
      });

      afterEach(() => {
        jest.mocked(shouldBlockPii).mockReturnValue(false);
      });

      it("rejects with an AnalyticsPiiError that names the paths", async () => {
        setAnalytics(createAnalyticsClient());

        const error = await deliverWithAddress().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe("AnalyticsPiiError");
        expect((error as Error).message).toContain("eventProperties.recipient (evm_address)");
        expect((error as Error).message).not.toContain(ADDRESS);
      });

      it("does not send or log the event", async () => {
        const analytics = createAnalyticsClient();
        setAnalytics(analytics);

        await deliverWithAddress().catch(() => {});

        expect(analytics.track).not.toHaveBeenCalled();
        expect(analytics.log).not.toHaveBeenCalled();
      });

      it("publishes blocked_pii", async () => {
        setAnalytics(createAnalyticsClient());

        await deliverWithAddress().catch(() => {});

        expect(events[0].deliveryStatus).toBe("blocked_pii");
      });
    });
  });

  describe("delivery status", () => {
    it("defaults to enqueued for a synchronous analytics client", async () => {
      setAnalytics(createAnalyticsClient());

      await deliver({
        type: "track",
        eventName: "Enqueued",
        eventProperties: {},
        eventPropertiesWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("lets the analytics client override the default status", async () => {
      setAnalytics(
        createAnalyticsClient({
          track: async () => "skipped_no_token" as DeliveryStatus,
        }),
      );

      await deliver({
        type: "track",
        eventName: "Overridden",
        eventProperties: {},
        eventPropertiesWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("skipped_no_token");
    });

    it("defaults to enqueued for an analytics client resolving nothing", async () => {
      setAnalytics(createAnalyticsClient({ track: async () => {} }));

      await deliver({
        type: "track",
        eventName: "Async Void",
        eventProperties: {},
        eventPropertiesWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("enqueued");
    });

    it("reports failed_tracking when the analytics client throws", async () => {
      setAnalytics(
        createAnalyticsClient({
          track: () => {
            throw new Error("segment is down");
          },
        }),
      );

      await expect(
        deliver({
          type: "track",
          eventName: "Throwing",
          eventProperties: {},
          eventPropertiesWithoutExtra: {},
        }),
      ).resolves.toBeUndefined();
      expect(events[0].deliveryStatus).toBe("failed_tracking");
    });

    it("reports failed_tracking without rejecting when the analytics client rejects", async () => {
      setAnalytics(
        createAnalyticsClient({
          track: async () => Promise.reject(new Error("segment is down")),
        }),
      );

      await expect(
        deliver({
          type: "track",
          eventName: "Rejecting",
          eventProperties: {},
          eventPropertiesWithoutExtra: {},
        }),
      ).resolves.toBeUndefined();
      expect(events[0].deliveryStatus).toBe("failed_tracking");
    });

    it("reports skipped_no_client when no analytics client is registered", async () => {
      setAnalytics(undefined);

      await deliver({
        type: "track",
        eventName: "No Client",
        eventProperties: {},
        eventPropertiesWithoutExtra: {},
      });

      expect(events[0].deliveryStatus).toBe("skipped_no_client");
    });
  });
});
