import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { accountReceivesSlice, type AccountReceive } from "@domain/entity-account-receive";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { useAccountReceiveToolProps } from "./useAccountReceiveToolProps";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const ethereumUUID = computeAccountUUID(ethereum);
const bitcoinUUID = computeAccountUUID(bitcoin);

function setup(answers: Record<string, AccountReceive | Error>) {
  const reads: string[] = [];
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountReceives: accountReceivesSlice.reducer,
      accountData: accountDataSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: accountDataExtra([
            {
              id: AccountDataSourceIdSchema.parse("controlled"),
              supports: () => true,
              read: {
                receive: async ({ accountUUID }) => {
                  reads.push(accountUUID);
                  const answer = answers[accountUUID];
                  if (!answer || answer instanceof Error) throw answer ?? new Error("none");
                  return answer;
                },
              },
            },
          ]),
        },
      }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID: ethereumUUID, descriptor: ethereum, legacyId: AccountIdSchema.parse("eth") },
      { accountUUID: bitcoinUUID, descriptor: bitcoin, legacyId: AccountIdSchema.parse("btc") },
    ]),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAccountReceiveToolProps(), { wrapper });
  return { result, reads };
}

describe("useAccountReceiveToolProps", () => {
  it("lists every account, unread", () => {
    const { result } = setup({});
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ accountUUID: ethereumUUID, reading: false, status: undefined }),
      expect.objectContaining({ accountUUID: bitcoinUUID, reading: false, status: undefined }),
    ]);
  });

  it("reads one account: where it receives, what the device confirms, and the source", async () => {
    const { result, reads } = setup({
      [ethereumUUID]: mockAccountReceive({
        address: "ldg::1220ab",
        verification: { type: "address", path: "m/44h/6767h/0h/0h/0h", address: "canton_9f3c" },
      }),
    });
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].status).toBe("ready"));
    expect(reads).toEqual([ethereumUUID]);
    expect(result.current.accounts[0]).toEqual(
      expect.objectContaining({
        reading: false,
        sourceId: "controlled",
        receive: {
          address: "ldg::1220ab",
          verification: "shows canton_9f3c at m/44h/6767h/0h/0h/0h",
        },
        shielded: undefined,
      }),
    );
  });

  it("describes a device confirming an address it is given, or a key", async () => {
    const { result } = setup({
      [ethereumUUID]: mockAccountReceive({
        address: "3kBx2h",
        verification: { type: "addressConfirmation", path: "m/1105h/0h", address: "3kBx2h" },
      }),
      [bitcoinUUID]: mockAccountReceive({
        address: "0.0.1234",
        verification: { type: "publicKey", path: "m/44h/3030h", publicKey: "302a" },
      }),
    });
    act(() => result.current.onReadAll());
    await waitFor(() => expect(result.current.accounts[1].status).toBe("ready"));
    expect(result.current.accounts[0].receive?.verification).toBe("confirms 3kBx2h at m/1105h/0h");
    expect(result.current.accounts[1].receive?.verification).toBe(
      "confirms key 302a at m/44h/3030h",
    );
  });

  it("shows the shielded address with its own verification", async () => {
    const { result } = setup({
      [ethereumUUID]: mockAccountReceive({
        address: "t1transparent",
        verification: undefined,
        shielded: { address: "u1shielded" },
      }),
    });
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].status).toBe("ready"));
    expect(result.current.accounts[0].receive).toEqual({
      address: "t1transparent",
      verification: undefined,
    });
    expect(result.current.accounts[0].shielded).toEqual({
      address: "u1shielded",
      verification: undefined,
    });
  });

  it("shows an account waiting for its onboarding, without an address", async () => {
    const { result } = setup({ [ethereumUUID]: { status: "onboardingRequired" } });
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].status).toBe("onboardingRequired"));
    expect(result.current.accounts[0].receive).toBeUndefined();
  });

  it("shows the error of a failed read", async () => {
    const { result } = setup({ [ethereumUUID]: new Error("down") });
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].error).toBe("Error: down"));
  });
});
