import { AssetCategory } from "@domain/api-aggregated-assets";
import { AccountIdSchema } from "@domain/entity-account";
import { act, renderHook } from "tests/testSetup";
import { ETH_ACCOUNT_WITH_USDC } from "LLD/features/__mocks__/accounts.mock";
import { useOpenAssetAndAccount } from "../../../ModularDialog/hooks/useOpenAssetAndAccount";
import { USDC_TOKEN, fundedState } from "../../__integrations__/fixtures";
import { usePayTabRequestReceive } from "../usePayTabRequestReceive";

jest.mock("../../../ModularDialog/hooks/useOpenAssetAndAccount", () => ({
  useOpenAssetAndAccount: jest.fn(),
}));

const mockedUseOpenAssetAndAccount = jest.mocked(useOpenAssetAndAccount);

let openAssetAndAccount: jest.Mock;

beforeEach(() => {
  openAssetAndAccount = jest.fn(({ onSuccess }) => onSuccess(USDC_TOKEN, ETH_ACCOUNT_WITH_USDC));
  mockedUseOpenAssetAndAccount.mockReturnValue({
    openAssetAndAccount,
    openAssetAndAccountPromise: jest.fn(),
  });
});

describe("usePayTabRequestReceive", () => {
  it("should pick a stablecoin account in the receive flow, from Pay", () => {
    const { result, store } = renderHook(() => usePayTabRequestReceive(), {
      initialState: fundedState,
    });

    act(() => result.current.open());

    expect(openAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [AssetCategory.Stablecoins] }),
    );
    expect(store.getState().modularDialog).toEqual(
      expect.objectContaining({ flow: "receive_flow", source: "pay" }),
    );
  });

  it("should open the receive address dialog on the picked token, from Pay", () => {
    const { result, store } = renderHook(() => usePayTabRequestReceive(), {
      initialState: fundedState,
    });

    act(() => result.current.open());

    expect(store.getState().receiveAddressDialog.target).toEqual({
      accountUUID:
        store.getState().accountEntries.byLegacyId[AccountIdSchema.parse(ETH_ACCOUNT_WITH_USDC.id)],
      assetId: USDC_TOKEN.token.id,
      source: "pay",
    });
    expect(store.getState().modals.MODAL_RECEIVE?.isOpened).toBeFalsy();
  });

  it("should open the legacy receive modal on an account the account model does not know", () => {
    const { result, store } = renderHook(() => usePayTabRequestReceive(), {
      initialState: { ...fundedState, accountEntries: undefined },
    });

    act(() => result.current.open());

    expect(store.getState().receiveAddressDialog.target).toBeNull();
    expect(store.getState().modals.MODAL_RECEIVE).toEqual(
      expect.objectContaining({
        isOpened: true,
        data: { account: USDC_TOKEN, parentAccount: ETH_ACCOUNT_WITH_USDC },
      }),
    );
  });
});
