import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { SubAccount } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/Coins";
import { ManageAction } from "../types";
import noop from "lodash/noop";

type Props = {
  account: TronAccount | SubAccount;
  parentAccount: TronAccount | undefined | null;
};

const AccountHeaderManageActions = ({
  account,
  parentAccount,
}: Props): ManageAction[] | null | undefined => {
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const { tronResources } = mainAccount;
  if (!tronResources || parentAccount) return null;
  const disabledLabel = t("tron.voting.warnDisableStaking");
  return [
    {
      key: "Stake",
      disabled: true,
      icon: IconCoins,
      label: t("account.stake"),
      tooltip: disabledLabel,
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      onClick: noop,
    },
  ];
};
export default AccountHeaderManageActions;
