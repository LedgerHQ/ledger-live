import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import CompletionScreen from "../CompletionScreen";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { createStackNavigator } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";

const mockedDevice: Device = {
  deviceName: "europa",
  deviceId: "1",
  wired: true,
  modelId: DeviceModelId.europa,
};

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
  getParent: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  getId: jest.fn(),
  getState: jest.fn(),
  setOptions: jest.fn(),
};

const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding: false,
    },
  }),
};

const REBORN_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding: true,
      onboardingHasDevice: false,
      isReborn: true,
    },
  }),
};

const MockedComponent = () => {
  return (
    <Stack.Navigator initialRouteName={ScreenName.MockedWalletScreen}>
      <Stack.Screen name={ScreenName.MockedWalletScreen}>
        {() => (
          <CompletionScreen
            route={{
              key: "testKey",
              name: ScreenName.SyncOnboardingCompletion,
              params: { device: mockedDevice },
            }}
            navigation={mockNavigation}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

describe("CompletionScreen", () => {
  it("should set the value of onBoardingHasDevice to true and isReborn to false", async () => {
    const { store } = renderWithReactQuery(<MockedComponent />, {
      ...INITIAL_STATE,
    });

    const state = store.getState();

    expect(state.settings.onboardingHasDevice).toBe(true);
    expect(state.settings.isReborn).toBe(false);
  });

  it("should set the value of onBoardingHasDevice to false and isReborn to false", async () => {
    const { store } = renderWithReactQuery(<MockedComponent />, {
      ...REBORN_STATE,
    });

    const state = store.getState();

    expect(state.settings.onboardingHasDevice).toBe(false);
    expect(state.settings.isReborn).toBe(false);
  });
});
