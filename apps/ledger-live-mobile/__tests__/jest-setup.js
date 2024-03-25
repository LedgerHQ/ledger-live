import "@testing-library/jest-native/extend-expect";
import "@testing-library/react-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import "@mocks/console";
import { ALLOWED_UNHANDLED_REQUESTS } from "./handlers";
import { server } from "./server";
import { NativeModules } from "react-native";

// Needed for react-reanimated https://docs.swmansion.com/react-native-reanimated/docs/next/guide/testing/
jest.useFakeTimers();
jest.runAllTimers();

beforeAll(() =>
  server.listen({
    onUnhandledRequest(request, print) {
      if (ALLOWED_UNHANDLED_REQUESTS.some(ignoredUrl => request.url.includes(ignoredUrl))) {
        return;
      }
      print.warning();
    },
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

NativeModules.RNAnalytics = {};

const mockAnalytics = jest.genMockFromModule("@segment/analytics-react-native");

jest.mock("@segment/analytics-react-native", () => mockAnalytics);

// Mock of Native Modules
jest.mock("react-native-localize", () => ({
  getTimeZone: jest.fn(),
  getLocales: jest.fn(),
  getNumberFormatSettings: jest.fn(),
  getCalendar: jest.fn(),
  getCountry: jest.fn(),
  getTemperatureUnit: jest.fn(),
  getFirstWeekDay: jest.fn(),
  uses24HourClock: jest.fn(),
  findBestAvailableLanguage: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("react-native-version-number", () => ({
  appVersion: "1.0.0",
  buildVersion: "1",
}));

jest.mock("react-native-startup-time", () => ({
  getStartupTime: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({ useNetInfo: () => ({ isConnected: true }) }));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

jest.mock("@react-native-firebase/messaging", () => ({
  messaging: jest.fn(() => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve("myMockToken")),
  })),
  notifications: jest.fn(() => ({
    onNotification: jest.fn(),
    onNotificationDisplayed: jest.fn(),
  })),
  analytics: jest.fn(() => ({
    logEvent: jest.fn(),
  })),
}));

jest.mock("@braze/react-native-sdk", () => ({}));

const originalError = console.error;
const originalWarn = console.warn;

const EXCLUDED_ERRORS = [];

const EXCLUDED_WARNINGS = [];

console.error = (...args) => {
  const error = args.join();
  if (EXCLUDED_ERRORS.some(excluded => error.includes(excluded))) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  const warning = args.join();
  if (EXCLUDED_WARNINGS.some(excluded => warning.includes(excluded))) {
    return;
  }
  originalWarn.call(console, ...args);
};
