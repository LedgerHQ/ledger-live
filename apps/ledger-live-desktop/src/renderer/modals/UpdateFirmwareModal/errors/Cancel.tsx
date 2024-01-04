import React from "react";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { ErrorBody } from "~/renderer/components/ErrorBody";
import UpdateFirmwareError from ".";

type Props = {
  onContinue: () => void;
  onCancel: () => void;
};

const Cancel = ({ onContinue, onCancel }: Props) => {
  const { t } = useTranslation();

  return (
    <UpdateFirmwareError onCancel={onCancel} onContinue={onContinue}>
      <ErrorBody
        Icon={() => <IconsLegacy.WarningMedium color={"warning.c50"} size={24} />}
        title={t("manager.firmware.updateInProgress")}
        description={t("manager.firmware.cancelUpdateWarning")}
      />
    </UpdateFirmwareError>
  );
};

export default Cancel;
