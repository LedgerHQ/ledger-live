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
  const isEthereumMaticTokenAccount =
    account.type === "TokenAccount" && account.token.id === "ethereum/erc20/matic";

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
    } else if (isEthereumMaticTokenAccount) {
      history.push({
        pathname: "/platform/stakekit",
        state: {
          yieldId: "ethereum-matic-native-staking",
          accountId: account.id,
          returnTo: `/account/${account.parentId}/${account.id}`,
        },
      });
    }
  }, [account, dispatch, parentAccount, isEthereumMaticTokenAccount, isEthereumAccount, history]);

  if (isEthereumAccount || isEthereumMaticTokenAccount) {
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
          currency: isEthereumAccount
            ? account?.currency?.name
            : isEthereumMaticTokenAccount
            ? account?.token?.name
            : undefined,
        }),
        accountActionsTestId: "stake-from-account-action-button",
      },
    ];
  } else {
    return [];
  }
};

export default AccountHeaderActions;
