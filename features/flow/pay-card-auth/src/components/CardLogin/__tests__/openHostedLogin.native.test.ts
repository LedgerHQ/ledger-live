import { openAuthSessionAsync } from "expo-web-browser";
import { AppState, type AppStateStatus } from "react-native";
import { openHostedUrlInSecureBrowser } from "../openHostedLogin.native";

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

const mockedOpenAuthSessionAsync = jest.mocked(openAuthSessionAsync);

const loginUrl =
  "https://card.example.com/login?request=opaque%2Bvalue&redirect_uri=ledgerlive%3A%2F%2Fpaytab";
const deepLink = "ledgerlive://paytab";

let changeListeners: ((state: AppStateStatus) => void)[] = [];
const remove = jest.fn();

const setAppState = (state: AppStateStatus) => Object.assign(AppState, { currentState: state });
const becomeActive = () => {
  setAppState("active");
  changeListeners.forEach(listener => listener("active"));
};

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("openHostedUrlInSecureBrowser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    changeListeners = [];
    setAppState("active");
    jest.spyOn(AppState, "addEventListener").mockImplementation(((
      _type: string,
      listener: (state: AppStateStatus) => void,
    ) => {
      changeListeners.push(listener);
      return { remove };
    }) as typeof AppState.addEventListener);
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: deepLink });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should open straight away while the app is active", async () => {
    await openHostedUrlInSecureBrowser(loginUrl, deepLink);

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener).not.toHaveBeenCalled();
  });

  it("should hold the browser until the app is active again", async () => {
    jest.useFakeTimers();
    setAppState("inactive");

    const opening = openHostedUrlInSecureBrowser(loginUrl, deepLink);
    jest.advanceTimersByTime(2_500);
    await flush();

    expect(mockedOpenAuthSessionAsync).not.toHaveBeenCalled();

    becomeActive();
    await opening;

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalled();
  });

  it("should stop waiting after a bound, so an event that never comes cannot hang the login", async () => {
    jest.useFakeTimers();
    setAppState("inactive");

    const opening = openHostedUrlInSecureBrowser(loginUrl, deepLink);
    jest.advanceTimersByTime(4_999);
    await flush();

    expect(mockedOpenAuthSessionAsync).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await opening;

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalled();
  });

  it("should open the exact hosted login URL in the secure auth browser", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: deepLink });

    await openHostedUrlInSecureBrowser(loginUrl, deepLink);

    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledWith(loginUrl, deepLink, {
      createTask: false,
    });
  });

  it("should report the redirect the session ended on", async () => {
    const callbackUrl = `${deepLink}?code=auth-code&state=state-value`;
    mockedOpenAuthSessionAsync.mockResolvedValue({ type: "success", url: callbackUrl });

    await expect(openHostedUrlInSecureBrowser(loginUrl, deepLink)).resolves.toEqual({
      type: "success",
      url: callbackUrl,
    });
  });

  // The whole non-success half of `WebBrowserAuthSessionResult`. `openAuthSessionAsync` never answers
  // `opened`: Android races the deep link against a browser wait, and the Android polyfill turns that
  // internal `opened` into the wait itself, then answers `dismiss`. The type still permits the value,
  // because `WebBrowserResult` also serves the plain browser, so the mapping covers it.
  it.each(["cancel", "dismiss", "opened", "locked"] as const)(
    "should report a dismissal when the session ends with %s",
    async type => {
      mockedOpenAuthSessionAsync.mockResolvedValue({
        type,
      } as Awaited<ReturnType<typeof openAuthSessionAsync>>);

      await expect(openHostedUrlInSecureBrowser(loginUrl, deepLink)).resolves.toEqual({
        type: "dismissed",
      });
    },
  );
});
