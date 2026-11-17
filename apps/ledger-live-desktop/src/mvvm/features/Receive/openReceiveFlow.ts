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

/** The `MODAL_RECEIVE` payload, plus the assets an asset page receives. */
export type OpenReceiveFlowData = LegacyReceiveData &
  Readonly<{
    /** Asset page: limits the asset dialog, and the Noah options, to its assets. */
    currencyIds?: readonly string[];
  }>;

/**
 * Single entry of the receive flow on desktop:
 * - `newReceiveFlow` off, onboarding receive, or Noah options to show: `MODAL_RECEIVE`, unchanged;
 * - an account: the receive address dialog, or `MODAL_RECEIVE` when the account model doesn't know
 *   the account or its family is not supported;
 * - no account, or a token to pick on an account's network: the asset dialog, then the same.
 */
export const openReceiveFlow =
  (data: OpenReceiveFlowData = {}): ThunkResult<Promise<void>> =>
  async (dispatch, getState) => {
    const { currencyIds, ...legacyData } = data;
    const state = getState();
    const flag = selectFeature(state, "newReceiveFlow");
    const openLegacy = (account = data.account, parentAccount = data.parentAccount) => {
      dispatch(openModal("MODAL_RECEIVE", { ...legacyData, account, parentAccount }));
    };

    if (!flag.enabled || onboardingReceiveFlowSelector(state) || showsNoahOptions(state, data)) {
      openLegacy();
      return;
    }

    const openForAccount = async (account: AccountLike, parentAccount?: Account | null) => {
      const mainAccount = findMainAccount(getState(), account, parentAccount);
      const asset = getAccountCurrency(account);
      const assetId = CryptoOrTokenCurrencyIdSchema.safeParse(asset.id);
      const target =
        mainAccount &&
        assetId.success &&
        toReceiveTarget(getState().accountEntries, mainAccount.id, assetId.data);
      if (!mainAccount || !target) {
        openLegacy(account, parentAccount);
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
        openLegacy(account, parentAccount);
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
      await openForAccount(data.account, data.parentAccount);
      return;
    }

    openAssetAndAccountDialog(
      {
        currencies: currencyIds ? [...currencyIds] : [],
        areCurrenciesFiltered: Boolean(currencyIds?.length),
        networkIds: tokenNetworkId ? [tokenNetworkId] : undefined,
        flow: ModularDrawerLocation.RECEIVE_FLOW,
        source: data.sourcePage,
        onSuccess: (account, parentAccount) => void openForAccount(account, parentAccount),
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
