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
import Button from "../../../components/Button";
import { ScreenName } from "../../../const";
import { setLanguage } from "../../../actions/settings";
import {
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
} from "../../../reducers/settings";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/lib/manager/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { from } from "rxjs";
import ChangeDeviceLanguageAction from "../../../components/ChangeDeviceLanguageAction";
import ChangeDeviceLanguagePrompt from "../../../components/ChangeDeviceLanguagePrompt";
import { DeviceModelInfo, idsToLanguage, Language } from "@ledgerhq/types-live";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { setLastSeenDevice } from "../../../actions/settings";

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
  const [preventPromptBackdropClick, setPreventPromptBackdropClick] = useState<
    boolean
  >(false);

  const lastSeenDevice: DeviceModelInfo | null = useSelector(
    lastSeenDeviceSelector,
  );

  const lastConnectedDevice = useSelector(
    lastConnectedDeviceSelector,
  ) as Device | null;

  const onActionFinished = useCallback(() => {
    setPreventPromptBackdropClick(false);
    if (lastConnectedDevice && lastSeenDevice) {
      withDevice(lastConnectedDevice?.deviceId)(transport =>
        from(getDeviceInfo(transport)),
      )
        .toPromise()
        .then(deviceInfo => {
          dispatch(setLastSeenDevice({ deviceInfo }));
        });
    }
  }, [lastConnectedDevice, lastSeenDevice, dispatch]);

  const [
    deviceForChangeLanguageAction,
    setDeviceForChangeLanguageAction,
  ] = useState<Device | null>(null);

  const deviceLocalizationFeatureFlag = { enabled: true }; // useFeature("deviceLocalization");
  // TODO: reactivate this feature flag once QA is done
  const { availableLanguages, loaded } = useAvailableLanguagesForDevice(
    lastSeenDevice?.deviceInfo,
  );

  const changeLanguage = useCallback(
    (l: Locale) => {
      dispatch(setLanguage(l));

      const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
      const potentialDeviceLanguage = localeIdToDeviceLanguage[l];
      const langAvailableOnDevice =
        potentialDeviceLanguage !== undefined &&
        availableLanguages.includes(potentialDeviceLanguage);

      // firmware version verification is not really needed here, the presence of a language id
      // indicates that we are in a firmware that supports localization
      if (
        l !== currentLocale &&
        loaded &&
        langAvailableOnDevice &&
        deviceLanguageId !== undefined &&
        idsToLanguage[deviceLanguageId] !== potentialDeviceLanguage &&
        deviceLocalizationFeatureFlag.enabled
      ) {
        setIsDeviceLanguagePromptOpen(true);
      } else {
        next();
      }
    },
    [dispatch, next, availableLanguages, loaded],
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
        preventBackdropClick={preventPromptBackdropClick}
      >
        <Flex alignItems="center">
          {deviceForChangeLanguageAction ? (
            <ChangeDeviceLanguageAction
              onResult={onActionFinished}
              onError={onActionFinished}
              device={deviceForChangeLanguageAction}
              onStart={() => setPreventPromptBackdropClick(true)}
              language={localeIdToDeviceLanguage[currentLocale] as Language}
              onContinue={() => {
                setDeviceForChangeLanguageAction(null);
                closeDeviceLanguagePrompt();
              }}
            />
          ) : (
            <ChangeDeviceLanguagePrompt
              titleWording={t("onboarding.stepLanguage.changeDeviceLanguage")}
              descriptionWording={t(
                "onboarding.stepLanguage.changeDeviceLanguageDescription",
                {
                  language: t(
                    `deviceLocalization.languages.${localeIdToDeviceLanguage[currentLocale]}`,
                  ),
                },
              )}
              onConfirm={() =>
                setDeviceForChangeLanguageAction(lastConnectedDevice)
              }
            />
          )}
        </Flex>
      </BottomDrawer>
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
