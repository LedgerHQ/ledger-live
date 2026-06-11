import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import ValidationSuccess from "../02-ValidationSuccess";
import { ScreenName } from "~/const";

const mockNavigate = jest.fn();
const mockPop = jest.fn();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: { id: "tezos-acc-1", type: "Account" } }),
}));

jest.mock("~/analytics", () => ({ TrackScreen: () => null, track: jest.fn() }));

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

const transaction = { family: "tezos", mode: "stake" };
const operation = { id: "op-1", type: "STAKE" };

const makeProps = (params: Record<string, unknown> = {}) =>
  ({
    navigation: { navigate: mockNavigate, getParent: () => ({ pop: mockPop }) },
    route: { params: { accountId: "tezos-acc-1", transaction, ...params } },
  }) as unknown as React.ComponentProps<typeof ValidationSuccess>;

describe("Tezos StakeFlow ValidationSuccess", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPop.mockClear();
  });

  it("opens the resulting operation details", () => {
    render(<ValidationSuccess {...makeProps({ result: operation })} />);
    fireEvent.press(screen.getByTestId("view-details"));
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: "tezos-acc-1",
      operation,
    });
  });

  it("does nothing on view-details when there is no operation result", () => {
    render(<ValidationSuccess {...makeProps()} />);
    fireEvent.press(screen.getByTestId("view-details"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("closes by popping the parent navigator", () => {
    render(<ValidationSuccess {...makeProps({ result: operation })} />);
    fireEvent.press(screen.getByTestId("close"));
    expect(mockPop).toHaveBeenCalled();
  });
});
