import { renderHook } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_NAVIGATOR_ID, NavigatorName } from "~/const";
import { useEarnIntentFlowPresentation } from "./useEarnIntentFlowPresentation";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(),
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const DEPOSIT_URL = "https://earn.test/v2/android/deposit?intent=deposit&uiVersion=v4";
const DASHBOARD_URL = "https://earn.test/v2/android/homescreen?uiVersion=v4";

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
const mockGetParent = jest.fn(() => ({ setOptions: mockSetOptions }));
const mockedUseNavigation = jest.mocked(useNavigation);

type PresentationProps = Parameters<typeof useEarnIntentFlowPresentation>[0];

const renderPresentation = (webviewUrl?: string, webviewUrlRef = { current: webviewUrl }) =>
  renderHook((props: PresentationProps) => useEarnIntentFlowPresentation(props), {
    initialProps: {
      hideMainNavigator: true,
      webviewUrl,
      webviewUrlRef,
      canvasColor: "#000000",
    },
  });

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetOptions.mockClear();
  mockGetParent.mockClear();
  mockedUseNavigation.mockReturnValue({
    navigate: mockNavigate,
    getParent: mockGetParent,
  } as never);
});

describe("useEarnIntentFlowPresentation", () => {
  it("syncs the Base navigator header for the current webview intent", () => {
    renderPresentation(DEPOSIT_URL);

    expect(mockGetParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
    const options = mockSetOptions.mock.calls.at(-1)?.[0];
    expect(options).toEqual(expect.objectContaining({ headerShown: true, closable: false }));
    // Deposit header has a title and, unlike the simulate intent, no canvas headerStyle.
    expect(options.headerTitle).toBeTruthy();
    expect(options.headerStyle).toBeUndefined();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not touch presentation outside the intent flow (hideMainNavigator false)", () => {
    renderHook((props: PresentationProps) => useEarnIntentFlowPresentation(props), {
      initialProps: {
        hideMainNavigator: false,
        webviewUrl: DASHBOARD_URL,
        webviewUrlRef: { current: DASHBOARD_URL },
        canvasColor: "#000000",
      },
    });

    expect(mockSetOptions).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  describe("debounced return to the Earn tab", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("returns to the Earn tab when the webview stays on a non-intent route", () => {
      renderPresentation(DASHBOARD_URL);

      expect(mockNavigate).not.toHaveBeenCalled();
      jest.advanceTimersByTime(500);

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
        screen: NavigatorName.Earn,
      });
    });

    it("cancels the return when the webview is back on an intent route before the debounce fires", () => {
      // Transient dashboard URL seen mid-transition (e.g. simulate → deposit): the scheduled exit
      // must re-check the live URL at fire time and abort, rather than bouncing to the Earn tab.
      const webviewUrlRef = { current: DASHBOARD_URL };
      renderPresentation(DASHBOARD_URL, webviewUrlRef);

      webviewUrlRef.current = DEPOSIT_URL;
      jest.advanceTimersByTime(500);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
