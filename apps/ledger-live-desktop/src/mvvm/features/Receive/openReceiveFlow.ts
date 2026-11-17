import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { selectFeature } from "@shared/feature-flags";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  resolveReceiveFamilyConfig,
  showsReceiveOptions,
  toReceiveTarget,
} from "@features/flow-receive";
import { openModal } from "~/renderer/actions/modals";
import type { ThunkResult } from "~/renderer/actions/types";
import { importLLDCoinFamily } from "~/renderer/families";
import type { State } from "~/renderer/reducers";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { onboardingReceiveFlowSelector } from "~/renderer/reducers/onboarding";
import { openReceiveAddressDialog } from "@features/flow-receive/state";
import type { ModalData } from "~/renderer/modals/types";
import { openAssetAndAccountDialog } from "LLD/features/ModularDialog/hooks/useOpenAssetAndAccount";

type LegacyReceiveData = NonNullable<ModalData["MODAL_RECEIVE"]>;

type SelectedAccount = Readonly<{
  account: AccountLike;
  parentAccount?: Account | null;
  /** Picked in the asset dialog: the legacy modal opens on it, not in token mode. */
  fromAssetDialog?: boolean;
}>;

/**
 * The `MODAL_RECEIVE` payload, plus the account an asset page preselects. An asset page's
 * `currencyIds` limit the asset dialog, and the Noah options, to its assets.
 */
export type OpenReceiveFlowData = LegacyReceiveData &
  Readonly<{
    /** Asset page: the account the legacy modal preselects; the new flow lets the user pick. */
    legacyAccount?: Readonly<{ account: AccountLike; parentAccount?: Account | null }>;
  }>;

/**
 * Single entry of the receive flow on desktop:
 * - `newReceiveFlow` off, onboarding receive, or Noah options to show: `MODAL_RECEIVE`, unchanged;
 * - an account: the receive address dialog, or `MODAL_RECEIVE` when the account model doesn't know
 *   the account or its family is not supported;
 * - no account, or a token to pick on an account's network: the asset dialog, then the same.
 * A failure while routing falls back to `MODAL_RECEIVE`.
 */
export const openReceiveFlow =
  (data: OpenReceiveFlowData = {}): ThunkResult<Promise<void>> =>
  async (dispatch, getState) => {
    const { currencyIds, legacyAccount, ...legacyData } = data;
    const state = getState();
    const flag = selectFeature(state, "newReceiveFlow");
    const openLegacy = (selected?: SelectedAccount, { withReceiveOptions = false } = {}) => {
      const preselected = selected ?? legacyAccount;
      dispatch(
        openModal("MODAL_RECEIVE", {
          ...legacyData,
          ...(withReceiveOptions && { currencyIds }),
          ...(selected?.fromAssetDialog && { receiveTokenMode: false }),
          ...(preselected && {
            account: preselected.account,
            parentAccount: preselected.parentAccount,
          }),
        }),
      );
    };

    if (!flag?.enabled || onboardingReceiveFlowSelector(state)) {
      openLegacy();
      return;
    }

    if (showsNoahOptions(state, data)) {
      openLegacy(undefined, { withReceiveOptions: true });
      return;
    }

    const openForAccount = async (selected: SelectedAccount) => {
      try {
        await routeAccount(selected);
      } catch {
        openLegacy(selected);
      }
    };

    const routeAccount = async (selected: SelectedAccount) => {
      const { account, parentAccount } = selected;
      const mainAccount = findMainAccount(getState(), account, parentAccount);
      const asset = getAccountCurrency(account);
      const assetId = CryptoOrTokenCurrencyIdSchema.safeParse(asset.id);
      const target =
        mainAccount &&
        assetId.success &&
        toReceiveTarget(getState().accountEntries, mainAccount.id, assetId.data);
      if (!mainAccount || !target) {
        openLegacy(selected);
        return;
      }

      const family = mainAccount.currency.family;
      const coinFamily = await importLLDCoinFamily(family);
      const { isSupported } = resolveReceiveFamilyConfig({
        family,
        familyConfig: coinFamily.receiveAddressConfig?.({
          descriptor: target.descriptor,
          asset,
          featureFlags: getState().featureFlags.resolved,
          legacyAccount: mainAccount,
        }),
        excludedFamilies: flag.params?.excludedFamilies ?? [],
      });
      if (!isSupported) {
        openLegacy(selected);
        return;
      }

      dispatch(
        openReceiveAddressDialog({
          accountUUID: target.accountUUID,
          assetId: target.assetId,
          source: data.sourcePage,
        }),
      );
    };

    const tokenNetworkId =
      data.receiveTokenMode && data.account
        ? findMainAccount(state, data.account, data.parentAccount)?.currency.id
        : undefined;

    if (data.account && !tokenNetworkId) {
      await openForAccount({ account: data.account, parentAccount: data.parentAccount });
      return;
    }

    openAssetAndAccountDialog(
      {
        currencies: currencyIds ? [...currencyIds] : [],
        areCurrenciesFiltered: Boolean(currencyIds?.length),
        networkIds: tokenNetworkId ? [tokenNetworkId] : undefined,
        flow: ModularDrawerLocation.RECEIVE_FLOW,
        source: data.sourcePage,
        onSuccess: (account, parentAccount) =>
          void openForAccount({ account, parentAccount, fromAssetDialog: true }),
      },
      dispatch,
    );
  };

function findMainAccount(
  state: State,
  account: AccountLike,
  parentAccount?: Account | null,
): Account | undefined {
  if (account.type === "Account") return account;
  return parentAccount ?? accountsSelector(state).find(({ id }) => id === account.parentId);
}

function showsNoahOptions(
  state: State,
  { account, currencyIds, shouldUseReceiveOptions }: OpenReceiveFlowData,
): boolean {
  return showsReceiveOptions({
    noah: selectFeature(state, "noah"),
    shouldUseReceiveOptions,
    accountAssetId: account ? getAccountCurrency(account).id : undefined,
    pageAssetIds: currencyIds,
  });
}

/** `openModal` for openers given any modal name: `MODAL_RECEIVE` goes through `openReceiveFlow`. */
export const openModalWithReceiveFlow =
  <Name extends keyof ModalData>(name: Name, data: ModalData[Name]): ThunkResult =>
  dispatch => {
    if (name === "MODAL_RECEIVE") {
      void dispatch(openReceiveFlow((data ?? undefined) as OpenReceiveFlowData | undefined));
      return;
    }
    dispatch(openModal(name, data));
  };
