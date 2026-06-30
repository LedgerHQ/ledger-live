import React from "react";
import { View } from "react-native";
import * as TezosReact from "@ledgerhq/live-common/families/tezos/react";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { renderWithReactQuery as render, withFlagOverrides } from "@tests/test-renderer";
import storage from "LLM/storage";
import { MockedAccounts } from "LLM/features/Accounts/__integrations__/mockedAccounts";
import GlobalDrawers from "~/GlobalDrawers";
import { ScreenName } from "~/const";
import { createNotificationsPromptFeatureFlags } from "../testUtils";
import { accountsByKey, createOperation, type StakePromptCase } from "./stakePromptFixtures";
import { getMobileFamilyFlow } from "./stakePromptFamilyFlows";

jest.mock("LLM/components/QueuedDrawer", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Pressable } = require("react-native");

  function QueuedDrawerMock(props: {
    isRequestingToBeOpened?: boolean;
    onBackdropPress?: () => void;
    children?: React.ReactNode;
  }) {
    if (!props.isRequestingToBeOpened) return <View />;
    return (
      <View>
        <Pressable testID="drawer-backdrop" onPress={props.onBackdropPress} />
        {props.children}
      </View>
    );
  }

  return {
    __esModule: true,
    default: QueuedDrawerMock,
  };
});

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/families/tezos/react"),
}));

const featureFlagsForStakePrompt = createNotificationsPromptFeatureFlags();
const Stack = createNativeStackNavigator();
const HOME_SCREEN = "Home";

function HomeScreen() {
  return <View />;
}

const accountsState = {
  ...MockedAccounts,
  active: [...MockedAccounts.active, ...Object.values(accountsByKey)],
};

const createParams = (stakePromptCase: StakePromptCase) => {
  const account = accountsByKey[stakePromptCase.accountKey];

  return {
    accountId: account.id,
    deviceId: "device-id",
    error: {
      name: "Error",
      message: `${stakePromptCase.label} validation failed`,
    } as Error,
    result: createOperation(account.id, stakePromptCase.operationType),
    transaction: stakePromptCase.transaction,
    ...stakePromptCase.params,
  };
};

const createFlowNavigationState = (
  stakePromptCase: StakePromptCase,
  screenName: ScreenName = stakePromptCase.successScreenName,
) => ({
  index: 1,
  routes: [
    { name: HOME_SCREEN },
    {
      name: stakePromptCase.flowName,
      state: {
        index: 0,
        routes: [{ name: screenName, params: createParams(stakePromptCase) }],
      },
    },
  ],
});

function StakeFlowTestApp({ stakePromptCase }: { stakePromptCase: StakePromptCase }) {
  const Flow = getMobileFamilyFlow(stakePromptCase).component;

  return (
    <GlobalDrawers>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={HOME_SCREEN} component={HomeScreen} />
        <Stack.Screen name={stakePromptCase.flowName} component={Flow} />
      </Stack.Navigator>
    </GlobalDrawers>
  );
}

export const renderStakeFlow = (
  stakePromptCase: StakePromptCase,
  screenName: ScreenName = stakePromptCase.successScreenName,
) =>
  render(<StakeFlowTestApp stakePromptCase={stakePromptCase} />, {
    navigationInitialState: createFlowNavigationState(stakePromptCase, screenName),
    overrideInitialState: withFlagOverrides(featureFlagsForStakePrompt, state => ({
      ...state,
      accounts: accountsState,
      notifications: {
        ...state.notifications,
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
      },
      settings: {
        ...state.settings,
        readOnlyModeEnabled: false,
        notifications: {
          ...state.settings.notifications,
          areNotificationsAllowed: true,
        },
      },
    })),
  });

let useTezosBakerSpy: jest.SpiedFunction<typeof TezosReact.useBaker>;

export function setupStakePromptTestSuite() {
  beforeAll(() => {
    jest.useFakeTimers();
    useTezosBakerSpy = jest.spyOn(TezosReact, "useBaker").mockReturnValue({
      address: "tz1-validator",
      name: "Tezos validator",
      logoURL: "",
      nominalYield: "0 %",
      capacityStatus: "normal",
    });
  });

  beforeEach(async () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    await storage.deleteAll();
  });

  afterAll(() => {
    jest.useRealTimers();
    useTezosBakerSpy.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
}
