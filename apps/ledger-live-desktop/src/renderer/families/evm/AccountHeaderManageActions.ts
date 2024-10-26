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
  const isApeTokenAccount =
    account.type === "TokenAccount" && account.token.id === "ethereum/erc20/apecoin";
  const isCApeTokenAccount =
    account.type === "TokenAccount" &&
    account.token.contractAddress === "0xC5c9fB6223A989208Df27dCEE33fC59ff5c26fFF";

  const canStake = isEthereumAccount || isApeTokenAccount || isCApeTokenAccount;

  const onClickStake = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else if (account.type === "Account") {
      dispatch(
        openModal("MODAL_EVM_STAKE", {
          account,
        }),
      );
    } else {
      history.push({
        pathname: "/platform/stakekit",
        state: {
          yieldId: isCApeTokenAccount
            ? "ethereum-ape-parax-staking"
            : "ethereum-ape-native-staking",
          accountId: account.id,
          returnTo: `/account/${account.parentId}/${account.id}`,
        },
      });
    }
  }, [account, dispatch, history, isCApeTokenAccount, parentAccount]);

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
        label: t("account.stake", isEthereumAccount ? { currency: account?.currency?.name } : {}),
        accountActionsTestId: "stake-button",
      },
    ];
  } else {
    return [];
  }
};

export default AccountHeaderActions;
