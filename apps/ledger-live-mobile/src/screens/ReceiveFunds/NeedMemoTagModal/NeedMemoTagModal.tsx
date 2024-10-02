import React, { useState } from "react";
import { Linking } from "react-native";
import { BottomDrawer, Button, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { urls } from "~/utils/urls";

export function NeedMemoTagModal() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="accent" onPress={() => setIsOpen(true)}>
        {t("transfer.receive.memoTag.link")}
      </Button>
      <BottomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        Icon={() => <Icons.InformationFill size="L" color="primary.c80" />}
        title={t("transfer.receive.memoTag.title")}
        description={t("transfer.receive.memoTag.description")}
      >
        <Button type="main" size="large" onPress={() => setIsOpen(false)}>
          {t("transfer.receive.memoTag.cta")}
        </Button>

        <Button
          type="accent"
          Icon={() => <Icons.ExternalLink size="S" color="primary.c80" />}
          onPress={() => Linking.openURL(urls.memoTag)}
        >
          {t("transfer.receive.memoTag.learnMore")}
        </Button>
      </BottomDrawer>
    </>
  );
}
