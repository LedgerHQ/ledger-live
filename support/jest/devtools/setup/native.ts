// React Native setup shared by the devtools packages' native test projects.
// Mirrors apps/ledger-live-mobile/__tests__/jest-setup.js for the parts devtools needs.

import * as matchers from "@testing-library/react-native/matchers";
import { setUpTests } from "react-native-reanimated";
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";
import mockGorhomBottomSheet from "@gorhom/bottom-sheet/mock";

expect.extend(matchers);

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

jest.mock("@gorhom/bottom-sheet", () => mockGorhomBottomSheet);

setUpTests();

// expo-haptics is mocked through moduleNameMapper (mocks/expo-haptics.ts), not here — see the
// comment in that file.

const originalError = console.error;

const EXCLUDED_ERRORS = ["act(...)"];

console.error = (...args) => {
  if (EXCLUDED_ERRORS.some(excluded => args.join().includes(excluded))) return;
  originalError.call(console, ...args);
};
