import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useDelegation } from "~/renderer/react/hooks";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { StepId } from "./DelegateFlowModal/types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useCoinModuleFeature } from "@ledgerhq/live-common/featureFlags/useCoinModuleFeature";
import { StakingFamily } from "./types";

const AccountHeaderManageActions: StakingFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source,
}) => {
  const dispatch = useDispatch();
  const label = useGetStakeLabelLocaleBased();

  const delegation = useDelegation(account);

  const showStaking = useCoinModuleFeature("stakingRewards", account.id);

  const onClick = useCallback(() => {
    if (isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
      return;
    }
    const options = delegation
      ? {
          parentAccount,
          account,
          eventType: "redelegate",
          stepId: "summary" as StepId, // FIXME: "summary is not detected as StepId"
          source,
        }
      : {
          parentAccount,
          account,
          source,
        };
    dispatch(openModal("MODAL_DELEGATE", options));
  }, [account, delegation, parentAccount, dispatch, source]);

  if (parentAccount || !showStaking) return null;

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
      accountActionsTestId: "stake-button-generic",
    },
  ];
};

export default AccountHeaderManageActions;
