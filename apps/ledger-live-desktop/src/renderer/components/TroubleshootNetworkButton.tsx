import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Button from "~/renderer/components/Button";
import { openModal } from "../actions/modals";
type Props = ButtonProps & {
  icon?: boolean;
  inverted?: boolean;
  // only used with primary for now
  lighterPrimary?: boolean;
  danger?: boolean;
  lighterDanger?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  event?: string;
  eventProperties?: object;
  outline?: boolean;
  outlineGrey?: boolean;
  primary?: boolean;
  small?: boolean;
  title?: React.ReactNode;
};
const TroubleshootNetworkBtn = ({ primary = true, small = true, title, ...rest }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const troubleshootNetwork = useCallback(async () => {
    dispatch(openModal("MODAL_TROUBLESHOOT_NETWORK"));
  }, [dispatch]);
  const text = title || t("settings.troubleshootNetwork.btn");
  return (
    <Button
      small={small}
      primary={primary}
      event="TroubleshootNetwork"
      onClick={troubleshootNetwork}
      {...rest}
    >
      {text}
    </Button>
  );
};
export default TroubleshootNetworkBtn;
