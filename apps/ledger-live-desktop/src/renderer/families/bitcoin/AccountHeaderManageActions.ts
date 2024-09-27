import { getMainAccount } from "@ledgerhq/live-common/account/index";

import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { TokenAccount } from "@ledgerhq/types-live";

type Props = {
  account: BitcoinAccount | TokenAccount;
  parentAccount: BitcoinAccount | undefined | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const history = useHistory();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, parentAccount);
  const { bitcoinResources } = mainAccount;
  if (!bitcoinResources || parentAccount) return null;

  const stakeOnClick = () => {
    const value = "/platform/acre-testnet";

    track("button_clicked2", {
      ...stakeDefaultTrack,
      delegation: "stake",
      page: "Page Account",
      button: "delegate",
      provider: "Acre",
      currency: "BTC",
    });
    history.push({
      pathname: value,
      state: {
        accountId: account.id,
        returnTo: `/account/${account.id}`,
      },
    });
  };

  return [
    {
      key: "Yield",
      icon: () => null,
      label: t("account.yield"),
      event: "button_clicked2",
      eventProperties: {
        button: "yield",
      },
      onClick: () => stakeOnClick(),
    },
  ];
};

export default AccountHeaderActions;
