import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { AleoCustomModal } from "./modals";
import type { AleoFamily } from "./types";

const AccountHeaderActions: AleoFamily["accountHeaderManageActions"] = ({ account }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  if (account.type !== "Account") {
    return [];
  }

  const onClick = () => {
    dispatch(openModal(AleoCustomModal.SELF_TRANSFER, { account }));
  };

  return [
    {
      key: "Self transfer",
      onClick: onClick,
      icon: IconCoins,
      label: t("aleo.account.selfTransferButtonLabel"),
      event: "button_clicked2",
      eventProperties: { button: "aleo-self-transfer" },
      accountActionsTestId: "self-transfer-button",
    },
  ];
};

export default AccountHeaderActions;
