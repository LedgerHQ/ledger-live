import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { predictionsBindingRequests, type PredictionsBindingRequest } from "../bindingRequests";
import PredictionsBindingRoot from "../PredictionsBindingRoot";

type ExecutorProps = PredictionsBindingRequest & {
  isOpen: boolean;
  onDone: () => void;
  onDismissed: () => void;
};

const mockRenderedExecutors: ExecutorProps[] = [];

// The real executor can't reproduce a replaced one calling back late, so it's stubbed here.
jest.mock("../PredictionsBindingExecutorLWM", () => ({
  PredictionsBindingExecutorLWM: (props: ExecutorProps) => {
    mockRenderedExecutors.push(props);
    const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return <Text>{props.isOpen ? "binding open" : "binding closing"}</Text>;
  },
}));

const request = (): PredictionsBindingRequest => ({
  account: genAccount("predictions-binding"),
  onSuccess: jest.fn(),
  onError: jest.fn(),
  onCancel: jest.fn(),
});

describe("PredictionsBindingRoot", () => {
  it("keeps a binding open when the one it replaced calls back late", () => {
    render(<PredictionsBindingRoot />);
    act(() => predictionsBindingRequests.open(request()));
    const replacedExecutor = mockRenderedExecutors.at(-1);
    act(() => predictionsBindingRequests.open(request()));

    act(() => {
      replacedExecutor?.onDone();
      replacedExecutor?.onDismissed();
    });

    expect(screen.getByText("binding open")).toBeOnTheScreen();
  });
});
