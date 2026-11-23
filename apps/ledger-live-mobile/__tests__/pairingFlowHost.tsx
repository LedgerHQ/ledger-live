import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactTestInstance } from "react-test-renderer";
import { act } from "@tests/test-renderer";
import type { SetHeaderOptionsRequest } from "~/components/SelectDevice2";

/**
 * Helpers to test a screen hosting SelectDevice2 while it shows the BLE pairing flow.
 * Usage: jest.mock("~/components/SelectDevice2", () => jest.requireActual("@tests/pairingFlowHost").selectDevice2Mock);
 */

export const BOTTOM_INSET = 48;
export const SELECT_DEVICE_TEST_ID = "select-device-2";

let requestToSetHeaderOptions: ((request: SetHeaderOptionsRequest) => void) | undefined;

export const selectDevice2Mock = {
  __esModule: true,
  default: (props: { requestToSetHeaderOptions: (request: SetHeaderOptionsRequest) => void }) => {
    requestToSetHeaderOptions = props.requestToSetHeaderOptions;
    return <View testID={SELECT_DEVICE_TEST_ID} />;
  },
};

export function mockBottomInset() {
  jest
    .mocked(useSafeAreaInsets)
    .mockReturnValue({ top: 0, right: 0, bottom: BOTTOM_INSET, left: 0 });
}

export function openPairingFlow() {
  act(() =>
    requestToSetHeaderOptions?.({
      type: "set",
      options: { headerLeft: () => null, headerRight: () => null },
    }),
  );
}

export function closePairingFlow() {
  act(() => requestToSetHeaderOptions?.({ type: "clean" }));
}

/** Sums the bottom padding of the native views wrapping an element (composites are skipped: they repeat their host style). */
export function getBottomPaddingAbove(element: ReactTestInstance): number {
  let total = 0;
  let node = element.parent;
  while (node) {
    const paddingBottom =
      typeof node.type === "string" ? StyleSheet.flatten(node.props.style)?.paddingBottom : 0;
    if (typeof paddingBottom === "number") total += paddingBottom;
    node = node.parent;
  }
  return total;
}
