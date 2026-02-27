import { initSentryAndDatadogFromDb } from "./initSentryAndDatadog";

const sentryMock = jest.fn();
const initDatadogMainMock = jest.fn();

jest.mock("~/sentry/main", () => ({
  __esModule: true,
  default: (...args: unknown[]) => sentryMock(...args),
}));
jest.mock("~/datadog/main", () => ({
  initDatadogMain: (...args: unknown[]) => initDatadogMainMock(...args),
}));

describe("initSentryAndDatadogFromDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls sentry and initDatadogMain when identities.datadogId is set", () => {
    const getShouldSend = () => true;
    const user = { id: "legacy-user-id" };
    const identities = { datadogId: "dd-id-from-identities", userId: "u", deviceIds: [] };

    initSentryAndDatadogFromDb(getShouldSend, user, identities);

    expect(sentryMock).toHaveBeenCalledTimes(1);
    expect(sentryMock).toHaveBeenCalledWith(getShouldSend, "dd-id-from-identities");
    expect(initDatadogMainMock).toHaveBeenCalledTimes(1);
    expect(initDatadogMainMock).toHaveBeenCalledWith(getShouldSend, "dd-id-from-identities");
  });

  it("uses user.datadogId when identities has no datadogId", () => {
    const getShouldSend = () => false;
    const user = { id: "legacy-id", datadogId: "dd-id-on-user" };
    const identities = { userId: "u", deviceIds: [] };

    initSentryAndDatadogFromDb(getShouldSend, user, identities);

    expect(sentryMock).toHaveBeenCalledWith(getShouldSend, "dd-id-on-user");
    expect(initDatadogMainMock).toHaveBeenCalledWith(getShouldSend, "dd-id-on-user");
  });

  it("calls neither when no datadogId", () => {
    initSentryAndDatadogFromDb(() => true, { id: "legacy-only" }, undefined);

    expect(sentryMock).not.toHaveBeenCalled();
    expect(initDatadogMainMock).not.toHaveBeenCalled();
  });

  it("calls neither when no user id nor datadogId", () => {
    initSentryAndDatadogFromDb(() => true, undefined, undefined);

    expect(sentryMock).not.toHaveBeenCalled();
    expect(initDatadogMainMock).not.toHaveBeenCalled();
  });

  it("skips dummy datadogId and calls neither", () => {
    const identities = {
      datadogId: "00000000-0000-0000-0000-000000000000",
      userId: "u",
      deviceIds: [],
    };

    initSentryAndDatadogFromDb(() => true, { id: "real-user-123" }, identities);

    expect(sentryMock).not.toHaveBeenCalled();
    expect(initDatadogMainMock).not.toHaveBeenCalled();
  });

  it("passes getShouldSend so callback can read current value when invoked", () => {
    let sentryLogs = true;
    const getShouldSend = () => sentryLogs;
    const identities = { datadogId: "dd" };

    initSentryAndDatadogFromDb(getShouldSend, null, identities);

    const shouldSend = sentryMock.mock.calls[0]?.[0];
    expect(typeof shouldSend).toBe("function");
    expect(shouldSend()).toBe(true);
    sentryLogs = false;
    expect(shouldSend()).toBe(false);
  });
});
