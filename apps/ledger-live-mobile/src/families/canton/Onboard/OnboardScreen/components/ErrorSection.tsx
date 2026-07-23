import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import { Trans, useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";

const LinkTouchable = styled(TouchableOpacity).attrs({ activeOpacity: 0.5 })`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

function LearnMore(): React.JSX.Element {
  const link = useLocalizedUrl(urls.canton.learnMore);

  return (
    <LinkTouchable onPress={() => Linking.openURL(link)}>
      <Alert.UnderlinedText mr="5px">
        <Trans i18nKey="common.learnMore" />
      </Alert.UnderlinedText>
    </LinkTouchable>
  );
}

type AlertType = "error" | "warning";

interface ErrorInfo {
  titleKey: string;
  descriptionKey: string | null;
  showLearnMore: boolean;
  alertType: AlertType;
}

function getErrorInfo(error: Error | null): ErrorInfo {
  if (!error) {
    return {
      titleKey: "errors.generic.title",
      descriptionKey: null,
      showLearnMore: false,
      alertType: "error",
    };
  }

  if (error instanceof UserRefusedOnDevice) {
    return {
      titleKey: `errors.${error.name}.title`,
      descriptionKey: `errors.${error.name}.description`,
      showLearnMore: false,
      alertType: "warning",
    };
  }

  if (error instanceof LockedDeviceError) {
    return {
      titleKey: `errors.${error.name}.title`,
      descriptionKey: `errors.${error.name}.description`,
      showLearnMore: false,
      alertType: "error",
    };
  }

  if ("status" in error && error.status === 429) {
    return {
      titleKey: "canton.onboard.error429",
      descriptionKey: null,
      showLearnMore: true,
      alertType: "error",
    };
  }

  return {
    titleKey: error.message || "errors.generic.title",
    descriptionKey: null,
    showLearnMore: false,
    alertType: "error",
  };
}

interface ErrorSectionProps {
  readonly error: Error | null;
  readonly disabled: boolean;
  readonly onRetry: () => void;
}

export function ErrorSection({ error, disabled, onRetry }: ErrorSectionProps) {
  const { t } = useTranslation();

  const { titleKey, descriptionKey, showLearnMore, alertType } = getErrorInfo(error);
  const title = t(titleKey, { defaultValue: "Error" });
  const description = descriptionKey ? t(descriptionKey) : null;

  return (
    <Flex flexDirection="column" alignItems="stretch" mt={4} mx={6}>
      <Alert type={alertType}>
        <Flex flexDirection="column" rowGap={4} flex={1}>
          <Text variant="bodyLineHeight" fontWeight="semiBold" color="neutral.c100">
            {title}
          </Text>
          {description && (
            <Text variant="body" color="neutral.c100">
              {description}
            </Text>
          )}
          {showLearnMore && <LearnMore />}
        </Flex>
      </Alert>
      <Button type="main" onPress={onRetry} disabled={disabled} mt={4}>
        <Trans i18nKey="common.retry" />
      </Button>
    </Flex>
  );
}
