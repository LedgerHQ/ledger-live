import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  accountStatusSlice,
  type AccountStatus,
  type AssetStatus,
} from "@domain/entity-account-status";
import { useAccountStatusToolProps } from "./useAccountStatusToolProps";

const stellar = mockAddressAccountDescriptor();
const stellarUUID = computeAccountUUID(stellar);
const USDC = "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

type Answers = { account?: AccountStatus | Error; assets?: Record<string, AssetStatus | Error> };

function setup({ account, assets = {} }: Answers) {
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountStatus: accountStatusSlice.reducer,
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
                accountStatus: async () => {
                  if (!account || account instanceof Error) throw account ?? new Error("none");
                  return account;
                },
                assetStatus: async (_target, query) => {
                  const status = query && assets[query.assetId];
                  if (!query || !status || status instanceof Error) {
                    throw status ?? new Error("none");
                  }
                  return { assetId: query.assetId, status };
                },
              },
            },
          ]),
        },
      }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID: stellarUUID, descriptor: stellar, legacyId: AccountIdSchema.parse("xlm") },
    ]),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useAccountStatusToolProps(), { wrapper }).result;
}

describe("useAccountStatusToolProps", () => {
  it("lists every account, unread, with no asset", () => {
    const result = setup({});
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ accountUUID: stellarUUID, reading: false, used: undefined }),
    ]);
    expect(result.current.accounts[0].assets).toEqual([]);
  });

  it("reads the account: used, its gate and send gate, and the source", async () => {
    const result = setup({ account: { used: false, gate: { type: "onboarding" } } });
    act(() => result.current.onReadAll());
    await waitFor(() => expect(result.current.accounts[0].used).toBe(false));
    expect(result.current.accounts[0]).toMatchObject({
      reading: false,
      sourceId: "controlled",
      gate: "onboarding",
      sendGate: "onboarding",
    });
  });

  it("reads an asset typed in: its gate, and the receive gate with the account's", async () => {
    const result = setup({
      account: { used: true, gate: null },
      assets: { [USDC]: { gate: { type: "activation", method: "trustline" } } },
    });
    act(() => result.current.onRead(stellarUUID));
    await waitFor(() => expect(result.current.accounts[0].used).toBe(true));
    act(() => result.current.onReadAsset(stellarUUID, USDC));
    await waitFor(() => expect(result.current.accounts[0].assets[0]?.gate).toBeDefined());
    expect(result.current.accounts[0].assets).toEqual([
      expect.objectContaining({
        assetId: USDC,
        gate: "activation · trustline",
        receiveGate: "activation · trustline",
        sourceId: "controlled",
      }),
    ]);
  });

  it("keeps a failed asset read listed with its error", async () => {
    const result = setup({ assets: { [USDC]: new Error("not a token") } });
    act(() => result.current.onReadAsset(stellarUUID, USDC));
    await waitFor(() =>
      expect(result.current.accounts[0].assets[0]?.error).toBe("Error: not a token"),
    );
    expect(result.current.accounts[0].assets[0]).toMatchObject({ assetId: USDC, gate: undefined });
  });

  it("shows the error of a failed account read", async () => {
    const result = setup({ account: new Error("down") });
    act(() => result.current.onRead(stellarUUID));
    await waitFor(() => expect(result.current.accounts[0].error).toBe("Error: down"));
  });
});
