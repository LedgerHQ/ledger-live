import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import {
  Flex,
  SelectableList,
  IconBox,
  Icons,
  Text,
  BottomDrawer,
  Link,
} from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import { useLocale } from "../../../context/Locale";
import {
  languages,
  supportedLocales,
  localeIdToDeviceLanguage,
  Locale,
} from "../../../languages";
import type { DeviceModelInfo } from "@ledgerhq/live-common/types/manager";
import Button from "../../../components/Button";
import { ScreenName } from "../../../const";
import { setLanguage } from "../../../actions/settings";
import { lastConnectedDeviceSelector, lastSeenDeviceSelector } from "../../../reducers/settings";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/lib/manager/hooks";
import NanoXFolded from "../../../images/devices/NanoXFolded";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import ChangeDeviceLanguageAction from "../../../components/ChangeDeviceLanguageAction";
import { idsToLanguage, Language } from "@ledgerhq/live-common/lib/types/languages";

function OnboardingStepLanguage({ navigation }: StackScreenProps<{}>) {
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const next = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] = useState<
    boolean
  >(false);

  const lastSeenDevice: DeviceModelInfo | null = useSelector(
    lastSeenDeviceSelector,
  );
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector) as (Device | null);
  const [deviceForChangeLanguageAction, setDeviceForChangeLanguageAction] = useState<Device | null>(null);

  const availableDeviceLanguages = useAvailableLanguagesForDevice(
    lastSeenDevice?.deviceInfo,
  );

  const changeLanguage = useCallback(
    (l: Locale) => {
      dispatch(setLanguage(l));

      const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
      const potentialDeviceLanguage = localeIdToDeviceLanguage[l];
      const langAvailableOnDevice = potentialDeviceLanguage !== undefined && availableDeviceLanguages.includes(
        potentialDeviceLanguage,
      );

      if (langAvailableOnDevice && deviceLanguageId !== undefined && idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage) {
        setIsDeviceLanguagePromptOpen(true);
      } else {
        next();
      }
    },
    [dispatch, next, availableDeviceLanguages],
  );

  const closeDeviceLanguagePrompt = useCallback(() => {
    setIsDeviceLanguagePromptOpen(false);
    next();
  }, [next]);

  return (
    <>
      <Flex flex={1} p={6}>
        <ScrollView>
          <Flex mb={4}>
            <SelectableList
              currentValue={currentLocale}
              onChange={changeLanguage}
            >
              {supportedLocales.map((l, index) => (
                <SelectableList.Element key={index + l} value={l}>
                  {languages[l]}
                </SelectableList.Element>
              ))}
            </SelectableList>
          </Flex>
        </ScrollView>
      </Flex>
      <BottomDrawer
        isOpen={isDeviceLanguagePromptOpen}
        onClose={closeDeviceLanguagePrompt}
      >
        <Flex alignItems="center">
          <NanoXFolded size={200} />
          <Text variant="h4" textAlign="center">
            {t("onboarding.stepLanguage.changeDeviceLanguage")}
          </Text>
          <Flex px={7} mt={4} mb={8}>
            <Text variant="paragraph" textAlign="center" color="neutral.c70">
              {t("onboarding.stepLanguage.changeDeviceLanguageDescription", {
                language: t(`deviceLocalization.languages.${localeIdToDeviceLanguage[currentLocale]}`)
              })}
            </Text>
          </Flex>
          <Button
            type="main"
            onPress={() => setDeviceForChangeLanguageAction(lastConnectedDevice)}
            outline={false}
            alignSelf="stretch"
          >
            {t("deviceLocalization.changeLanguage")}
          </Button>
          <Flex mt={6}>
            <Link
              onPress={() => console.log("TODO: open link")}
              Icon={Icons.ExternalLinkMedium}
              iconPosition="right"
              type="color"
              style={{ justifyContent: "flex-start" }}
            >
              {t("common.learnMore")}
            </Link>
          </Flex>
        </Flex>
      </BottomDrawer>
      <ChangeDeviceLanguageAction 
        device={deviceForChangeLanguageAction}
        language={localeIdToDeviceLanguage[currentLocale] as Language}
        onClose={() => {setDeviceForChangeLanguageAction(null); closeDeviceLanguagePrompt()}} 
      />
    </>
  );
}

export function OnboardingStepLanguageGetStarted({
  navigation,
}: StackScreenProps<{}>) {
  const next = () => {
    navigation.getParent()?.replace(ScreenName.OnboardingTermsOfUse);
  };

  return (
    <>
      <Flex flex={1} px={4} justifyContent="center" alignItems="center">
        <Flex mb={8}>
          <IconBox Icon={Icons.WarningMedium} />
        </Flex>
        <Text variant="large" mb={5} fontWeight="semiBold">
          <Trans i18nKey="onboarding.stepLanguage.warning.title" />
        </Text>
        <Text variant="body" color="palette.neutral.c80" textAlign="center">
          <Trans i18nKey="onboarding.stepLanguage.warning.desc" />
        </Text>
      </Flex>
      <Button
        type="primary"
        onPress={next}
        outline={false}
        title={<Trans i18nKey="onboarding.stepLanguage.cta" />}
      />
    </>
  );
}

export default OnboardingStepLanguage;
