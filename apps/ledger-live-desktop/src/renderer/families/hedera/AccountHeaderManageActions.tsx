import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/reducers/modals";
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

  if (!isStakingEnabled) {
    return [];
  }

  const onClick = () => {
    const modalKey = isAccountEmpty(account) ? "MODAL_NO_FUNDS_STAKE" : "MODAL_HEDERA_DELEGATION";
    dispatch(openModal(modalKey, { account }));
  };

  return [
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
  ];
};

export default AccountHeaderActions;
