import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { Linking } from "react-native";
import UnstakeRequiredDrawer from "../UnstakeRequiredDrawer";

jest.mock("~/components/QueuedDrawer", () => {
  const { View } = jest.requireActual("react-native");
  return ({
    isRequestingToBeOpened,
    children,
  }: {
    isRequestingToBeOpened?: boolean;
    children: React.ReactNode;
  }) => (isRequestingToBeOpened ? <View>{children}</View> : null);
});
jest.mock("~/analytics", () => ({ TrackScreen: () => null }));
jest.mock("~/context/Locale", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    useTranslation: () => ({ t: (k: string) => k }),
    Trans: ({ i18nKey }: { i18nKey: string }) => <Text>{i18nKey}</Text>,
  };
});

describe("Tezos UnstakeRequiredDrawer", () => {
  it("renders the changeBaker copy and the four steps", () => {
    render(<UnstakeRequiredDrawer isOpen reason="changeBaker" onClose={jest.fn()} />);
    expect(screen.getByText("tezos.unstakeRequired.changeBaker.title")).toBeTruthy();
    expect(screen.getByText("tezos.unstakeRequired.changeBaker.description")).toBeTruthy();
    [0, 1, 2, 3].forEach(i =>
      expect(screen.getByText(`tezos.unstakeRequired.steps.${i}`)).toBeTruthy(),
    );
  });

  it("renders the endDelegation title for that reason", () => {
    render(<UnstakeRequiredDrawer isOpen reason="endDelegation" onClose={jest.fn()} />);
    expect(screen.getByText("tezos.unstakeRequired.endDelegation.title")).toBeTruthy();
  });

  it("calls onClose from the close button", () => {
    const onClose = jest.fn();
    render(<UnstakeRequiredDrawer isOpen reason="changeBaker" onClose={onClose} />);
    fireEvent.press(screen.getByText("tezos.unstakeRequired.close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens the staking url on learn more", () => {
    const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
    render(<UnstakeRequiredDrawer isOpen reason="changeBaker" onClose={jest.fn()} />);
    fireEvent.press(screen.getByText("tezos.unstakeRequired.learnMore"));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("renders nothing when closed", () => {
    render(<UnstakeRequiredDrawer isOpen={false} reason="changeBaker" onClose={jest.fn()} />);
    expect(screen.queryByText("tezos.unstakeRequired.changeBaker.title")).toBeNull();
  });
});
