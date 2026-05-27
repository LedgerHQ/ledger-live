import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { render, screen } from "@tests/test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { State } from "~/reducers/types";
import DebugContentCards from ".";

const Stack = createNativeStackNavigator();

function DebugContentCardsTestScreen() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DebugContentCards" component={DebugContentCards} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}

const withExistingBrazeCard = (state: State): State => ({
  ...state,
  genericAwarenessModal: {
    ...state.genericAwarenessModal,
    contentCards: [
      {
        id: "braze-card",
        layout: GenericAwarenessModalLayout.Carousel,
        data: [],
      },
    ],
  },
});

describe("DebugContentCards", () => {
  it("should create, list, and open generic awareness modal cards", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />, {
      overrideInitialState: withExistingBrazeCard,
    });

    expect(screen.getByText("Existing generic awareness modals")).toBeOnTheScreen();
    expect(screen.getByText("braze-card")).toBeOnTheScreen();

    await user.press(screen.getAllByText("Create Carousel Generic Awareness Modal")[0]);
    await user.press(screen.getByText("Create generic awareness modal"));

    const stateAfterCreate = store.getState();
    expect(stateAfterCreate.genericAwarenessModal.contentCards).toHaveLength(2);
    expect(stateAfterCreate.genericAwarenessModal.contentCards[0].id).toBe("braze-card");
    const campaignId = stateAfterCreate.genericAwarenessModal.contentCards[1].id;
    expect(campaignId).toBe("app_start_debug_generic_awareness_carousel");

    expect(screen.getByText(campaignId)).toBeOnTheScreen();
    await user.press(screen.getByText(campaignId));

    expect(store.getState().genericAwarenessModal).toMatchObject({
      isOpen: true,
      campaignId,
    });
  });
});
