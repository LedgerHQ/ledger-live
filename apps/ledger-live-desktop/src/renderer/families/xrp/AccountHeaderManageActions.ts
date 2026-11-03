import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import {
  Transaction,
  TransactionStatus,
  XrpOperation,
  XrpTokenAccount,
} from "@ledgerhq/live-common/families/xrp/types";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconTrash from "~/renderer/icons/Trash";
import { LLDCoinFamily } from "../types";

type XrpFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, XrpOperation>;

// A token is removed once empty: the ledger keeps a trust line with a balance, and refuses to delete
// such an MPToken. An IOU's limit is edited from the balance footer
const AccountHeaderManageActions: XrpFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const onRemove = useCallback(() => {
    if (account.type !== "TokenAccount" || !parentAccount) return;

    dispatch(
      openModal("MODAL_XRP_ADD_TOKEN", {
        account: parentAccount,
        tokenAccount: account,
        action: "remove",
      }),
    );
  }, [account, parentAccount, dispatch]);

  if (account.type !== "TokenAccount" || !parentAccount) return null;

  // No resources once the trust line or MPToken is gone: the generic bridge still keeps the token
  // account, at 0, for its history, and a removal would fail
  if (!(account as XrpTokenAccount).xrpResources) return null;

  const hasBalance = !account.balance.isZero();

  return [
    {
      key: "xrpRemoveToken",
      onClick: onRemove,
      icon: IconTrash,
      label: t("xrp.tokenAccount.removeToken"),
      disabled: hasBalance,
      tooltip: hasBalance ? t("xrp.tokenAccount.removeDisabled") : undefined,
      event: "button_clicked2",
      eventProperties: { button: "remove_token" },
    },
  ];
};

export default AccountHeaderManageActions;
