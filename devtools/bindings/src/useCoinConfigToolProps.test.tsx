import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  createLiveConfigOverridesMiddleware,
  liveConfigOverridesReducer,
} from "@shared/live-config-overrides";
import { useCoinConfigToolProps } from "./useCoinConfigToolProps";

const defaults: Record<string, unknown> = {
  config_currency_solana: { token2022Enabled: false },
  config_currency_ethereum: { status: "active" },
};

describe("useCoinConfigToolProps", () => {
  let applied: Record<string, unknown>;
  const getValueByKey = (key: string) =>
    Object.hasOwn(applied, key) ? applied[key] : defaults[key];
  const getDefaultValueByKey = (key: string) => defaults[key];
  const keys = Object.keys(defaults);

  function buildStore() {
    return configureStore({
      reducer: { liveConfigOverrides: liveConfigOverridesReducer },
      middleware: gdm =>
        gdm().concat(
          createLiveConfigOverridesMiddleware({
            applyOverrides: overrides => {
              applied = overrides;
            },
          }),
        ),
    });
  }

  function renderToolProps() {
    const store = buildStore();
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(
      () => useCoinConfigToolProps({ keys, getValueByKey, getDefaultValueByKey }),
      {
        wrapper,
      },
    );
    return { store, result };
  }

  beforeEach(() => {
    applied = {};
  });

  it("sorts the keys and starts without overrides", () => {
    const { result } = renderToolProps();

    expect(result.current.keys).toEqual(["config_currency_ethereum", "config_currency_solana"]);
    expect(result.current.overrides).toEqual({});
    expect(result.current.getResolvedValue("config_currency_solana")).toEqual({
      token2022Enabled: false,
    });
    expect(result.current.getDefaultValue("config_currency_ethereum")).toEqual({
      status: "active",
    });
  });

  it("setOverride stores the override and the tool reads the applied value", () => {
    const { store, result } = renderToolProps();

    act(() => result.current.setOverride("config_currency_solana", { token2022Enabled: true }));

    expect(store.getState().liveConfigOverrides.overrides).toEqual({
      config_currency_solana: { token2022Enabled: true },
    });
    expect(result.current.getResolvedValue("config_currency_solana")).toEqual({
      token2022Enabled: true,
    });
  });

  it("clearOverride removes a single override", () => {
    const { store, result } = renderToolProps();
    act(() => result.current.setOverride("config_currency_solana", {}));
    act(() => result.current.setOverride("config_currency_ethereum", {}));

    act(() => result.current.clearOverride("config_currency_solana"));

    expect(store.getState().liveConfigOverrides.overrides).toEqual({
      config_currency_ethereum: {},
    });
  });

  it("clearAllOverrides empties the overrides", () => {
    const { store, result } = renderToolProps();
    act(() => result.current.setOverride("config_currency_solana", {}));

    act(() => result.current.clearAllOverrides());

    expect(store.getState().liveConfigOverrides.overrides).toEqual({});
    expect(result.current.overrides).toEqual({});
  });
});
