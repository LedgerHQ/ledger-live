import React from "react";
import { Button, Divider, Flex, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

type Props = {
  children: React.ReactNode;
  cancelLabel?: string;
  continueLabel?: string;
  onCancel: () => void;
  onContinue?: () => void;
};

const UpdateFirmwareError = ({
  children,
  cancelLabel,
  continueLabel,
  onContinue,
  onCancel,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Flex flex={1} flexDirection="column">
      <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column" px={100}>
        {children}
      </Flex>
      <Divider color="neutral.c30" />
      <Flex
        px={12}
        alignSelf="stretch"
        flexDirection="row"
        justifyContent="space-between"
        paddingTop={6}
        paddingBottom={1}
      >
        <Link onClick={onCancel}>{cancelLabel || t("manager.firmware.cancelUpdate")}</Link>
        <Flex flex={1} />
        {onContinue ? (
          <Button data-test-id="modal-continue-button" variant="main" onClick={onContinue}>
            {continueLabel || t("manager.firmware.continueUpdate")}
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default UpdateFirmwareError;
