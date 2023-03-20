// @flow
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Button from "~/renderer/components/Button";
import { openModal } from "../actions/modals";

type Props = ButtonProps & {|
  icon?: boolean,
  inverted?: boolean, // only used with primary for now
  lighterPrimary?: boolean,
  danger?: boolean,
  lighterDanger?: boolean,
  disabled?: boolean,
  isLoading?: boolean,
  event?: string,
  eventProperties?: Object,
  outline?: boolean,
  outlineGrey?: boolean,
  primary?: boolean,
  small?: boolean,
  title?: React$Node,
|};

const TroubleshootSyncBtn = ({ primary = true, small = true, title, ...rest }: Props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const troubleshootSync = useCallback(async () => {
    dispatch(openModal("MODAL_TROUBLESHOOT_SYNC"));
  }, [dispatch]);

  const text = title || t("settings.troubleshootSync.btn");

  return (
    <Button
      small={small}
      primary={primary}
      event="TroubleshootSync"
      onClick={troubleshootSync}
      {...rest}
    >
      {text}
    </Button>
  );
};

export default TroubleshootSyncBtn;
