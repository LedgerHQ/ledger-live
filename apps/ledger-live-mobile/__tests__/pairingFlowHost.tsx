import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactTestInstance } from "react-test-renderer";
import { screen } from "@tests/test-renderer";

/**
 * Helpers to test that a screen hosting SelectDevice2 keeps the real BLE pairing flow
 * above the system navigation bar (LIVE-42049).
 */

type User = { press: (element: ReactTestInstance) => Promise<void> };
type RenderHost = () => { user: User; unmount: () => void };

export const BOTTOM_INSET = 48;

let bottomInset = 0;

function setBottomInset(bottom: number) {
  bottomInset = bottom;
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, right: 0, bottom, left: 0 });
}

/** Sums the bottom padding of the native views wrapping an element, a native bottom safe-area edge counting as the inset. */
function getBottomPaddingAbove(element: ReactTestInstance): number {
  let total = 0;
  let node = element.parent;
  while (node) {
    if (typeof node.type === "string") {
      const paddingBottom = StyleSheet.flatten(node.props.style)?.paddingBottom;
      if (typeof paddingBottom === "number") total += paddingBottom;
      if (node.props.edges?.bottom === "additive") total += bottomInset;
    }
    node = node.parent;
  }
  return total;
}

async function openPairingFlow(user: User) {
  await user.press(await screen.findByTestId("connect-with-bluetooth"));
  await user.press(await screen.findByTestId("manager_connect_device"));
  return screen.findByText("Looking for devices");
}

/** Bottom space the host adds around the pairing flow: its padding with the inset minus without it. */
export async function getPairingFlowBottomInset(renderHost: RenderHost): Promise<number> {
  const measure = async (bottom: number) => {
    setBottomInset(bottom);
    const { user, unmount } = renderHost();
    const padding = getBottomPaddingAbove(await openPairingFlow(user));
    unmount();
    return padding;
  };
  const withoutInset = await measure(0);
  return (await measure(BOTTOM_INSET)) - withoutInset;
}

/** Bottom padding the device list gains after the pairing flow is opened then closed. */
export async function getDeviceListPaddingChangeAfterPairing(
  renderHost: RenderHost,
): Promise<number> {
  setBottomInset(BOTTOM_INSET);
  const { user } = renderHost();
  const before = getBottomPaddingAbove(await screen.findByTestId("connect-with-bluetooth"));

  await openPairingFlow(user);
  await user.press(screen.getByTestId("navigation-header-back-button"));

  return getBottomPaddingAbove(await screen.findByTestId("connect-with-bluetooth")) - before;
}
