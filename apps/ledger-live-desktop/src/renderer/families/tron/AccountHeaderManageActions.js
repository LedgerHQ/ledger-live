// @flow
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
};

const AccountHeaderManageActionsComponent = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();

  if (parentAccount) return null;

  const disabledLabel = t("tron.voting.warnDisableStaking");

  return [
    {
      key: "Stake",
      icon: IconCoins,
      disabled: true,
      label: t("account.stake"),
      tooltip: disabledLabel,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};

const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { tronResources } = mainAccount;

  if (!tronResources) return null;

  return AccountHeaderManageActionsComponent({ account, parentAccount });
};

export default AccountHeaderManageActions;
