import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { useFeature } from "@features/platform-feature-flags";
import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { TezosFamily } from "./types";
import { StepId } from "./DelegateFlowModal/types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";

const AccountHeaderManageActions: TezosFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
  source,
}) => {
  const dispatch = useDispatch();
  const bridge = useAccountBridge(account, parentAccount);
  const label = useGetStakeLabelLocaleBased();
  const lldTezosStaking = useFeature("lldTezosStaking");

  const { delegation, isStaked } = useTezosStakingInfo(account);

  const onClick = useCallback(() => {
    if (account.type !== "Account") return;
    if (bridge.isAccountEmpty(account)) {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount,
        }),
      );
      return;
    }
    if (lldTezosStaking?.enabled && !isStaked) {
      dispatch(
        openModal("MODAL_TEZOS_EARNING_CHOICE", {
          account,
          parentAccount,
          source,
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
  }, [
    account,
    bridge,
    delegation,
    isStaked,
    lldTezosStaking?.enabled,
    parentAccount,
    dispatch,
    source,
  ]);

  if (parentAccount) return null;

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
