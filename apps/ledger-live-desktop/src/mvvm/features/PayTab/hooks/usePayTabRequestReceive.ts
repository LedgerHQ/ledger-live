import { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { toReceiveTarget } from "@features/flow-receive";
import { openReceiveAddressDialog } from "@features/flow-receive/state";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import type { ThunkResult } from "~/renderer/actions/types";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDialog";
import { useOpenAssetAndAccount } from "../../ModularDialog/hooks/useOpenAssetAndAccount";

const REQUEST_SOURCE = "pay";

// Card top-ups only support stablecoins; filter MAD server-side by category so the
// user can still pick any supported network without exploding the request URL.
const REQUEST_CATEGORIES = [AssetCategory.Stablecoins] as const;

/**
 * The receive address dialog on the picked account, whatever `newReceiveFlow` says. An account the
 * account model does not know yet opens the legacy receive modal.
 */
const openRequestReceive =
  (account: AccountLike, parentAccount?: Account): ThunkResult =>
  (dispatch, getState) => {
    const mainAccount = account.type === "Account" ? account : parentAccount;
    const assetId = CryptoOrTokenCurrencyIdSchema.safeParse(getAccountCurrency(account).id);
    const target =
      mainAccount &&
      assetId.success &&
      toReceiveTarget(getState().accountEntries, mainAccount.id, assetId.data);

    if (!target) {
      dispatch(openModal("MODAL_RECEIVE", { account, parentAccount }));
      return;
    }
    dispatch(openReceiveAddressDialog({ ...target, source: REQUEST_SOURCE }));
  };

export type UsePayTabRequestReceive = Readonly<{
  open: () => void;
}>;

export function usePayTabRequestReceive(): UsePayTabRequestReceive {
  const dispatch = useDispatch();
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const open = useCallback(() => {
    dispatch(setFlowValue("request"));
    dispatch(setSourceValue(REQUEST_SOURCE));
    openAssetAndAccount({
      categories: REQUEST_CATEGORIES,
      onSuccess: (account, parentAccount) => dispatch(openRequestReceive(account, parentAccount)),
    });
  }, [dispatch, openAssetAndAccount]);

  return { open };
}
