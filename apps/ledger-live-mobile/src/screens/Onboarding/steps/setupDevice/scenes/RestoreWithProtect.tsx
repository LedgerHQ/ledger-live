import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icons, NumberedList, Text } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking } from "react-native";
import InfoModal from "../../../../../modals/Info";
import Button from "../../../../../components/wrappedUi/Button";
import { TrackScreen } from "../../../../../analytics";
import Touchable from "../../../../../components/Touchable";

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

  const restoreInfoDrawer =
    servicesConfig?.params?.onboardingRestore?.restoreInfoDrawer || {};

  const updateFirmwareLink =
    "https://support.ledger.com/hc/en-us/articles/360013349800-Update-Ledger-Nano-X-firmware?docs=true";

  const supportLink = restoreInfoDrawer?.supportLink;

  const onOpen = useCallback(() => setIsOpened(true), []);
  const onClose = useCallback(() => setIsOpened(false), []);
  const onLearnToUpdate = useCallback(() => {
    onClose();
    Linking.canOpenURL(updateFirmwareLink).then(() =>
      Linking.openURL(updateFirmwareLink),
    );
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
      <InfoModal
        isOpened={isOpened}
        onClose={onClose}
        data={[
          {
            title: t("onboarding.stepProtect.extraInfo.title"),
          },
          {
            description: t("onboarding.stepProtect.extraInfo.desc"),
            footer: (
              <>
                <Button
                  type="main"
                  size="large"
                  onPress={onLearnToUpdate}
                  Icon={Icons.ExternalLinkMedium}
                  mt={8}
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
                  Icon={Icons.ExternalLinkMedium}
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
              </>
            ),
          },
        ]}
      />
      {restoreInfoDrawer?.enabled ? (
        <Touchable onPress={onOpen}>
          <Text textAlign="center" variant="large">
            {t("onboarding.stepProtect.extraInfo.tooltip")}
          </Text>
        </Touchable>
      ) : null}
    </>
  );
};

RestoreWithProtectScene.Next = Next;

export default RestoreWithProtectScene;
