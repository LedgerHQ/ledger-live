import React from "react";
import { render, screen } from "@testing-library/react-native";
import { LoadingState } from "../LoadingState";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const Container = ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
    <RN.View testID={testID}>{children}</RN.View>
  );

  return {
    Box: Container,
    Skeleton: () => <RN.View testID="send-recipient-card-skeleton-block" />,
  };
});

describe("LoadingState", () => {
  it("renders a recipient-card shaped skeleton", () => {
    render(<LoadingState />);

    expect(screen.getByTestId("send-recipient-card-skeleton")).toBeVisible();
    expect(screen.getAllByTestId("send-recipient-card-skeleton-block")).toHaveLength(5);
  });
});
