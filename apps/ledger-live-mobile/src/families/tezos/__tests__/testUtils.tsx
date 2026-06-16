import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BigNumber from "bignumber.js";

export const tezosUnit = { code: "XTZ", magnitude: 6, name: "tezos" };

export const makeMockTezosAccount = (id: string) => ({
  type: "Account",
  id,
  currency: {
    id: "tezos",
    name: "Tezos",
    ticker: "XTZ",
    family: "tezos",
    units: [{ code: "XTZ", name: "tez", magnitude: 6 }],
  },
  balance: new BigNumber(10_000_000),
  spendableBalance: new BigNumber(10_000_000),
  operations: [],
  pendingOperations: [],
});

// Single bridge/max-spendable instances per factory call: the Amount screen re-runs its estimate
// effect on every `bridge` identity change, so fresh objects per render would loop forever.
export const makeMockAccountBridge = ({
  mode,
  withMaxSpendable = false,
}: {
  mode: "stake" | "unstake";
  withMaxSpendable?: boolean;
}) => {
  const maxSpendable = new BigNumber(9_000_000);
  return {
    createTransaction: () => ({ family: "tezos", mode }),
    updateTransaction: (t: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...t,
      ...patch,
    }),
    ...(withMaxSpendable ? { estimateMaxSpendable: () => Promise.resolve(maxSpendable) } : {}),
  };
};

export const makeMockBridgeTransactionResult = (mode: "stake" | "unstake") => ({
  transaction: { family: "tezos", mode, amount: new BigNumber(1_000_000), useAllAmount: false },
  setTransaction: () => {},
  status: {
    errors: {},
    warnings: {},
    amount: new BigNumber(1_000_000),
    estimatedFees: new BigNumber(1000),
  },
  bridgePending: false,
  bridgeError: null,
});

export const MockButton = ({
  onPress,
  title,
  children,
  testID,
  disabled,
}: {
  onPress?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  testID?: string;
  disabled?: boolean;
}) => (
  <TouchableOpacity testID={testID} onPress={disabled ? undefined : onPress} disabled={disabled}>
    <Text>
      {title}
      {children}
    </Text>
  </TouchableOpacity>
);

export const MockKeyboardView = ({ children }: { children: React.ReactNode }) => (
  <View>{children}</View>
);

export const MockAmountInput = ({ testID }: { testID?: string }) => <View testID={testID} />;

// The device steps are shared, generic screens (BLE / device-action). The stubs reproduce the
// exact forward-navigation contract the real screens use, so the flows walk through them
// deterministically.
export const MockSelectDevice = ({
  navigation,
  route,
}: {
  navigation: { navigate: (name: string, params: Record<string, unknown>) => void };
  route: { name: string; params: Record<string, unknown> };
}) => (
  <TouchableOpacity
    testID="mock-select-device"
    onPress={() =>
      navigation.navigate(route.name.replace("SelectDevice", "ConnectDevice"), {
        ...route.params,
        device: { deviceId: "device-1" },
      })
    }
  />
);

export const makeMockConnectDevice = ({
  result,
  errorMessage,
}: {
  result: { id: string; type: string };
  errorMessage: string;
}) => {
  const MockConnectDevice = ({
    navigation,
    route,
  }: {
    navigation: { replace: (name: string, params: Record<string, unknown>) => void };
    route: { name: string; params: Record<string, unknown> };
  }) => (
    <>
      <TouchableOpacity
        testID="mock-connect-broadcast"
        onPress={() =>
          navigation.replace(route.name.replace("ConnectDevice", "ValidationSuccess"), {
            ...route.params,
            result,
          })
        }
      />
      <TouchableOpacity
        testID="mock-connect-error"
        onPress={() =>
          navigation.replace(route.name.replace("ConnectDevice", "ValidationError"), {
            ...route.params,
            error: new Error(errorMessage),
          })
        }
      />
    </>
  );
  return MockConnectDevice;
};

// The real ValidateError pulls the export-logs / device-error tree; the stub lets tests assert the
// flow reached the error screen with the broadcast error, without that out-of-scope subtree.
export const MockValidateError = ({ error }: { error: Error }) => (
  <View testID="validate-error">
    <Text>{error?.message}</Text>
  </View>
);
