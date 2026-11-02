import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, getAccountDataRuntime } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { createAccountDataRecorder } from "./accountDataRecorder";
import { useMockAccountsToolProps } from "./useMockAccountsToolProps";

const real = mockAddressAccountDescriptor();
const mock = mockAddressAccountDescriptor({ purpose: "mock" });

function setup() {
  const extra = accountDataExtra([]);
  const store = configureStore({
    reducer: { accountEntries: accountsSlice.reducer },
    middleware: getDefault => getDefault({ thunk: { extraArgument: extra } }),
  });
  store.dispatch(
    legacyAccountsSynced([
      {
        accountUUID: computeAccountUUID(real),
        descriptor: real,
        legacyId: AccountIdSchema.parse("eth"),
      },
    ]),
  );
  const recorder = createAccountDataRecorder();
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useMockAccountsToolProps(recorder), { wrapper });
  return { result, recorder, router: getAccountDataRuntime(extra).router };
}

describe("useMockAccountsToolProps", () => {
  it("adds and removes mock accounts, listing only them", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([]);

    act(() => result.current.onAdd([mock]));
    expect(result.current.accounts).toEqual([
      { accountUUID: computeAccountUUID(mock), descriptor: mock },
    ]);

    act(() => result.current.onRemove([computeAccountUUID(mock), computeAccountUUID(real)]));
    expect(result.current.accounts).toEqual([]);
  });

  it("adds the tool's source to the store's router, recorded", async () => {
    const { result, recorder, router } = setup();
    act(() =>
      result.current.addSource({
        id: AccountDataSourceIdSchema.parse("mock"),
        purposes: ["mock"],
        supports: () => true,
        read: { balance: async () => [] },
      }),
    );
    await expect(router.read("balance", mock)).resolves.toEqual({ data: [], sourceId: "mock" });
    expect(recorder.getEvents()).toEqual([
      expect.objectContaining({ type: "source-call", sourceId: "mock", kind: "balance" }),
    ]);
  });

  it("removes the previous visit's source when a visit adds it again, keeping the latest", async () => {
    const { result, router } = setup();
    const add = router.addSource.bind(router);
    const removers: jest.Mock[] = [];
    jest.spyOn(router, "addSource").mockImplementation(source => {
      const remover = jest.fn(add(source));
      removers.push(remover);
      return remover;
    });
    const source = {
      id: AccountDataSourceIdSchema.parse("mock"),
      purposes: ["mock" as const],
      supports: () => true,
      read: { balance: async () => [] },
    };
    act(() => result.current.addSource(source));
    act(() => result.current.addSource(source));
    expect(removers).toHaveLength(2);
    expect(removers[0]).toHaveBeenCalledTimes(1);
    expect(removers[1]).not.toHaveBeenCalled();
    await expect(router.read("balance", mock)).resolves.toEqual({ data: [], sourceId: "mock" });
  });
});
