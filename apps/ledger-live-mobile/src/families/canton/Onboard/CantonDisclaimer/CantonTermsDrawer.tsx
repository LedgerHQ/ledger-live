import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export default function CantonTermsDrawer({ isOpen, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      title={t("canton.disclaimer.terms.title")}
    >
      <Flex flexDirection="column" alignItems="stretch" px={4} pb={6}>
        <Text variant="body" fontWeight="semiBold" color="neutral.c100" mb={3}>
          {t("canton.disclaimer.terms.sectionTitle")}
        </Text>
        <Text variant="body" color="neutral.c80">
          {t("canton.disclaimer.terms.body")}
        </Text>
      </Flex>
    </QueuedDrawer>
  );
}
