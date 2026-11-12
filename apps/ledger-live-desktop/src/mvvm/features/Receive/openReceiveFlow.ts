import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { selectFeature } from "@shared/feature-flags";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { resolveReceiveFamilyTraits } from "@features/flow-receive";
import { openModal } from "~/renderer/actions/modals";
import type { ThunkResult } from "~/renderer/actions/types";
import { importLLDCoinFamily } from "~/renderer/families";
import type { Data as LegacyReceiveData } from "~/renderer/modals/Receive/Body";
import { onboardingReceiveFlowSelector } from "~/renderer/reducers/onboarding";
import { openReceiveAddressDialog } from "~/renderer/reducers/receiveFlow";
import { openAssetAndAccountDialog } from "../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { selectAccountEntry, selectAccountUUIDOfLegacyAccount } from "./receiveAccount";

/**
 * Same payload as `MODAL_RECEIVE`, so every legacy `openModal("MODAL_RECEIVE", data)` call becomes
 * `openReceiveFlow(data)`, plus what only the new flow uses.
 */
export type OpenReceiveFlowData = LegacyReceiveData &
  Readonly<{
    /** Restricts the Modular Dialog to these assets (asset detail page). */
    currencyIds?: readonly string[];
    /** The legacy modal preselects this account; the new flow lets the user pick in the dialog. */
    legacyAccount?: Readonly<{ account: AccountLike; parentAccount?: Account }>;
  }>;

/**
 * Single entry of the receive flow on desktop. Works from React and from non-React code
 * (deeplinks, onboarding logic):
 * - `newReceiveFlow` off: the legacy `MODAL_RECEIVE`, unchanged;
 * - Noah receive options to show first: the legacy modal shows them, its crypto option comes back here;
 * - account known: the receive address dialog, or the legacy modal when the family is not supported;
 * - otherwise: the Modular Dialog (asset → network → account), then the same.
 */
export const openReceiveFlow =
  (data: OpenReceiveFlowData = {}): ThunkResult =>
  (dispatch, getState) => {
    const { currencyIds, legacyAccount, ...legacyData } = data;
    const state = getState();
    const flag = selectFeature(state, "newReceiveFlow");

    const openLegacy = (account?: AccountLike | null, parentAccount?: Account | null) =>
      dispatch(
        openModal("MODAL_RECEIVE", {
          ...legacyData,
          ...(account ? { account, parentAccount } : legacyAccount),
        }),
      );

    if (!flag?.enabled || shouldShowNoahOptions(state, data)) {
      openLegacy(data.account, data.parentAccount);
      return;
    }

    const openForAccount = async (account: AccountLike, parentAccount?: Account) => {
      const mainAccount = getMainAccount(account, parentAccount);
      const accountUUID = selectAccountUUIDOfLegacyAccount(getState(), mainAccount.id);
      const entry = accountUUID && selectAccountEntry(getState(), accountUUID);
      if (!entry) {
        openLegacy(account, parentAccount);
        return;
      }

      const asset = getAccountCurrency(account);
      const family = mainAccount.currency.family;
      const coinFamily = await importLLDCoinFamily(family);
      const { isSupported } = resolveReceiveFamilyTraits({
        family,
        familyConfig: coinFamily?.receiveAddressConfig?.({
          descriptor: entry.descriptor,
          asset,
          featureFlags: getState().featureFlags.resolved,
          legacyAccount: mainAccount,
        }),
        excludedFamilies: flag.params?.excludedFamilies,
      });
      if (!isSupported) {
        openLegacy(account, parentAccount);
        return;
      }

      // The dialog reads the `receive` account data: a first read syncs the account, so it does
      // not wait here. Onboarding or a token to activate hand over to the legacy modal from there.
      dispatch(
        openReceiveAddressDialog({
          accountUUID: entry.accountUUID,
          assetId: CryptoOrTokenCurrencyIdSchema.parse(asset.id),
          source: data.sourcePage,
        }),
      );
    };

    // Token list: pick which asset of this account's network to receive.
    const tokenNetworkId =
      data.receiveTokenMode && data.account
        ? getMainAccount(data.account, data.parentAccount).currency.id
        : undefined;

    if (data.account && !tokenNetworkId) {
      void openForAccount(data.account, data.parentAccount ?? undefined);
      return;
    }

    openAssetAndAccountDialog(
      {
        currencies: currencyIds ? [...currencyIds] : [],
        areCurrenciesFiltered: Boolean(currencyIds?.length),
        networkIds: tokenNetworkId ? [tokenNetworkId] : undefined,
        flow: "receive",
        source: data.sourcePage,
        onSuccess: (account, parentAccount) => void openForAccount(account, parentAccount),
      },
      dispatch,
    );
  };

/** Mirrors the legacy modal's first step: Noah's "crypto or bank transfer" choice. */
function shouldShowNoahOptions(
  state: Parameters<ThunkResult>[1] extends () => infer S ? S : never,
  { account, currencyIds, shouldUseReceiveOptions }: OpenReceiveFlowData,
): boolean {
  const noah = selectFeature(state, "noah");
  if (!noah?.enabled || shouldUseReceiveOptions === false) return false;
  if (onboardingReceiveFlowSelector(state)) return false;
  const activeCurrencyIds = noah.params?.activeCurrencyIds ?? [];
  if (account) return activeCurrencyIds.includes(getAccountCurrency(account).id);
  // Asset detail page: the options only matter when one of its assets has a bank transfer option.
  if (currencyIds?.length) return currencyIds.some(id => activeCurrencyIds.includes(id));
  return true;
}
