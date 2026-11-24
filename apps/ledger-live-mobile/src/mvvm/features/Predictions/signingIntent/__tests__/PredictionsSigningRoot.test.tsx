import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getBindingTypedData } from "@features/platform-predictions";
import { predictionsSigningRequests, type PredictionsSigningRequest } from "../signingRequests";
import PredictionsSigningRoot from "../PredictionsSigningRoot";

type ExecutorProps = PredictionsSigningRequest & {
  isOpen: boolean;
  onDone: () => void;
  onDismissed: () => void;
};

const mockRenderedExecutors: ExecutorProps[] = [];

// The real executor can't reproduce a replaced one calling back late, so it's stubbed here.
jest.mock("../PredictionsSigningExecutorLWM", () => ({
  PredictionsSigningExecutorLWM: (props: ExecutorProps) => {
    mockRenderedExecutors.push(props);
    const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return <Text>{props.isOpen ? "request open" : "request closing"}</Text>;
  },
}));

const request = (): PredictionsSigningRequest => {
  const account = genAccount("predictions-binding");
  return {
    account,
    purpose: "binding",
    typedData: getBindingTypedData(account.freshAddress),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
  };
};

describe("PredictionsSigningRoot", () => {
  it("keeps a request open when the one it replaced calls back late", () => {
    render(<PredictionsSigningRoot />);
    act(() => predictionsSigningRequests.open(request()));
    const replacedExecutor = mockRenderedExecutors.at(-1);
    act(() => predictionsSigningRequests.open(request()));

    act(() => {
      replacedExecutor?.onDone();
      replacedExecutor?.onDismissed();
    });

    expect(screen.getByText("request open")).toBeOnTheScreen();
  });
});
