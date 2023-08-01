import React, { memo } from "react";
import { Trans } from "react-i18next";
import { IconsLegacy, IconBox, Text, Flex, Log } from "@ledgerhq/native-ui";

import { IconOrElementType } from "@ledgerhq/native-ui/components/Icon/type";
import Alert from "./Alert";
import Button from "./Button";

type Props = {
  onClose?: () => void;
  onViewDetails?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  primaryButton?: React.ReactNode;
  secondaryButton?: React.ReactNode;
  icon?: IconOrElementType;
  iconColor?: string;
  iconBoxSize?: number;
  iconSize?: number;
  info?: React.ReactNode;
  onLearnMore?: () => void;
};

function ValidateSuccess({
  onClose,
  onViewDetails,
  title,
  description,
  primaryButton,
  secondaryButton,
  icon = IconsLegacy.CheckAloneMedium,
  iconColor = "success.c50",
  iconBoxSize = 64,
  iconSize = 24,
  info,
  onLearnMore,
}: Props) {
  return (
    <Flex flex={1} p={6}>
      <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center">
        {icon ? (
          <IconBox Icon={icon} color={iconColor} boxSize={iconBoxSize} iconSize={iconSize} />
        ) : null}
        <Flex py={8}>
          <Log>{title || <Trans i18nKey="send.validation.sent" />}</Log>
        </Flex>
        <Text
          variant="body"
          fontWeight="medium"
          color="neutral.c70"
          mt={6}
          mb={7}
          textAlign="center"
        >
          {description || <Trans i18nKey="send.validation.confirm" />}
        </Text>
        {info && (
          <Alert type="primary" onLearnMore={onLearnMore}>
            {info}
          </Alert>
        )}
      </Flex>
      <Flex>
        {primaryButton ||
          (onViewDetails && (
            <Button
              event="SendSuccessViewDetails"
              type="main"
              outline={false}
              onPress={onViewDetails}
              mt={7}
            >
              <Trans i18nKey="send.validation.button.details" />
            </Button>
          ))}
        {secondaryButton ||
          (onClose && (
            <Button
              event="SendSuccessClose"
              type={undefined}
              outline={false}
              onPress={onClose}
              mt={7}
            >
              <Trans i18nKey="common.close" />
            </Button>
          ))}
      </Flex>
    </Flex>
  );
}

export default memo<Props>(ValidateSuccess);
