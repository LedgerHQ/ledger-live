import "@testing-library/jest-native/extend-expect";

// Needed for react-reanimated https://docs.swmansion.com/react-native-reanimated/docs/next/guide/testing/
jest.useFakeTimers();
jest.runAllTimers();

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

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: jest.fn(),
  ScrollView: jest.fn(),
  RectButton: jest.fn(),
  TouchableOpacity: jest.fn(),
  TouchableWithoutFeedback: jest.fn(),
  TouchableHighlight: jest.fn(),
  Swipeable: jest.fn(),
}));

jest.mock("react-native-version-number", () => ({
  appVersion: "1.0.0",
  buildVersion: "1",
}));

jest.mock("react-native-startup-time", () => ({
  getStartupTime: jest.fn(),
}));

const originalError = console.error;
const originalWarn = console.warn;

const EXCLUDED_ERRORS = [
  "ViewPropTypes will be removed from React Native, along with all other PropTypes.",
];

const EXCLUDED_WARNINGS = ["Using an insecure random number generator"];

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
