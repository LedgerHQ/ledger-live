import { CryptoOrgAccount } from "@ledgerhq/live-common/families/crypto_org/types";
import { SubAccount } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: CryptoOrgAccount | SubAccount;
  parentAccount: CryptoOrgAccount | undefined | null;
  source?: string;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const history = useHistory();

  const onClick = useCallback(() => {
    history.push({
      pathname: "/platform/stakekit",
      state: {
        yieldId: "cronos-cro-native-staking",
        accountId: account.id,
        returnTo:
          account.type === "TokenAccount"
            ? `/account/${account.parentId}/${account.id}`
            : `/account/${account.id}`,
      },
    });
  }, [history, account]);

  if (parentAccount) return null;

  return [
    {
      key: "Stake",
      onClick,
      event: "button_clicked2",
      eventProperties: { button: "stake" },
      icon: IconCoins,
      label: t("account.stake"),
      accountActionsTestId: "stake-from-account-action-button",
    },
  ];
};

export default AccountHeaderActions;
