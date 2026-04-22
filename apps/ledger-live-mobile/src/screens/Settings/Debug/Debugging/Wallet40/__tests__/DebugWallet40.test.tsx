import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { render, screen } from "@tests/test-renderer";
import { productTourCompletedSelector } from "~/reducers/settings";
import DebugWallet40 from "../index";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe("DebugWallet40", () => {
  it("shows lwmProductTour summary and Product Tour completion state", async () => {
    render(<DebugWallet40 />);

    expect(
      await screen.findByText(/PRODUCT TOUR — QA \(Settings → Debug → Wallet V4 features\)/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Feature flag: useFeature\("lwmProductTour"\) — enabled \+ params/),
    ).toBeTruthy();
    expect(screen.getByText(/Product Tour — completed \(persisted\)/)).toBeTruthy();
    expect(screen.getByText(/Current productTourCompleted \(Redux\): No/)).toBeTruthy();
    expect(screen.getByText(/"enabled": false/)).toBeTruthy();
  });

  it("toggles productTourCompleted via debug switch", async () => {
    const { store } = render(<DebugWallet40 />);

    await screen.findByText(/PRODUCT TOUR — QA \(Settings → Debug → Wallet V4 features\)/);

    expect(productTourCompletedSelector(store.getState())).toBe(false);

    const toggle = screen.getByTestId("debug-product-tour-completed-switch");
    fireEvent(toggle, "onCheckedChange", true);

    expect(productTourCompletedSelector(store.getState())).toBe(true);
    expect(screen.getByText(/Current productTourCompleted \(Redux\): Yes/)).toBeTruthy();
  });
});
