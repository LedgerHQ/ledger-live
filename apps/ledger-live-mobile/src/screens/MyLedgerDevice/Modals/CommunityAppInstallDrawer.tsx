import React, { memo } from "react";
import { App } from "@ledgerhq/types-live";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";
import QueuedDrawer from "~/components/QueuedDrawer";

type Props = {
  /** Community app the user asked to install; the drawer is closed when null. */
  app: App | null;
  onInstall: () => void;
  onClose: () => void;
};

/** Legal disclaimer shown before installing a community app. Closing it cancels the install. */
function CommunityAppInstallDrawer({ app, onInstall, onClose }: Props) {
  return (
    <QueuedDrawer isRequestingToBeOpened={!!app} onClose={onClose}>
      <Flex testID="manager-community-install-disclaimer">
        <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mb={6}>
          <Trans i18nKey="AppAction.communityInstall.title" />
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" mb={6}>
          <Trans i18nKey="AppAction.communityInstall.availability" />
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" mb={8}>
          <Trans i18nKey="AppAction.communityInstall.liability" />
        </Text>
        <Button
          size="large"
          type="main"
          mb={4}
          onPress={onInstall}
          testID="community-install-confirm"
        >
          <Trans i18nKey="AppAction.communityInstall.install" />
        </Button>
        <Button size="large" type="shade" onPress={onClose} testID="community-install-cancel">
          <Trans i18nKey="AppAction.communityInstall.dontInstall" />
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

export default memo(CommunityAppInstallDrawer);
