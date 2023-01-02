import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icons, NumberedList } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking } from "react-native";
import Button from "../../../../../components/PreventDoubleClickButton";
import InfoModal from "../../../../../modals/Info";

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
    {
      title: "onboarding.stepProtect.bullets.2.title",
      desc: `onboarding.stepProtect.bullets.2.label`,
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

  const restoreInfoDrawer =
    servicesConfig?.params?.onboardingRestore?.restoreInfoDrawer || {};

  const manualStepsURI = restoreInfoDrawer?.manualStepsURI;

  const supportLink = restoreInfoDrawer?.supportLink;

  const onOpen = useCallback(() => setIsOpened(true), []);
  const onClose = useCallback(() => setIsOpened(false), []);
  const onManualSteps = useCallback(() => {
    onClose();
    if (manualStepsURI) {
      Linking.canOpenURL(manualStepsURI).then(() =>
        Linking.openURL(manualStepsURI),
      );
    }
  }, [manualStepsURI, onClose]);
  const onSupportLink = useCallback(() => {
    onClose();
    if (supportLink) {
      Linking.canOpenURL(supportLink).then(() => Linking.openURL(supportLink));
    }
  }, [onClose, supportLink]);

  return (
    <>
      <Button type="main" size="large" onPress={onNext} mb={6}>
        {t("onboarding.stepProtect.nextStep")}
      </Button>
      <InfoModal
        isOpened={isOpened}
        onClose={onClose}
        data={[
          {
            Icon: () => <Icons.InfoAltMedium size={42} color="primary.c80" />,
          },
          {
            title: t("onboarding.stepProtect.extraInfo.title"),
            description: t("onboarding.stepProtect.extraInfo.desc1"),
            titleProps: { textAlign: "center" },
            descriptionProps: { textAlign: "center" },
          },
          {
            description: t("onboarding.stepProtect.extraInfo.desc2"),
            descriptionProps: { textAlign: "center" },
            footer: (
              <>
                <Button
                  type="main"
                  size="large"
                  onPress={onManualSteps}
                  mt={8}
                  mb={6}
                >
                  {t("onboarding.stepProtect.extraInfo.cta")}
                </Button>
                <Button type="default" size="large" onPress={onSupportLink}>
                  {t("onboarding.stepProtect.extraInfo.supportLink")}
                </Button>
              </>
            ),
          },
        ]}
      />
      {restoreInfoDrawer?.enabled ? (
        <Button type="default" size="large" onPress={onOpen} iconName="Help">
          {t("onboarding.stepProtect.extraInfo.tooltip")}
        </Button>
      ) : null}
    </>
  );
};

RestoreWithProtectScene.Next = Next;

export default RestoreWithProtectScene;
