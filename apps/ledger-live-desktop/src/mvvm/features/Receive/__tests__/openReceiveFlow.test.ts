import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { importLLDCoinFamily } from "~/renderer/families";
import type { State } from "~/renderer/reducers";
import { openReceiveAddressDialog } from "~/renderer/reducers/receiveFlow";
import { openAssetAndAccountDialog } from "LLD/features/ModularDialog/hooks/useOpenAssetAndAccount";
import { openModalWithReceiveFlow, openReceiveFlow } from "../openReceiveFlow";

jest.mock("~/renderer/families", () => ({ importLLDCoinFamily: jest.fn() }));
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetAndAccount", () => ({
  openAssetAndAccountDialog: jest.fn(),
}));

const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const ethereum = getCryptoCurrencyById("ethereum");
const ethAccount: Account = { ...genAccount("eth", { currency: ethereum }), id: entry.legacyId };
const usdcAccount = {
  type: "TokenAccount",
  id: `${entry.legacyId}+ethereum%2Ferc20%2Fusd__coin`,
  parentId: entry.legacyId,
  token: { type: "TokenCurrency", id: "ethereum/erc20/usd__coin", parentCurrency: ethereum },
} as unknown as TokenAccount;
const unknownAccount: Account = genAccount("unknown", { currency: ethereum });

type Flags = Partial<{
  newReceiveFlow: { enabled: boolean; params: { excludedFamilies: string[] } };
  noah: { enabled: boolean; params: { activeCurrencyIds: string[] } };
}>;

function makeState({
  flags = { newReceiveFlow: { enabled: true, params: { excludedFamilies: [] } } },
  onboardingReceive = false,
}: { flags?: Flags; onboardingReceive?: boolean } = {}) {
  return {
    featureFlags: { resolved: flags },
    accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
    accounts: [ethAccount],
    onboarding: { isOnboardingReceiveFlow: onboardingReceive },
  } as unknown as State;
}

async function run(thunk: ReturnType<typeof openReceiveFlow>, state = makeState()) {
  const dispatch = jest.fn();
  await thunk(dispatch, () => state, undefined);
  return dispatch;
}

const legacyModal = (data: object) =>
  expect.objectContaining({
    payload: { name: "MODAL_RECEIVE", data: expect.objectContaining(data) },
  });

describe("openReceiveFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(importLLDCoinFamily).mockResolvedValue({} as never);
  });

  it("opens the address dialog for an account the account model holds", async () => {
    const dispatch = await run(
      openReceiveFlow({ account: ethAccount, sourcePage: "Account Page" }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      openReceiveAddressDialog({
        accountUUID: entry.accountUUID,
        assetId: "ethereum" as never,
        source: "Account Page",
      }),
    );
  });

  it("opens the address dialog on the token of a token account", async () => {
    const dispatch = await run(
      openReceiveFlow({ account: usdcAccount, parentAccount: ethAccount }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      openReceiveAddressDialog(
        expect.objectContaining({ accountUUID: entry.accountUUID, assetId: usdcAccount.token.id }),
      ),
    );
  });

  it("finds the parent of a token account given without it", async () => {
    const dispatch = await run(openReceiveFlow({ account: usdcAccount }));

    expect(dispatch).toHaveBeenCalledWith(
      openReceiveAddressDialog(expect.objectContaining({ accountUUID: entry.accountUUID })),
    );
  });

  describe("keeps the legacy modal", () => {
    it("when the flag is off", async () => {
      const state = makeState({
        flags: { newReceiveFlow: { enabled: false, params: { excludedFamilies: [] } } },
      });
      const dispatch = await run(openReceiveFlow({ account: ethAccount, sourcePage: "x" }), state);

      expect(dispatch).toHaveBeenCalledWith(legacyModal({ account: ethAccount, sourcePage: "x" }));
      expect(importLLDCoinFamily).not.toHaveBeenCalled();
    });

    it("when the account model does not hold the account", async () => {
      const dispatch = await run(openReceiveFlow({ account: unknownAccount }));

      expect(dispatch).toHaveBeenCalledWith(legacyModal({ account: unknownAccount }));
    });

    it("when the family is excluded by the flag", async () => {
      const state = makeState({
        flags: { newReceiveFlow: { enabled: true, params: { excludedFamilies: ["evm"] } } },
      });
      const dispatch = await run(openReceiveFlow({ account: ethAccount }), state);

      expect(dispatch).toHaveBeenCalledWith(legacyModal({ account: ethAccount }));
    });

    it("when the family config does not support the account", async () => {
      jest.mocked(importLLDCoinFamily).mockResolvedValue({
        receiveAddressConfig: () => ({ isSupported: false }),
      } as never);
      const dispatch = await run(openReceiveFlow({ account: ethAccount }));

      expect(dispatch).toHaveBeenCalledWith(legacyModal({ account: ethAccount }));
    });

    it("during the onboarding receive", async () => {
      const dispatch = await run(
        openReceiveFlow({ account: ethAccount }),
        makeState({ onboardingReceive: true }),
      );

      expect(dispatch).toHaveBeenCalledWith(legacyModal({ account: ethAccount }));
    });

    it("for an asset with the Noah bank transfer option", async () => {
      const state = makeState({
        flags: {
          newReceiveFlow: { enabled: true, params: { excludedFamilies: [] } },
          noah: { enabled: true, params: { activeCurrencyIds: ["ethereum"] } },
        },
      });
      const dispatch = await run(openReceiveFlow({ account: ethAccount }), state);

      expect(dispatch).toHaveBeenCalledWith(legacyModal({ account: ethAccount }));
    });
  });

  describe("without an account", () => {
    it("opens the asset dialog, then routes the selected account", async () => {
      const dispatch = await run(openReceiveFlow({ sourcePage: "Portfolio" }));

      const [params] = jest.mocked(openAssetAndAccountDialog).mock.calls[0];
      expect(params).toMatchObject({ currencies: [], flow: "receive", source: "Portfolio" });

      params.onSuccess?.(ethAccount);
      await new Promise(resolve => setImmediate(resolve));
      expect(dispatch).toHaveBeenCalledWith(
        openReceiveAddressDialog(expect.objectContaining({ accountUUID: entry.accountUUID })),
      );
    });

    it("limits the asset dialog to the network of a token mode account", async () => {
      await run(openReceiveFlow({ account: ethAccount, receiveTokenMode: true }));

      expect(openAssetAndAccountDialog).toHaveBeenCalledWith(
        expect.objectContaining({ networkIds: ["ethereum"] }),
        expect.any(Function),
      );
    });

    it("limits the asset dialog to the assets of an asset page without a Noah asset", async () => {
      const state = makeState({
        flags: {
          newReceiveFlow: { enabled: true, params: { excludedFamilies: [] } },
          noah: { enabled: true, params: { activeCurrencyIds: ["ethereum/erc20/usd__coin"] } },
        },
      });
      await run(openReceiveFlow({ currencyIds: ["bitcoin"] }), state);

      expect(openAssetAndAccountDialog).toHaveBeenCalledWith(
        expect.objectContaining({ currencies: ["bitcoin"], areCurrenciesFiltered: true }),
        expect.any(Function),
      );
    });

    it("keeps the legacy modal and its options on an asset page with a Noah asset", async () => {
      const state = makeState({
        flags: {
          newReceiveFlow: { enabled: true, params: { excludedFamilies: [] } },
          noah: { enabled: true, params: { activeCurrencyIds: ["ethereum/erc20/usd__coin"] } },
        },
      });
      const dispatch = await run(
        openReceiveFlow({ currencyIds: ["ethereum/erc20/usd__coin"] }),
        state,
      );

      expect(openAssetAndAccountDialog).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(legacyModal({}));
    });
  });
});

describe("openModalWithReceiveFlow", () => {
  it("opens any other modal as is", () => {
    const dispatch = jest.fn();
    openModalWithReceiveFlow("MODAL_SETTINGS_ACCOUNT", { account: ethAccount } as never)(
      dispatch,
      () => makeState(),
      undefined,
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ name: "MODAL_SETTINGS_ACCOUNT" }),
      }),
    );
  });

  it("routes MODAL_RECEIVE through openReceiveFlow", () => {
    const dispatch = jest.fn();
    openModalWithReceiveFlow("MODAL_RECEIVE", { account: ethAccount })(
      dispatch,
      () => makeState(),
      undefined,
    );

    expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
  });
});
