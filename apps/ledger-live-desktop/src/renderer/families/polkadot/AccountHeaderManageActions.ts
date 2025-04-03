import { useTranslation } from "react-i18next";
import { TokenAccount } from "@ledgerhq/types-live";
import {
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import IconCoins from "~/renderer/icons/Coins";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useHistory } from "react-router";

type Props = {
  account: PolkadotAccount | TokenAccount;
  parentAccount: PolkadotAccount | undefined | null;
  source?: string;
};

const AccountHeaderManageActions = ({ account, parentAccount }: Props) => {
  const { t } = useTranslation();
  const label = useGetStakeLabelLocaleBased();
  const mainAccount = getMainAccount(account, parentAccount);
  const { polkadotResources } = mainAccount;
  const hasBondedBalance = polkadotResources.lockedBalance && polkadotResources.lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(mainAccount, "BOND");
  const history = useHistory();
  if (!polkadotResources || parentAccount) return null;

  const onClick = () => {
    history.push({
      pathname: "/platform/stakekit",
      state: {
        yieldId: "polkadot-dot-validator-staking",
        accountId: account.id,
        returnTo:
          account.type === "TokenAccount"
            ? `/account/${account.parentId}/${account.id}`
            : `/account/${account.id}`,
      },
    });
  };

  const _hasExternalController = hasExternalController(mainAccount);
  const _hasExternalStash = hasExternalStash(mainAccount);
  const manageEnabled = !(
    _hasExternalController ||
    _hasExternalStash ||
    (!hasBondedBalance && hasPendingBondOperation)
  );

  const disabledLabel = manageEnabled
    ? ""
    : `${t(
        _hasExternalController
          ? "polkadot.nomination.externalControllerTooltip"
          : _hasExternalStash
            ? "polkadot.nomination.externalStashTooltip"
            : "polkadot.nomination.hasPendingBondOperation",
      )}`;

  return [
    {
      key: "Stake",
      onClick,
      icon: IconCoins,
      disabled: !manageEnabled,
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

export default AccountHeaderManageActions;
