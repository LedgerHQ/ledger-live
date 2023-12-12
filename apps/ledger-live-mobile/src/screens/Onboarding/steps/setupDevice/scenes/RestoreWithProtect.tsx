import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconsLegacy, NumberedList, Text } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { Linking } from "react-native";
import Button from "~/components/wrappedUi/Button";
import { TrackScreen } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { urls } from "~/utils/urls";

const RestoreWithProtectScene = () => {
  const { t } = useTranslation();

  const items = [
    {
      title: "onboarding.stepProtect.bullets.0.title",
      desc: `onboarding.stepProtect.bullets.0.label`,
    },
    {
      title: "onboarding.stepProtect.bullets.1.title",
      desc: `onboarding.stepProtect.bullets.1.label`,
    },
  ];

  return (
    <NumberedList
      flex={1}
      items={items.map(item => ({
        title: t(item.title),
        description: item.desc ? t(item.desc) : undefined,
      }))}
    />
  );
};

RestoreWithProtectScene.id = "RestoreWithProtectScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const servicesConfig = useFeature("protectServicesMobile");

  const restoreInfoDrawer = servicesConfig?.params?.onboardingRestore?.restoreInfoDrawer;

  const supportLink = restoreInfoDrawer?.supportLinkURI;

  const onOpen = useCallback(() => setIsOpened(true), []);
  const onClose = useCallback(() => setIsOpened(false), []);
  const onLearnToUpdate = useCallback(() => {
    onClose();
    Linking.openURL(urls.lnxFirmwareUpdate);
  }, [onClose]);
  const onSupportLink = useCallback(() => {
    onClose();
    if (supportLink) {
      Linking.canOpenURL(supportLink).then(() => Linking.openURL(supportLink));
    }
  }, [onClose, supportLink]);

  return (
    <>
      <Button type="main" size="large" onPress={onNext} mb={7}>
        {t("onboarding.stepProtect.nextStep")}
      </Button>
      <QueuedDrawer
        isRequestingToBeOpened={isOpened}
        onClose={onClose}
        title={t("onboarding.stepProtect.extraInfo.title")}
        description={t("onboarding.stepProtect.extraInfo.desc")}
      >
        <Button
          type="main"
          size="large"
          onPress={onLearnToUpdate}
          Icon={IconsLegacy.ExternalLinkMedium}
          mt={0}
          mb={6}
          event={"button_clicked"}
          eventProperties={{ button: "Go through manual steps" }}
        >
          {t("onboarding.stepProtect.extraInfo.cta")}
        </Button>
        <Button
          type="default"
          size="large"
          onPress={onSupportLink}
          Icon={IconsLegacy.ExternalLinkMedium}
          event={"button_clicked"}
          eventProperties={{ button: "Contact Ledger support" }}
        >
          {t("onboarding.stepProtect.extraInfo.supportLink")}
        </Button>
        <TrackScreen
          category="Why can I not see Restore with Protect on my Ledger"
          refreshSource={false}
          type="drawer"
        />
      </QueuedDrawer>
      {restoreInfoDrawer?.enabled ? (
        <Button
          type="shade"
          outline
          size="large"
          onPress={onOpen}
          event={"button_clicked"}
          eventProperties={{ button: "Can't see recover" }}
        >
          <Text variant="small">{t("onboarding.stepProtect.extraInfo.tooltip")}</Text>
        </Button>
      ) : null}
    </>
  );
};

RestoreWithProtectScene.Next = Next;

export default RestoreWithProtectScene;
