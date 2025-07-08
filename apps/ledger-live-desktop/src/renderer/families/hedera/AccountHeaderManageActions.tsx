import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import IconCoins from "~/renderer/icons/Coins";
import type { HederaFamily } from "~/renderer/families/hedera/types";
import { useStake } from "LLD/hooks/useStake";

const AccountHeaderActions: HederaFamily["accountHeaderManageActions"] = ({ account }) => {
  const label = useGetStakeLabelLocaleBased();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { getCanStakeCurrency } = useStake();

  if (account.type !== "Account") {
    return [];
  }

  const isStakingEnabled = getCanStakeCurrency(account.currency.id);
  const isAlreadyStaked = !!account.hederaResources?.delegation;

  const onClick = () => {
    if (isAccountEmpty(account)) {
      dispatch(openModal("MODAL_NO_FUNDS_STAKE", { account }));
    } else {
      dispatch(openModal("MODAL_HEDERA_DELEGATE", { account }));
    }
  };

  return isStakingEnabled
    ? [
        {
          key: "Stake",
          onClick: onClick,
          icon: IconCoins,
          disabled: isAlreadyStaked,
          tooltip: isAlreadyStaked
            ? t("hedera.account.header.actions.stake.alreadyDelegatedTooltip")
            : undefined,
          label,
          event: "button_clicked2",
          eventProperties: { button: "stake" },
          accountActionsTestId: "stake-button",
        },
      ]
    : [];
};

export default AccountHeaderActions;
