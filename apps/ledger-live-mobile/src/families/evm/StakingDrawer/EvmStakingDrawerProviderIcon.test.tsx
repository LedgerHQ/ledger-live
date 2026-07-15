import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { EvmStakingDrawerProviderIcon } from "./EvmStakingDrawerProviderIcon";

jest.mock("~/icons/MissingIcon", () => jest.fn(() => null));
jest.mock("~/icons/providers/Bitwise", () => ({
  Bitwise: jest.fn(() => null),
}));

describe("EvmStakingDrawerProviderIcon", () => {
  const { Bitwise } = jest.requireMock("~/icons/providers/Bitwise");

  it('renders Bitwise icon for "Bitwise" provider', () => {
    render(<EvmStakingDrawerProviderIcon icon="Bitwise" />);
    expect(screen.UNSAFE_getByType(Bitwise)).toBeTruthy();
  });

  it('renders Bitwise icon for "ChorusOne" provider (backward compat)', () => {
    render(<EvmStakingDrawerProviderIcon icon="ChorusOne" />);
    expect(screen.UNSAFE_getByType(Bitwise)).toBeTruthy();
  });
});
