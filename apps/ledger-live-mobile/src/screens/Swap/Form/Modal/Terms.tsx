import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Button, IconsLegacy, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { urls } from "~/utils/urls";
import QueuedDrawer from "~/components/QueuedDrawer";

export function Terms({
  provider,
  isOpen,
  onClose,
  onCTA,
}: {
  provider: string;
  isOpen: boolean;
  onClose: () => void;
  onCTA: () => void;
}) {
  const { t } = useTranslation();

  const onPressLink = useCallback(() => {
    // @ts-expect-error something wrong with providers type
    Linking.openURL(urls.swap.providers[provider].tos);
  }, [provider]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      noCloseButton
      Icon={IconsLegacy.InfoMedium}
      iconColor="warning.c50"
      title={t("transfer.swap2.form.disclaimer.title")}
      description={t("transfer.swap2.form.disclaimer.desc", {
        providerName: getProviderName(provider),
      })}
    >
      <Link type="color" Icon={IconsLegacy.ExternalLinkMedium} onPress={onPressLink}>
        {t("transfer.swap2.form.disclaimer.tos")}
      </Link>
      <Button
        type="main"
        onPress={onCTA}
        marginTop={8}
        marginBottom={4}
        testID="terms-accept-button"
      >
        {t("transfer.swap2.form.disclaimer.accept")}
      </Button>
      <Button type="main" onPress={onClose} outline testID="terms-close-button">
        {t("common.close")}
      </Button>
    </QueuedDrawer>
  );
}
