import { hasMinimumDelegableBalance } from "@ledgerhq/live-common/families/multiversx/helpers";
import { useMultiversXRandomizedValidators } from "@ledgerhq/live-common/families/multiversx/react";
import { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import { SubAccount } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import IconCoins from "~/renderer/icons/Coins";

const AccountHeaderManageActions = (props: {
  account: MultiversXAccount | SubAccount;
  parentAccount?: MultiversXAccount | null;
  source?: string;
}) => {
  const { account, source } = props;
  const dispatch = useDispatch();
  const label = useGetStakeLabelLocaleBased();
  const validators = useMultiversXRandomizedValidators();

  const earnRewardEnabled = useMemo(
    () => account.type === "Account" && hasMinimumDelegableBalance(account),
    [account],
  );

  const hasDelegations =
    account.type === "Account" && account.multiversxResources
      ? account.multiversxResources.delegations.length > 0
      : false;

  const onClick = useCallback(() => {
    if (account.type !== "Account") return;
    if (!earnRewardEnabled) {
      dispatch(openModal("MODAL_NO_FUNDS_STAKE", { account }));
    } else if (hasDelegations) {
      dispatch(
        openModal("MODAL_MULTIVERSX_DELEGATE", {
          account,
          validators,
          source,
        }),
      );
    } else {
      dispatch(
        openModal("MODAL_MULTIVERSX_REWARDS_INFO", {
          account,
          validators,
        }),
      );
    }
  }, [earnRewardEnabled, hasDelegations, dispatch, account, validators, source]);

  if (account.type !== "Account") return null;

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label,
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderManageActions;
