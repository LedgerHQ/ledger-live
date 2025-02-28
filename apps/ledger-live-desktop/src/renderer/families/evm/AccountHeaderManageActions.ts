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
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib-es/currencies";

type Props = {
  account: AccountLike;
  parentAccount?: Account | null;
};

const PARTNER_STAKING_CURRENCY_IDS = ["ethereum", "bsc", "polygon"]; // maybe "ethereum/erc20/polygon_ecosystem_token" ?

const STABLECOINS = ["ethereum/erc20/usd_tether__erc20_", "ethereum/erc20/usd__coin"];

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const label = useGetStakeLabelLocaleBased();
  const walletState = useSelector(walletSelector);

  // const {ticker }  = getCryptoCurrencyById(account.currency.id);

  const isEthereumAccount = account.type === "Account" && account.currency.id === "ethereum";
  const isBscAccount = account.type === "Account" && account.currency.id === "bsc";
  const isPOLAccount = account.type === "Account" && account.currency.id === "polygon";

  // TODO: this is a token account thing, so we should not add here to family account actions. It can be done on the AccountHeaderActions screen itself.
  const isStablecoinAccount =
    account.type === "TokenAccount" && STABLECOINS.includes(account.token.id); //  === "ethereum/erc20/usd_tether__erc20_";

  console.log(`>>> is x account?`, { isEthereumAccount, isBscAccount, isPOLAccount });

  const onClickKiln = useCallback(
    (someParam?: string) => {
      const value = "/platform/kiln"; // TODO: will be kiln-widget or kiln-defi

      history.push({
        pathname: value,
        state: {
          // yieldId,
          accountId: account.id,
          returnTo: `/account/${account.id}`, // or earn
        },
      });
    },
    [account.id, history],
  );

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

  // TODO: this is a token account thing, so we should not add here to family account actions. It can be done on the AccountHeaderActions screen itself.
  const getStakeAction = useCallback(() => {
    if (isStablecoinAccount) {
      onClickKiln("stablecoin");
    } else if (isEthereumAccount) {
      onClickStakeModal();
    } else if (isBscAccount) {
      onClickStakekit("bsc-bnb-native-staking");
    } else if (isPOLAccount) {
      onClickStakekit("ethereum-matic-native-staking");
    }
  }, [
    isStablecoinAccount,
    isEthereumAccount,
    isBscAccount,
    isPOLAccount,
    onClickKiln,
    onClickStakeModal,
    onClickStakekit,
  ]);

  if (isEthereumAccount || isBscAccount || isPOLAccount) {
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
