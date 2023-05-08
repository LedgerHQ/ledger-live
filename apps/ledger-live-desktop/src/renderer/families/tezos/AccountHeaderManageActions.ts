import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { useDelegation } from "@ledgerhq/live-common/families/tezos/bakers";
type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};
const AccountHeaderManageActionsComponent = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const delegation = useDelegation(account);
  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
      return;
    }
    const options = delegation
      ? {
          parentAccount,
          account,
          eventType: "redelegate",
          stepId: "summary",
        }
      : {
          parentAccount,
          account,
        };
    dispatch(openModal("MODAL_DELEGATE", options));
  }, [account, delegation, parentAccount, dispatch]);
  if (parentAccount) return null;
  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label: t("account.stake"),
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};
const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { tezosResources } = mainAccount;
  if (!tezosResources) return null;
  return AccountHeaderManageActionsComponent({
    account,
    parentAccount,
  });
};
export default AccountHeaderManageActions;
