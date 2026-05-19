import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";
import mockGorhomBottomSheet from "@gorhom/bottom-sheet/mock";

// eslint-disable-next-line @typescript-eslint/no-require-imports
expect.extend(require("@testing-library/react-native/matchers"));

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

// Same as apps/ledger-live-mobile/__tests__/jest-setup.js:221
jest.mock("@gorhom/bottom-sheet", () => mockGorhomBottomSheet);

// Same as apps/ledger-live-mobile/__tests__/jest-setup.js:236-241
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("react-native-reanimated").setUpTests();

// Same as apps/ledger-live-mobile/__tests__/jest-setup.js:98-114
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
