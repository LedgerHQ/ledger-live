import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { hasMinimumDelegableBalance } from "@ledgerhq/live-common/families/multiversx/helpers";
import { useMultiversxRandomizedValidators } from "@ledgerhq/live-common/families/multiversx/react";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { SubAccount } from "@ledgerhq/types-live";
import { MultiversxAccount } from "@ledgerhq/live-common/families/multiversx/types";

const AccountHeaderManageActions = (props: {
  account: MultiversxAccount | SubAccount;
  parentAccount?: MultiversxAccount | null;
  source?: string;
}) => {
  const { account, source } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const validators = useMultiversxRandomizedValidators();

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
      label: t("account.stake"),
      event: "button_clicked2",
      eventProperties: {
        button: "stake",
      },
    },
  ];
};

export default AccountHeaderManageActions;
