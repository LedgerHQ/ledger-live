import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { useModularDrawerController } from "../hooks/useModularDrawerController";
import { ModularDrawerWrapper } from "../ModularDrawerWrapper";

function DrawerTestApp() {
  const { openDrawer } = useModularDrawerController();

  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => openDrawer({ flow: "add_account" })}>
        <Text>Open drawer</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          openDrawer({
            completionMode: "currency",
            presentation: "embedded",
            onCurrencySelected: jest.fn(),
          })
        }
      >
        <Text>Open embedded drawer</Text>
      </Pressable>
      <ModularDrawerWrapper />
    </>
  );
}

describe("ModularDrawerWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should keep rendering the global drawer for the default presentation", async () => {
    const { store, user } = render(<DrawerTestApp />);

    await user.press(screen.getByRole("button", { name: "Open drawer" }));

    expect(store.getState().modularDrawer.isOpen).toBe(true);
    expect(store.getState().modularDrawer.presentation).toBe("drawer");
    expect(screen.getByTestId("modular-drawer-flow-view")).toBeVisible();
  });

  it("should not render the global drawer for embedded presentation", async () => {
    const { store, user } = render(<DrawerTestApp />);

    await user.press(screen.getByRole("button", { name: "Open embedded drawer" }));

    expect(store.getState().modularDrawer.isOpen).toBe(true);
    expect(store.getState().modularDrawer.presentation).toBe("embedded");
    expect(screen.queryByTestId("modular-drawer-flow-view")).toBeNull();
  });
});
