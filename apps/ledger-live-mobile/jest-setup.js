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
