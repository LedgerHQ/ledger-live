import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import ValidationSuccess from "../02-ValidationSuccess";
import { ScreenName } from "~/const";

const mockNavigate = jest.fn();
const mockPop = jest.fn();
let mockRouteParams: Record<string, unknown> = {};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, getParent: () => ({ pop: mockPop }) }),
  useRoute: () => ({ params: mockRouteParams }),
}));
jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "tezos-acc-1", type: "Account" } }),
}));

jest.mock("~/analytics", () => ({ TrackScreen: () => null }));

jest.mock("~/components/PreventNativeBack", () => () => null);

jest.mock("~/components/ValidateSuccess", () => {
  const { TouchableOpacity, Text } = jest.requireActual("react-native");
  return ({ onClose, onViewDetails }: { onClose?: () => void; onViewDetails?: () => void }) => (
    <>
      <TouchableOpacity testID="close" onPress={onClose}>
        <Text>close</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="view-details" onPress={onViewDetails}>
        <Text>view-details</Text>
      </TouchableOpacity>
    </>
  );
});

const transaction = { family: "tezos", mode: "unstake" };
const operation = { id: "op-1", type: "UNSTAKE" };

const renderWith = (params: Record<string, unknown> = {}) => {
  mockRouteParams = { accountId: "tezos-acc-1", transaction, ...params };
  return render(<ValidationSuccess />);
};

describe("Tezos UnstakeFlow ValidationSuccess", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPop.mockClear();
  });

  it("opens the resulting operation details", () => {
    renderWith({ result: operation });
    fireEvent.press(screen.getByTestId("view-details"));
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: "tezos-acc-1",
      operation,
    });
  });

  it("does nothing on view-details when there is no operation result", () => {
    renderWith();
    fireEvent.press(screen.getByTestId("view-details"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("closes by popping the parent navigator", () => {
    renderWith({ result: operation });
    fireEvent.press(screen.getByTestId("close"));
    expect(mockPop).toHaveBeenCalled();
  });
});
