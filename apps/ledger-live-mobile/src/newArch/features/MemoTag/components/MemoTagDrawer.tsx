import { useTheme } from "styled-components/native";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import Button from "~/components/Button";
import Circle from "~/components/Circle";
import QueuedDrawer from "~/components/QueuedDrawer";
import { urls } from "~/utils/urls";

type Props = {
  open: boolean;
  onClose: () => void;
  onNext: () => void;
};

export const MemoTagDrawer = memo(({ open, onClose, onNext }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <QueuedDrawer isRequestingToBeOpened={open} onClose={onClose}>
      <Flex alignItems="center" mb={7}>
        <Circle size={72} bg={colors.opacityDefault.c05}>
          <Icons.InformationFill size="L" color="primary.c80" />
        </Circle>
      </Flex>

      <Text variant="h4" textAlign="center" mb={6}>
        {t("transfer.memoTag.title")}
      </Text>

      <Text variant="bodyLineHeight" textAlign="center" color="neutral.c80" mb={8}>
        {t("transfer.memoTag.description")}
      </Text>

      <Button type="primary" title={t("transfer.memoTag.cta")} onPress={onClose} mb={3} />

      <Button
        type="tertiary"
        title={t("transfer.memoTag.ignore")}
        onPress={onNext}
        outline
        mb={3}
      />

      <Button
        type="accent"
        size="large"
        Icon={() => <Icons.ExternalLink size="S" color="primary.c80" />}
        onPress={() => Linking.openURL(urls.memoTag)}
      >
        {t("transfer.memoTag.learnMore")}
      </Button>
    </QueuedDrawer>
  );
});
