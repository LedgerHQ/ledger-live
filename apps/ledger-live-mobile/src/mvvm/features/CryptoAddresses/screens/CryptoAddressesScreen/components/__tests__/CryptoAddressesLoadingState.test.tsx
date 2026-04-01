import React from "react";
import { render, screen } from "@tests/test-renderer";
import CryptoAddressesLoadingState from "../CryptoAddressesLoadingState";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const { View } = jest.requireActual("react-native");
  return {
    ...actual,
    Skeleton: ({ component }: { component: string }) => (
      <View testID={`skeleton-${component}`} />
    ),
  };
});

describe("CryptoAddressesLoadingState", () => {
  it("should render 6 skeleton list items", () => {
    render(<CryptoAddressesLoadingState />);

    const skeletons = screen.getAllByTestId("skeleton-list-item");
    expect(skeletons).toHaveLength(6);
  });
});
