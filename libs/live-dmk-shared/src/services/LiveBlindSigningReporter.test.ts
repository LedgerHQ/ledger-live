import { Left, Right } from "purify-ts";
import {
  type BlindSigningReporter,
  type BlindSigningReportParams,
} from "@ledgerhq/context-module";
import {
  LiveBlindSigningReporter,
  buildDefaultHttpBlindSigningReporter,
  liveBlindSigningReporter,
} from "./LiveBlindSigningReporter";

const makeParams = (
  overrides: Partial<BlindSigningReportParams> = {},
): BlindSigningReportParams =>
  ({
    signatureId: "sig-1",
    signingMethod: "eth_signTransaction",
    isBlindSign: true,
    chainId: 1,
    targetAddress: "0xabc",
    blindSignReason: null,
    modelId: "nanoX",
    signerAppVersion: "1.0.0",
    deviceVersion: "2.0.0",
    ethContext: null,
    ...overrides,
  }) as unknown as BlindSigningReportParams;

const makeFakeInner = (
  result: Awaited<ReturnType<BlindSigningReporter["report"]>> = Right<void, Error>(undefined),
): BlindSigningReporter & { report: jest.Mock } => ({
  report: jest.fn().mockResolvedValue(result),
});

describe("LiveBlindSigningReporter", () => {
  const reporter = LiveBlindSigningReporter.getInstance();

  beforeEach(() => {
    reporter.clearContext();
    reporter.setConsent(false);
    // Reset inner: no public clear method exists; cast to satisfy the setter.
    reporter.setInner(undefined as unknown as BlindSigningReporter);
  });

  describe("singleton", () => {
    it("returns the same instance from getInstance", () => {
      expect(LiveBlindSigningReporter.getInstance()).toBe(
        LiveBlindSigningReporter.getInstance(),
      );
    });

    it("exposes the same singleton via the liveBlindSigningReporter export", () => {
      expect(liveBlindSigningReporter).toBe(LiveBlindSigningReporter.getInstance());
    });
  });

  describe("context", () => {
    it("merges partial updates, preserving earlier keys", () => {
      reporter.setContext({ platform: "desktop", appVersion: "1.0.0" });
      reporter.setContext({ appVersion: "2.0.0", platformOS: "darwin" });

      expect(reporter.getContext()).toEqual({
        platform: "desktop",
        appVersion: "2.0.0",
        platformOS: "darwin",
      });
    });

    it("clears the context", () => {
      reporter.setContext({ platform: "mobile", sessionId: "abc" });
      reporter.clearContext();
      expect(reporter.getContext()).toEqual({});
    });
  });

  describe("consent", () => {
    it("defaults to false", () => {
      expect(reporter.hasConsent()).toBe(false);
    });

    it("reflects setConsent updates", () => {
      reporter.setConsent(true);
      expect(reporter.hasConsent()).toBe(true);
      reporter.setConsent(false);
      expect(reporter.hasConsent()).toBe(false);
    });

    it("reads consent lazily from setConsentSource on each call", () => {
      let flag = false;
      reporter.setConsentSource(() => flag);
      expect(reporter.hasConsent()).toBe(false);
      flag = true;
      expect(reporter.hasConsent()).toBe(true);
      flag = false;
      expect(reporter.hasConsent()).toBe(false);
    });
  });

  describe("report", () => {
    it("resolves to Right(undefined) and does not call any inner when no inner is set", async () => {
      const result = await reporter.report(makeParams());
      expect(result.isRight()).toBe(true);
      expect(result.extract()).toBeUndefined();
    });

    it("forwards params unchanged when consent is false", async () => {
      const inner = makeFakeInner();
      reporter.setInner(inner);
      reporter.setContext({ platform: "desktop", appVersion: "9.9.9" });

      const params = makeParams({ signatureId: "sig-no-consent" });
      await reporter.report(params);

      expect(inner.report).toHaveBeenCalledTimes(1);
      expect(inner.report).toHaveBeenCalledWith(params);
      const forwarded = inner.report.mock.calls[0][0];
      expect(forwarded).not.toHaveProperty("platform");
      expect(forwarded).not.toHaveProperty("appVersion");
    });

    it("merges context into params when consent is true", async () => {
      const inner = makeFakeInner();
      reporter.setInner(inner);
      reporter.setContext({
        platform: "mobile",
        appVersion: "1.2.3",
        platformOS: "ios",
        platformVersion: "18.0",
        sessionId: "session-42",
      });
      reporter.setConsent(true);

      const params = makeParams({ signatureId: "sig-consent" });
      await reporter.report(params);

      expect(inner.report).toHaveBeenCalledTimes(1);
      expect(inner.report).toHaveBeenCalledWith({
        ...params,
        platform: "mobile",
        appVersion: "1.2.3",
        platformOS: "ios",
        platformVersion: "18.0",
        sessionId: "session-42",
      });
    });

    it("propagates a Right result returned by the inner reporter", async () => {
      const inner = makeFakeInner(Right<void, Error>(undefined));
      reporter.setInner(inner);

      const result = await reporter.report(makeParams());

      expect(result.isRight()).toBe(true);
    });

    it("propagates a Left result returned by the inner reporter", async () => {
      const err = new Error("boom");
      const inner = makeFakeInner(Left<Error, void>(err));
      reporter.setInner(inner);

      const result = await reporter.report(makeParams());

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toBe(err);
    });
  });
});

describe("buildDefaultHttpBlindSigningReporter", () => {
  it("returns an object implementing BlindSigningReporter", () => {
    const built = buildDefaultHttpBlindSigningReporter("origin-token");
    expect(built).toBeTruthy();
    expect(typeof built.report).toBe("function");
  });

  it("accepts a custom appSource without throwing", () => {
    expect(() =>
      buildDefaultHttpBlindSigningReporter("origin-token", "custom-source"),
    ).not.toThrow();
  });
});
