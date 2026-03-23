import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { MinaFamily } from "./types";
import { useTranslation } from "react-i18next";

const AccountHeaderManageActions: MinaFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const hasDelegation = mainAccount.resources?.stakingActive;

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_MINA_STAKE", {
        account: mainAccount,
      }),
    );
  }, [dispatch, mainAccount]);

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label: hasDelegation
        ? t("mina.accountHeaderManageActions.changeDelegation")
        : t("mina.accountHeaderManageActions.earn"),
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
      disabled: false,
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderManageActions;
