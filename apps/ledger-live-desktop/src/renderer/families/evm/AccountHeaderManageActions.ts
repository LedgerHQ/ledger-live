import { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import IconCoins from "~/renderer/icons/Coins";
import { openModal } from "~/renderer/actions/modals";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { useHistory } from "react-router";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();

  const isEthereumAccount = account.type === "Account" && account.currency.id === "ethereum";
  const isAvalancheCAccount =
    account.type === "Account" && account.currency.id === "avalanche_c_chain";

  const canStake = isEthereumAccount || isAvalancheCAccount;

  const onClickStake = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else if (isEthereumAccount) {
      dispatch(
        openModal("MODAL_EVM_STAKE", {
          account,
        }),
      );
    } else {
      const yieldId = "avalanche-avax-liquid-staking";

      history.push({
        pathname: "/platform/stakekit",
        state: {
          yieldId,
          accountId: account.id,
          returnTo:
            account.type === "TokenAccount"
              ? `/account/${account.parentId}/${account.id}`
              : `/account/${account.id}`,
        },
      });
    }
  }, [account, dispatch, history, isEthereumAccount, parentAccount]);

  if (canStake) {
    return [
      {
        key: "Stake",
        onClick: onClickStake,
        event: "button_clicked2",
        eventProperties: {
          button: "stake",
        },
        icon: IconCoins,
        label: t("account.stake", {
          currency: account?.currency?.name,
        }),
        accountActionsTestId: "stake-button",
      },
    ];
  } else {
    return [];
  }
};

export default AccountHeaderActions;
