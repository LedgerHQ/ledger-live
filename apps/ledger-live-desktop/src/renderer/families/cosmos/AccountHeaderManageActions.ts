import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { openModal } from "~/renderer/actions/modals";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: CosmosAccount | TokenAccount;
  parentAccount: CosmosAccount | undefined | null;
  source?: string;
};

const AccountHeaderActions = ({ account, parentAccount, source }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const label = useGetStakeLabelLocaleBased();
  const history = useHistory();
  const mainAccount = getMainAccount(account, parentAccount);
  const { cosmosResources } = mainAccount;
  const earnRewardEnabled = canDelegate(mainAccount);
  const hasDelegations = cosmosResources.delegations.length > 0;
  const isCroAccount = account.type === "Account" && account.currency.id === "crypto_org";

  const onClickStakekit = useCallback(() => {
    const value = "/platform/stakekit";
    if (!earnRewardEnabled) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else {
      history.push({
        pathname: value,
        state: {
          yieldId: "cronos-cro-native-staking",
          accountId: account.id,
          returnTo: `/account/${account.id}`,
        },
      });
    }
  }, [history, account, dispatch, earnRewardEnabled, parentAccount]);

  const onClick = useCallback(() => {
    if (account.type !== "Account") return;
    if (!earnRewardEnabled) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
    } else if (hasDelegations) {
      dispatch(
        openModal("MODAL_COSMOS_DELEGATE", {
          account,
          source,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_COSMOS_REWARDS_INFO", {
          account,
        }),
      );
    }
  }, [account, earnRewardEnabled, hasDelegations, dispatch, parentAccount, source]);
  if (parentAccount) return null;
  const disabledLabel = earnRewardEnabled ? "" : t("cosmos.delegation.minSafeWarning");
  return [
    {
      key: "Stake",
      onClick: isCroAccount ? onClickStakekit : onClick,
      icon: IconCoins,
      label,
      tooltip: disabledLabel,
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderActions;
