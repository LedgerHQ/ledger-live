import React from "react";
import { Button, Divider, Flex, IconsLegacy, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { ErrorBody } from "~/renderer/components/DeviceAction/rendering";

type Props = {
  onContinue: () => void;
  onCancel: () => void;
};

const Cancel = ({ onContinue, onCancel }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex flex={1} flexDirection="column">
      <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column" px={100}>
        <ErrorBody
          Icon={() => <IconsLegacy.WarningMedium color={"warning.c50"} size={24} />}
          title={t("manager.firmware.updateInProgress")}
          description={t("manager.firmware.cancelUpdateWarning")}
        />
      </Flex>
      <Divider />
      <Flex
        px={12}
        alignSelf="stretch"
        flexDirection="row"
        justifyContent="space-between"
        paddingTop={4}
        paddingBottom={1}
      >
        <Link onClick={onCancel}>{t("manager.firmware.cancelUpdate")}</Link>
        <Flex flex={1} />
        <Button data-test-id="modal-continue-button" variant="main" onClick={onContinue}>
          {t("manager.firmware.continueUpdate")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default Cancel;
