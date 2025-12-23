import { useTranslation } from "react-i18next";
import { TokenAccount } from "@ledgerhq/types-live";
import {
  hasExternalController,
  hasExternalStash,
  hasPendingOperationType,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import IconCoins from "~/renderer/icons/Coins";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { useHistory } from "react-router";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";

type Props = {
  account: PolkadotAccount | TokenAccount;
  parentAccount: PolkadotAccount | undefined | null;
  source?: string;
};

const AccountHeaderManageActions = ({ account, parentAccount, source = "Account Page" }: Props) => {
  const { t } = useTranslation();
  const label = useGetStakeLabelLocaleBased();
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const { polkadotResources } = mainAccount;
  const hasBondedBalance = polkadotResources.lockedBalance && polkadotResources.lockedBalance.gt(0);
  const hasPendingBondOperation = hasPendingOperationType(mainAccount, "BOND");
  const history = useHistory();
  if (!polkadotResources || parentAccount) return null;

  const onClick = () => {
    if (["polkadot", "assethub_polkadot"].includes(mainAccount.currency.id)) {
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
    } else {
      if (isAccountEmpty(mainAccount)) {
        dispatch(
          openModal("MODAL_NO_FUNDS_STAKE", {
            account: mainAccount,
          }),
        );
      } else if (hasBondedBalance || hasPendingBondOperation) {
        dispatch(
          openModal("MODAL_POLKADOT_MANAGE", {
            account: mainAccount,
            source,
          }),
        );
      } else {
        dispatch(
          openModal("MODAL_POLKADOT_REWARDS_INFO", {
            account: mainAccount,
          }),
        );
      }
    }
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
