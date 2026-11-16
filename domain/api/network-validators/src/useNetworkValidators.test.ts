/**
 * @jest-environment jsdom
 */
import { createElement, type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { NetworkIdSchema } from "@domain/entity-account-descriptor";
import networkValidators from "@domain/entity-network-validators";
import { mockNetworkValidator } from "@domain/entity-network-validators/schema.mock";
import { networkValidatorsExtra } from "./extra";
import { fetchNetworkValidators } from "./fetchNetworkValidators";
import type { NetworkValidatorsSource } from "./source";
import { useNetworkValidators } from "./useNetworkValidators";

const cosmos = NetworkIdSchema.parse("cosmos");
const validators = [mockNetworkValidator()];

function setup(read: NetworkValidatorsSource["read"]) {
  const source: NetworkValidatorsSource = { id: "s", supports: () => true, read: jest.fn(read) };
  const store = configureStore({
    reducer: { networkValidators },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: networkValidatorsExtra([source]) } }),
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    // oxlint-disable-next-line react/no-children-prop -- no JSX in a .test.ts, and ProviderProps requires children
    createElement(Provider, { store, children });
  return { source, store, wrapper };
}

describe("useNetworkValidators", () => {
  it("reads the validators on mount and returns them", async () => {
    const { source, wrapper } = setup(async () => validators);
    const { result } = renderHook(() => useNetworkValidators(cosmos), { wrapper });
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.validators).toEqual(validators));
    expect(result.current).toEqual({ validators, pending: false, error: undefined });
    expect(source.read).toHaveBeenCalledWith(cosmos, { signal: expect.any(AbortSignal) });
  });

  it("shares one read between screens and does not read fresh validators again", async () => {
    const { source, wrapper } = setup(async () => validators);
    const first = renderHook(() => useNetworkValidators(cosmos), { wrapper });
    renderHook(() => useNetworkValidators(cosmos), { wrapper });
    await waitFor(() => expect(first.result.current.validators).toEqual(validators));
    renderHook(() => useNetworkValidators(cosmos), { wrapper });
    expect(source.read).toHaveBeenCalledTimes(1);
  });

  it("returns the error of a failed read", async () => {
    const { wrapper } = setup(async () => Promise.reject(new Error("down")));
    const { result } = renderHook(() => useNetworkValidators(cosmos), { wrapper });
    await waitFor(() => expect(result.current.error).toEqual({ name: "Error", message: "down" }));
    expect(result.current).toMatchObject({ validators: [], pending: false });
  });

  it("reads nothing without a network, and follows a refresh", async () => {
    const { source, store, wrapper } = setup(async () => validators);
    const { result } = renderHook(() => useNetworkValidators(undefined), { wrapper });
    expect(result.current).toEqual({ validators: [], pending: false, error: undefined });
    expect(source.read).not.toHaveBeenCalled();
    const other = renderHook(() => useNetworkValidators(cosmos), { wrapper });
    await waitFor(() => expect(other.result.current.validators).toEqual(validators));
    await act(() => store.dispatch(fetchNetworkValidators(cosmos, { refresh: true })));
    expect(source.read).toHaveBeenCalledTimes(2);
  });
});
