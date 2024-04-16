import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { SubAccount } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/Coins";
import { ManageAction } from "../types";
import { useHistory } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";

type Props = {
  account: TronAccount | SubAccount;
  parentAccount: TronAccount | undefined | null;
};

const AccountHeaderManageActions = ({
  account,
  parentAccount,
}: Props): ManageAction[] | null | undefined => {
  const history = useHistory();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const { tronResources } = mainAccount;
  if (!tronResources || parentAccount) return null;

  const stakeOnClick = () => {
    const value = "/platform/stakekit";

    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      provider: "Stakekit",
      currency: "TRX",
    });
    history.push({
      pathname: value,
      state: {
        yieldId: "tron-trx-native-staking",
        accountId: account.id,
        returnTo: `/account/${account.id}`,
      },
    });
  };

  return [
    {
      key: "Stake",
      icon: IconCoins,
      label: t("account.stake"),
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      onClick: () => stakeOnClick(),
    },
  ];
};
export default AccountHeaderManageActions;
