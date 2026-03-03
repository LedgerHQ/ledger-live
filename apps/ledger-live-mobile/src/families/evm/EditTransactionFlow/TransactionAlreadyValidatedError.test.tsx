import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { TransactionAlreadyValidatedError } from "./TransactionAlreadyValidatedError";

jest.mock("~/components/EditTransaction/TransactionAlreadyValidatedErrorView", () => {
  return function MockTransactionAlreadyValidatedErrorView({
    error,
    onClose,
  }: {
    error: Error;
    onClose: () => void;
  }) {
    return <Text onPress={onClose}>{error.message}</Text>;
  };
});

describe("EVM TransactionAlreadyValidatedError", () => {
  it("passes the error and pops parent navigator on close", () => {
    const pop = jest.fn();
    const getParent = jest.fn().mockReturnValue({ pop });
    const error = new Error("already validated");

    render(
      <TransactionAlreadyValidatedError
        navigation={{ getParent } as never}
        route={{ params: { error } } as never}
      />,
    );

    fireEvent.press(screen.getByText("already validated"));

    expect(getParent).toHaveBeenCalledTimes(1);
    expect(pop).toHaveBeenCalledTimes(1);
  });
});
