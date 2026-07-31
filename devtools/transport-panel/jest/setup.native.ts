import * as matchers from "@testing-library/react-native/matchers";
import { setUpTests } from "react-native-reanimated";
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";
import mockGorhomBottomSheet from "@gorhom/bottom-sheet/mock";

expect.extend(matchers);

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);
jest.mock("@gorhom/bottom-sheet", () => mockGorhomBottomSheet);

setUpTests();

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
    Soft: "soft",
    Rigid: "rigid",
  },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

const originalError = console.error;
const EXCLUDED_ERRORS = ["act(...)"];
console.error = (...args) => {
  if (EXCLUDED_ERRORS.some(excluded => args.join().includes(excluded))) return;
  originalError.call(console, ...args);
};
