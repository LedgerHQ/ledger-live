/**
 * Minimal stand-in for `@gorhom/bottom-sheet` in this package's native tests.
 *
 * The real module reaches for `react-native-gesture-handler`, which this package does not install,
 * and the mock gorhom ships is untransformed JSX inside `node_modules`.
 *
 * `useBottomSheetInternal` returns `null` — the "not inside a sheet" answer — because nothing here
 * mounts a real sheet provider. Tests that need the keyboard wiring to actually run should
 * `jest.mock` the module themselves with a fake they control.
 */
const useBottomSheetInternal = () => null;

const close = jest.fn();
const useBottomSheet = () => ({ close });

// gorhom positions the real footer with reanimated; here it is just its children.
const BottomSheetFooter = ({ children }) => children;

const KEYBOARD_STATUS = { UNDETERMINED: 0, SHOWN: 1, HIDDEN: 2 };

module.exports = { useBottomSheetInternal, BottomSheetFooter, useBottomSheet, KEYBOARD_STATUS };
