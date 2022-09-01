import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { Flex, SelectableList, BottomDrawer } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { from } from "rxjs";
import { DeviceModelInfo, idsToLanguage, Language } from "@ledgerhq/types-live";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CompositeScreenProps } from "@react-navigation/native";
import { useLocale } from "../../../context/Locale";
import {
  languages,
  supportedLocales,
  localeIdToDeviceLanguage,
  Locale,
} from "../../../languages";
import { ScreenName } from "../../../const";
import { setLanguage, setLastSeenDevice } from "../../../actions/settings";
import {
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
} from "../../../reducers/settings";
import ChangeDeviceLanguageAction from "../../../components/ChangeDeviceLanguageAction";
import ChangeDeviceLanguagePrompt from "../../../components/ChangeDeviceLanguagePrompt";
import { track } from "../../../analytics";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { BaseOnboardingNavigatorParamList } from "../../../components/RootNavigator/types/BaseOnboardingNavigator";

type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<
    OnboardingNavigatorParamList,
    ScreenName.OnboardingLanguage
  >,
  BaseComposite<StackNavigatorProps<BaseOnboardingNavigatorParamList>>
>;

function OnboardingStepLanguage({ navigation }: NavigationProps) {
  const { locale: currentLocale } = useLocale();
  const dispatch = useDispatch();

  const next = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] =
    useState<boolean>(false);
  const [preventPromptBackdropClick, setPreventPromptBackdropClick] =
    useState<boolean>(false);

  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(
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

  const [deviceForChangeLanguageAction, setDeviceForChangeLanguageAction] =
    useState<Device | null>(null);

  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

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
        deviceLocalizationFeatureFlag?.enabled
      ) {
        track("Page LiveLanguageChange DeviceLanguagePrompt", {
          selectedLanguage: potentialDeviceLanguage,
        });
        setIsDeviceLanguagePromptOpen(true);
      } else {
        next();
      }
    },
    [
      dispatch,
      lastSeenDevice?.deviceInfo.languageId,
      availableLanguages,
      currentLocale,
      loaded,
      deviceLocalizationFeatureFlag?.enabled,
      next,
    ],
  );

  const closeDeviceLanguagePrompt = useCallback(() => {
    setIsDeviceLanguagePromptOpen(false);
    next();
  }, [next]);

  const deviceName =
    lastSeenDevice && getDeviceModel(lastSeenDevice?.modelId).productName;

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
              onError={(error: Error) => {
                onActionFinished();
                track("Page LiveLanguageChange LanguageInstallError", {
                  error,
                });
              }}
              device={deviceForChangeLanguageAction}
              onStart={() => setPreventPromptBackdropClick(true)}
              language={localeIdToDeviceLanguage[currentLocale] as Language}
              onResult={() => {
                onActionFinished();
                track("Page LiveLanguageChange LanguageInstalled", {
                  selectedLanguage: localeIdToDeviceLanguage[currentLocale],
                });
              }}
              onContinue={() => {
                setDeviceForChangeLanguageAction(null);
                closeDeviceLanguagePrompt();
              }}
            />
          ) : (
            <ChangeDeviceLanguagePrompt
              language={localeIdToDeviceLanguage[currentLocale] as Language}
              deviceName={deviceName ?? ""}
              onConfirm={() => {
                track("Page LiveLanguageChange LanguageInstallTriggered", {
                  selectedLanguage: localeIdToDeviceLanguage[currentLocale],
                });
                setDeviceForChangeLanguageAction(lastConnectedDevice);
              }}
            />
          )}
        </Flex>
      </BottomDrawer>
    </>
  );
}

export default OnboardingStepLanguage;
