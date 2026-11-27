import { DatadogId } from "@domain/entity-client-identity";
import type { RumEvent } from "@datadog/electron-sdk";
import {
  __resetDatadogMainForTesting,
  beforeSendMain,
  bufferUncaughtErrorMain,
  captureExceptionMain,
  createDatadogMainState,
  initDatadogMain as initDatadogMainWithSettings,
  parseMainDatadogSettings,
  reportRenderProcessGoneMain,
  setUserIdMain,
  skipDatadogMain,
  startCrashReporterMain,
  syncTrackingConsentMain,
} from "./main";

// jest.config maps any "electron" module path to one mock, the SDK included: one factory serves both.
jest.mock("@datadog/electron-sdk", () => ({
  app: {
    once: jest.fn(),
    getPath: () =>
      jest.requireActual("path").join(jest.requireActual("os").tmpdir(), "lld-dd-dumps"),
  },
  crashReporter: { start: jest.fn() },
  init: jest.fn(),
  addError: jest.fn(),
  setTrackingConsent: jest.fn(),
  setUserInfo: jest.fn(),
  clearUserInfo: jest.fn(),
}));

jest.mock("./config", () => ({
  ...jest.requireActual("./config"),
  getDatadogBuildConfig: jest.fn(),
}));

jest.mock("./ignoreErrors", () => ({
  shouldIgnoreErrorMessage: jest.fn(() => false),
}));

jest.mock("./anonymizer", () => ({
  __esModule: true,
  default: {
    filepath: jest.fn((s: string) => s.replaceAll("/Users/john", "$HOME")),
    filepathRecursiveReplacer: jest.fn(function replace(obj: Record<string, unknown>) {
      for (const k in obj) {
        const v = obj[k];
        if (typeof v === "string") obj[k] = v.replaceAll("/Users/john", "$HOME");
        else if (v && typeof v === "object") replace(v as Record<string, unknown>);
      }
    }),
  },
}));

const { init, addError, setTrackingConsent, setUserInfo, clearUserInfo } =
  jest.requireMock("@datadog/electron-sdk");
const getDatadogBuildConfig = jest.mocked(jest.requireMock("./config").getDatadogBuildConfig);
const shouldIgnoreErrorMessage = jest.mocked(
  jest.requireMock("./ignoreErrors").shouldIgnoreErrorMessage,
);

const fullConfig = {
  applicationId: "app",
  clientToken: "token",
  site: "datadoghq.eu",
  service: "ledger-live-desktop",
  env: "production",
};

const errorEvent = (error: Record<string, unknown>) =>
  ({
    type: "error",
    view: { url: "app://main" },
    error,
  }) as unknown as RumEvent;
const asError = (event: RumEvent) => (event as unknown as { error: Record<string, unknown> }).error;

const GRANTED = () => "granted" as const;
const DEFAULT_SETTINGS = parseMainDatadogSettings(undefined);
const initDatadogMain = (consent: Parameters<typeof initDatadogMainWithSettings>[0]) =>
  initDatadogMainWithSettings(consent, DEFAULT_SETTINGS, () => undefined);

const deferredInit = () => {
  const deferred = { resolve: (_ok: boolean) => {}, reject: (_e: unknown) => {} };
  const promise = new Promise<boolean>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  init.mockImplementationOnce(() => promise);
  return deferred;
};

describe("datadog main", () => {
  beforeEach(() => {
    __resetDatadogMainForTesting();
    jest.clearAllMocks();
    shouldIgnoreErrorMessage.mockReturnValue(false);
    init.mockResolvedValue(true);
    getDatadogBuildConfig.mockReturnValue(fullConfig);
    Object.assign(globalThis, {
      __DATADOG_APPLICATION_ID__: "app",
      __DATADOG_CLIENT_TOKEN__: "token",
    });
  });

  describe("initDatadogMain failure paths", () => {
    it("returns false when config is missing", async () => {
      getDatadogBuildConfig.mockReturnValue({ ...fullConfig, clientToken: null });
      expect(await initDatadogMain(GRANTED)).toBe(false);
      expect(init).not.toHaveBeenCalled();
    });

    it("returns false when init resolves false", async () => {
      init.mockResolvedValueOnce(false);
      expect(await initDatadogMain(GRANTED)).toBe(false);
    });

    it("returns false when init throws", async () => {
      init.mockRejectedValueOnce(new Error("init failed"));
      expect(await initDatadogMain(GRANTED)).toBe(false);
    });
  });

  describe("initDatadogMain success", () => {
    it.each(["granted", "pending", "not-granted"] as const)(
      "inits the SDK pending, then applies consent %s, no renderer bridge and no telemetry",
      async consent => {
        expect(await initDatadogMain(() => consent)).toBe(true);
        expect(init).toHaveBeenCalledWith(
          expect.objectContaining({
            applicationId: "app",
            clientToken: "token",
            site: "datadoghq.eu",
            service: "ledger-live-desktop",
            env: "production",
            allowedRendererHosts: [],
            trackingConsent: "pending",
            beforeSendRum: beforeSendMain,
            telemetrySampleRate: 0,
          }),
        );
        expect(setTrackingConsent.mock.calls).toEqual(consent === "pending" ? [] : [[consent]]);
      },
    );

    it("passes the persisted flag session sampling", async () => {
      await initDatadogMainWithSettings(
        GRANTED,
        parseMainDatadogSettings({ enabled: true, sessionSampleRate: 10 }),
        () => undefined,
      );
      expect(init).toHaveBeenCalledWith(expect.objectContaining({ sessionSampleRate: 10 }));
    });

    it("dedupes concurrent calls into a single init()", async () => {
      const results = await Promise.all([
        initDatadogMain(GRANTED),
        initDatadogMain(GRANTED),
        initDatadogMain(GRANTED),
      ]);
      expect(results).toEqual([true, true, true]);
      expect(init).toHaveBeenCalledTimes(1);
    });

    it("returns true and skips re-init when already initialized", async () => {
      await initDatadogMain(GRANTED);
      init.mockClear();
      expect(await initDatadogMain(GRANTED)).toBe(true);
      expect(init).not.toHaveBeenCalled();
    });
  });

  describe("errors raised before init", () => {
    it("buffers from module load, before app ready, and replays with their capture time in context", async () => {
      const err = new Error("early");
      bufferUncaughtErrorMain(err);
      expect(addError).not.toHaveBeenCalled();
      await initDatadogMain(GRANTED);
      expect(addError).toHaveBeenCalledWith(err, {
        context: { captured_at: expect.any(Number), uncaught: true },
      });
    });

    it("queues a capture that arrives while init is pending, then flushes it once init resolves", async () => {
      const deferred = deferredInit();
      const initP = initDatadogMain(GRANTED);
      const err = new Error("boom");
      captureExceptionMain(err);
      expect(addError).not.toHaveBeenCalled();
      deferred.resolve(true);
      await initP;
      expect(addError).toHaveBeenCalledWith(err, { context: { captured_at: expect.any(Number) } });
    });

    it("drops queued captures if init ultimately fails, and stops buffering", async () => {
      const deferred = deferredInit();
      const initP = initDatadogMain(GRANTED);
      captureExceptionMain(new Error("boom"));
      deferred.reject(new Error("network down"));
      await initP;
      captureExceptionMain(new Error("after"));
      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe("after init", () => {
    beforeEach(async () => {
      await initDatadogMain(GRANTED);
    });

    it("captureExceptionMain forwards to addError", () => {
      const err = new Error("boom");
      captureExceptionMain(err);
      expect(addError).toHaveBeenCalledWith(err, { context: { captured_at: expect.any(Number) } });
    });

    it("bufferUncaughtErrorMain leaves uncaught errors to the SDK once initialized", () => {
      bufferUncaughtErrorMain(new Error("boom"));
      expect(addError).not.toHaveBeenCalled();
    });

    it("never throws when addError itself throws (called from uncaughtException, which Node does not protect)", () => {
      addError.mockImplementationOnce(() => {
        throw new Error("addError blew up");
      });
      expect(() => captureExceptionMain(new Error("boom"))).not.toThrow();
    });
  });

  it("keeps buffering uncaught errors while init() runs, so none is lost before the SDK listens", async () => {
    const deferred = deferredInit();
    const initP = initDatadogMain(GRANTED);
    const err = new Error("during init");
    bufferUncaughtErrorMain(err);
    deferred.resolve(true);
    await initP;
    expect(addError).toHaveBeenCalledWith(err, expect.anything());
  });

  describe("parseMainDatadogSettings", () => {
    it("leaves every setting unknown when nothing was persisted", () => {
      expect(parseMainDatadogSettings(undefined)).toEqual({
        enabled: undefined,
        sessionSampleRate: undefined,
        profilingSampleRate: undefined,
      });
    });

    it("drops invalid values, as an out-of-range rate would abort init()", () => {
      expect(
        parseMainDatadogSettings({
          enabled: "yes",
          sessionSampleRate: 101,
          profilingSampleRate: -1,
        }),
      ).toEqual({
        enabled: undefined,
        sessionSampleRate: undefined,
        profilingSampleRate: undefined,
      });
    });

    it("keeps the profiling rate the renderer persisted", () => {
      expect(parseMainDatadogSettings({ enabled: true, profilingSampleRate: 25 })).toMatchObject({
        profilingSampleRate: 25,
      });
    });
  });

  it("drops buffered errors and stops buffering when this launch will not init", async () => {
    bufferUncaughtErrorMain(new Error("early"));
    skipDatadogMain();
    bufferUncaughtErrorMain(new Error("later"));
    await initDatadogMain(GRANTED);
    expect(addError).not.toHaveBeenCalled();
  });

  it("attaches the user before replaying the errors buffered before init", async () => {
    bufferUncaughtErrorMain(new Error("early"));
    await initDatadogMainWithSettings(GRANTED, DEFAULT_SETTINGS, () =>
      DatadogId.fromString("datadog-id"),
    );
    expect(setUserInfo.mock.invocationCallOrder[0]).toBeLessThan(
      addError.mock.invocationCallOrder[0],
    );
  });

  it("deletes the crash dumps of a launch that will not init, so a later opt-in cannot upload them", () => {
    const fs = jest.requireActual("fs");
    const dumps = jest.requireMock("@datadog/electron-sdk").app.getPath();
    fs.mkdirSync(dumps, { recursive: true });
    fs.writeFileSync(`${dumps}/crash.dmp`, "");
    skipDatadogMain();
    expect(fs.existsSync(`${dumps}/crash.dmp`)).toBe(false);
    expect(jest.requireMock("@datadog/electron-sdk").app.once).toHaveBeenCalledWith(
      "will-quit",
      expect.any(Function),
    );
  });

  describe("startCrashReporterMain", () => {
    const { crashReporter } = jest.requireMock("@datadog/electron-sdk");
    beforeEach(() => {
      crashReporter.start = jest.fn();
    });

    it("starts it before any window with the SDK's options, then makes the SDK's own start a no-op", () => {
      const start = crashReporter.start;
      startCrashReporterMain();
      crashReporter.start({});
      expect(start).toHaveBeenCalledTimes(1);
      expect(start).toHaveBeenCalledWith({ uploadToServer: false, ignoreSystemCrashHandler: true });
    });

    it("leaves it off in builds without Datadog config", () => {
      const start = crashReporter.start;
      Object.assign(globalThis, { __DATADOG_APPLICATION_ID__: null });
      startCrashReporterMain();
      expect(start).not.toHaveBeenCalled();
    });
  });

  describe("syncTrackingConsentMain", () => {
    it("does nothing before init", () => {
      syncTrackingConsentMain();
      expect(setTrackingConsent).not.toHaveBeenCalled();
    });

    it("deletes only the dump files on a consent change, keeping Crashpad's database", async () => {
      const fs = jest.requireActual("fs");
      const dumps = jest.requireMock("@datadog/electron-sdk").app.getPath();
      let consent: "granted" | "not-granted" = "granted";
      await initDatadogMain(() => consent);
      fs.mkdirSync(`${dumps}/completed`, { recursive: true });
      fs.writeFileSync(`${dumps}/completed/crash.dmp`, "");
      fs.writeFileSync(`${dumps}/settings.dat`, "");
      syncTrackingConsentMain();
      expect(fs.existsSync(`${dumps}/completed/crash.dmp`)).toBe(true);
      consent = "not-granted";
      syncTrackingConsentMain();
      expect(fs.existsSync(`${dumps}/completed/crash.dmp`)).toBe(false);
      expect(fs.existsSync(`${dumps}/settings.dat`)).toBe(true);
    });

    it("follows the consent callback after init", async () => {
      let consent: "granted" | "pending" | "not-granted" = "pending";
      await initDatadogMain(() => consent);
      consent = "not-granted";
      syncTrackingConsentMain();
      expect(setTrackingConsent).toHaveBeenLastCalledWith("not-granted");
      consent = "granted";
      syncTrackingConsentMain();
      expect(setTrackingConsent).toHaveBeenLastCalledWith("granted");
    });

    it("applies a consent change that happened while init() was in flight", async () => {
      let consent: "granted" | "not-granted" = "granted";
      const deferred = deferredInit();
      const initP = initDatadogMain(() => consent);
      consent = "not-granted";
      deferred.resolve(true);
      await initP;
      expect(setTrackingConsent).toHaveBeenLastCalledWith("not-granted");
    });

    it("keeps the dumps when init() leaves pending for granted", async () => {
      const fs = jest.requireActual("fs");
      const dumps = jest.requireMock("@datadog/electron-sdk").app.getPath();
      fs.mkdirSync(`${dumps}/completed`, { recursive: true });
      fs.writeFileSync(`${dumps}/completed/crash.dmp`, "");
      await initDatadogMain(() => "granted");
      expect(setTrackingConsent).toHaveBeenLastCalledWith("granted");
      expect(fs.existsSync(`${dumps}/completed/crash.dmp`)).toBe(true);
    });
  });

  describe("setUserIdMain", () => {
    it("does nothing when not initialized", () => {
      setUserIdMain(DatadogId.fromString("datadog-id"));
      expect(setUserInfo).not.toHaveBeenCalled();
    });

    it("forwards the DatadogId to the SDK once initialized", async () => {
      await initDatadogMain(GRANTED);
      setUserIdMain(DatadogId.fromString("datadog-id"));
      expect(setUserInfo).toHaveBeenCalledWith({ id: "datadog-id" });
    });

    it("clears the user the SDK kept from an earlier launch when the id is gone", async () => {
      await initDatadogMain(GRANTED);
      setUserIdMain(undefined);
      expect(clearUserInfo).toHaveBeenCalled();
    });
  });

  describe("beforeSendMain", () => {
    beforeEach(async () => {
      await initDatadogMain(GRANTED);
    });

    it("drops ignored error messages, scrubbing them first as crash events cannot be discarded", () => {
      shouldIgnoreErrorMessage.mockReturnValue(true);
      const event = errorEvent({ message: "ignored at /Users/john/app", is_crash: true });
      expect(beforeSendMain(event, { source: "main" })).toBe(false);
      expect(asError(event).message).toBe("ignored at $HOME/app");
    });

    it("anonymizes message and stack, rewriting asar frames to the '@' shape Datadog unminifies", () => {
      const event = errorEvent({
        message: "failure at /Users/john/app",
        stack: [
          "Error: boom",
          "    at run (/Applications/Ledger Wallet.app/Contents/Resources/app.asar/.webpack/main.bundle.js:1:2)",
        ].join("\n"),
      });
      expect(beforeSendMain(event, { source: "main" })).toBe(true);
      expect(asError(event)).toEqual(
        expect.objectContaining({
          message: "failure at $HOME/app",
          stack: "Error: boom\n    at run @ https://app.asar/.webpack/main.bundle.js:1:2",
        }),
      );
    });

    it("redacts identifiers in resource, failed request and execution context URLs", () => {
      const resource = {
        type: "resource",
        view: { url: "app://main" },
        resource: {
          url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/address/0xFoo/txs",
        },
        execution_context: { name: "https://partner.example/address/0xFoo" },
      } as unknown as RumEvent;
      const failed = errorEvent({
        message: "Network error",
        resource: { url: "https://api.ledger.com/ens/reverse-resolve/0xFoo" },
      });
      beforeSendMain(resource, { source: "main" });
      beforeSendMain(failed, { source: "main" });
      expect(resource).toEqual(
        expect.objectContaining({
          resource: {
            url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/address/[redacted]/txs",
          },
          execution_context: { name: "https://partner.example/address/[redacted]" },
        }),
      );
      expect(asError(failed).resource).toEqual({
        url: "https://api.ledger.com/ens/reverse-resolve/[redacted]",
      });
    });

    it("scrubs a main event that carries no view, instead of dropping it", () => {
      const event = {
        type: "error",
        error: { message: "at /Users/john/app" },
      } as unknown as RumEvent;
      expect(beforeSendMain(event, { source: "main" })).toBe(true);
      expect(asError(event).message).toBe("at $HOME/app");
    });

    it("tags the process and git commit, and anonymizes the context", () => {
      const event = errorEvent({ message: "boom" });
      (event as unknown as { context: Record<string, unknown> }).context = {
        path: "/Users/john/x",
      };
      beforeSendMain(event, { source: "utility" });
      expect(event.context).toEqual(
        expect.objectContaining({ path: "$HOME/x", process: "utility" }),
      );
    });

    it("blanks an id nested in the context, as only schema fields of the event stay", () => {
      shouldIgnoreErrorMessage.mockImplementationOnce(() => {
        throw new Error("scrub failed");
      });
      const event = errorEvent({ message: "m", source: "source" });
      (event as unknown as { context: unknown }).context = { file: { id: "/Users/john/x" } };
      beforeSendMain(event, { source: "main" });
      expect(event.context).toEqual({ file: { id: "" } });
      expect(asError(event).source).toBe("source");
    });

    it("blanks every string but schema fields, and drops the event, when scrubbing throws", () => {
      shouldIgnoreErrorMessage.mockImplementationOnce(() => {
        throw new Error("scrub failed");
      });
      const event = errorEvent({
        message: "at /Users/john/app",
        stack: "s",
        causes: [{ message: "/Users/john" }],
      });
      expect(beforeSendMain(event, { source: "main" })).toBe(false);
      expect(event).toEqual({
        type: "error",
        view: { url: "" },
        error: { message: "", stack: "", causes: [{ message: "" }] },
      });
    });
  });

  describe("boot state", () => {
    const fs = jest.requireActual("fs");
    const gateDir = (gate?: object) => {
      const dir = fs.mkdtempSync(`${jest.requireActual("os").tmpdir()}/lld-dd-`);
      if (gate) fs.writeFileSync(`${dir}/datadog-gate.json`, JSON.stringify(gate));
      return dir;
    };

    it.each([
      [undefined, "not-granted"],
      [{ lldDatadog: { enabled: true } }, "granted"],
      [{ lldDatadog: { enabled: true }, crashReporting: false }, "not-granted"],
      [{ crashReporting: true }, "not-granted"],
    ])("derives the boot consent from the gate %j: %s", (gate, consent) => {
      expect(createDatadogMainState(gateDir(gate)).consent()).toBe(consent);
    });

    it.each([
      [{ lldDatadog: { enabled: true, profilingSampleRate: 10 } }, true],
      [{ lldDatadog: { enabled: true, profilingSampleRate: 0 } }, false],
      [{ lldDatadog: { enabled: true } }, false],
      [{ lldDatadog: { enabled: false, profilingSampleRate: 10 } }, false],
      [{ lldDatadog: { enabled: true, profilingSampleRate: 10 }, crashReporting: false }, false],
    ])("profiles the renderer from the gate %j: %s", (gate, profiles) => {
      expect(createDatadogMainState(gateDir(gate)).profilesRenderer()).toBe(profiles);
    });

    it("follows the renderer's writes and keeps them in the gate for the next boot", () => {
      const dir = gateDir({ lldDatadog: { enabled: true } });
      const state = createDatadogMainState(dir);
      state.onAppKeyWritten("settings.crashReporting", false);
      expect(state.consent()).toBe("not-granted");
      expect(createDatadogMainState(dir).consent()).toBe("not-granted");
      state.onAppKeyWritten("settings.crashReporting", true);
      state.onAppKeyWritten("lldDatadog", { enabled: false });
      expect(state.consent()).toBe("not-granted");
      state.onAppKeyWritten("identities", { datadogId: "datadog-id" });
      expect(state.user()?.exportDatadogIdForElectronMain()).toBe("datadog-id");
    });
  });

  it("reports app window renderer crashes only", async () => {
    await initDatadogMain(GRANTED);
    reportRenderProcessGoneMain("webview", { reason: "crashed", exitCode: 11 });
    reportRenderProcessGoneMain("window", { reason: "killed", exitCode: 9 });
    reportRenderProcessGoneMain("window", { reason: "crashed", exitCode: 11 });
    expect(addError).toHaveBeenCalledTimes(1);
    expect(addError.mock.calls[0][0].message).toBe("render-process-gone: crashed (exit 11)");
  });
});
