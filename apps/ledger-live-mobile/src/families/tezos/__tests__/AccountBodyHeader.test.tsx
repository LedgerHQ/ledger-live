import React from "react";
import { screen, render } from "@tests/test-renderer";
import type { AccountLike } from "@ledgerhq/types-live";
import TezosAccountBodyHeader from "../AccountBodyHeader";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

let mockFeature: { enabled: boolean } | null;
jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/featureFlags/index"),
  useFeature: () => mockFeature,
}));

jest.mock("../Delegations", () => {
  const { View } = jest.requireActual("react-native");
  return () => <View testID="staking-dashboard" />;
});

jest.mock("../LegacyAccountBodyHeader", () => {
  const { View } = jest.requireActual("react-native");
  return () => <View testID="legacy-header" />;
});

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const account = { type: "Account", id: "acc-1" } as unknown as AccountLike;

describe("TezosAccountBodyHeader dispatcher", () => {
  it("renders the staking dashboard when llmTezosStaking is enabled", () => {
    mockFeature = { enabled: true };
    render(<TezosAccountBodyHeader account={account} />);
    expect(screen.getByTestId("staking-dashboard")).toBeTruthy();
    expect(screen.queryByTestId("legacy-header")).toBeNull();
  });

  it("renders the legacy header when the flag is disabled", () => {
    mockFeature = { enabled: false };
    render(<TezosAccountBodyHeader account={account} />);
    expect(screen.getByTestId("legacy-header")).toBeTruthy();
    expect(screen.queryByTestId("staking-dashboard")).toBeNull();
  });

  it("renders the legacy header when the flag is missing", () => {
    mockFeature = null;
    render(<TezosAccountBodyHeader account={account} />);
    expect(screen.getByTestId("legacy-header")).toBeTruthy();
  });
});
