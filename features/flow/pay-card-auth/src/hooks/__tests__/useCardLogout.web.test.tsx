import React from "react";
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { payCardAuthSlice } from "../../state/slice";
import { createCardLogoutPorts } from "../../state/createCardLogoutPorts";
import { startLogout } from "../../state/cardLogout";
import type { CardLogoutPorts } from "../../state/types";
import { useCardLogout } from "../useCardLogout";

jest.mock("../../state/createCardLogoutPorts", () => ({
  createCardLogoutPorts: jest.fn(),
}));

jest.mock("../../state/cardLogout", () => ({
  startLogout: jest.fn(),
}));

const ports = {} as CardLogoutPorts;

function renderLogout() {
  const store = configureStore({ reducer: { payCardAuth: payCardAuthSlice.reducer } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, ...renderHook(() => useCardLogout(), { wrapper }) };
}

describe("useCardLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createCardLogoutPorts).mockReturnValue(ports);
  });

  it("starts logout with the ports bound to the store", () => {
    const { store, result } = renderLogout();

    expect(createCardLogoutPorts).toHaveBeenCalledWith(store.dispatch);

    result.current();

    expect(startLogout).toHaveBeenCalledTimes(1);
    expect(startLogout).toHaveBeenCalledWith(ports);
  });
});
