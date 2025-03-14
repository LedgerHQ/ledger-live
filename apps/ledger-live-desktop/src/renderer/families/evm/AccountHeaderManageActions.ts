import { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import IconCoins from "~/renderer/icons/Coins";
import { openModal } from "~/renderer/actions/modals";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useHistory } from "react-router";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { walletSelector } from "~/renderer/reducers/wallet";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const label = useGetStakeLabelLocaleBased();
  const walletState = useSelector(walletSelector);

  const isEthereumAccount = account.type === "Account" && account.currency.id === "ethereum";
  const isBscAccount = account.type === "Account" && account.currency.id === "bsc";
  const isPOLAccount =
    account.type === "TokenAccount" &&
    account.token.id === "ethereum/erc20/polygon_ecosystem_token";
  const isAvaxAccount = account.type === "Account" && account.currency.id === "avalanche_c_chain";

  const onClickStakekit = useCallback(
    (yieldId: string) => {
      const value = "/platform/stakekit";

      history.push({
        pathname: value,
        state: {
          yieldId,
          accountId: account.id,
          returnTo: `/account/${account.id}`,
        },
      });
    },
    [account.id, history],
  );

  const onClickStakeModal = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else if (account.type === "Account") {
      const walletApiAccount = accountToWalletAPIAccount(walletState, account, parentAccount);
      dispatch(
        openModal("MODAL_EVM_STAKE", {
          account: walletApiAccount,
        }),
      );
    }
  }, [account, dispatch, parentAccount, walletState]);

  const getStakeAction = useCallback(() => {
    if (isEthereumAccount) {
      onClickStakeModal();
    } else if (isBscAccount) {
      onClickStakekit("bsc-bnb-native-staking");
    } else if (isPOLAccount) {
      onClickStakekit("ethereum-matic-native-staking");
    } else if (isAvaxAccount) {
      onClickStakekit("avalanche-avax-liquid-staking");
    }
  }, [
    isEthereumAccount,
    isBscAccount,
    isAvaxAccount,
    onClickStakeModal,
    onClickStakekit,
    isPOLAccount,
  ]);

  if (isEthereumAccount || isBscAccount || isPOLAccount || isAvaxAccount) {
    return [
      {
        key: "Stake",
        onClick: getStakeAction,
        event: "button_clicked2",
        eventProperties: {
          button: "stake",
        },
        icon: IconCoins,
        label,
        accountActionsTestId: "stake-button",
      },
    ];
  } else {
    return [];
  }
};

export default AccountHeaderActions;
