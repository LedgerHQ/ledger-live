import React, { useCallback, useState } from "react";
import { I18nManager, ScrollView } from "react-native";
import { Trans } from "react-i18next";
import { Flex, SelectableList } from "@ledgerhq/native-ui";
import i18next from "i18next";
import RNRestart from "react-native-restart";
import { useDispatch, useSelector } from "react-redux";
import { useAvailableLanguagesForDevice } from "@ledgerhq/live-common/manager/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { from } from "rxjs";
import { DeviceModelInfo, idsToLanguage, Language } from "@ledgerhq/types-live";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
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
import { track, updateIdentify } from "../../../analytics";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { BaseOnboardingNavigatorParamList } from "../../../components/RootNavigator/types/BaseOnboardingNavigator";
import Button from "../../../components/Button";
import QueuedDrawer from "../../../components/QueuedDrawer";

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

  const [isDeviceLanguagePromptOpen, setIsDeviceLanguagePromptOpen] =
    useState<boolean>(false);
  const [preventPromptBackdropClick, setPreventPromptBackdropClick] =
    useState<boolean>(false);

  // Watchdog to prevent navigating back twice due onClose being called when user closes the drawer
  // and when the drawer is hidden (see BaseModal)
  const [wasNextCalled, setWasNextCalled] = useState<boolean>(false);

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
          dispatch(setLastSeenDevice(deviceInfo));
        });
    }
  }, [lastConnectedDevice, lastSeenDevice, dispatch]);

  const [deviceForChangeLanguageAction, setDeviceForChangeLanguageAction] =
    useState<Device | null>(null);

  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

  const { availableLanguages, loaded } = useAvailableLanguagesForDevice(
    lastSeenDevice?.deviceInfo,
  );

  const [isRestartPromptOpened, setRestartPromptOpened] =
    useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const toggleModal = useCallback(
    () => setRestartPromptOpened(!isRestartPromptOpened),
    [isRestartPromptOpened],
  );
  const closeRestartPromptModal = () => {
    setRestartPromptOpened(false);
  };

  const next = useCallback(() => {
    if (!wasNextCalled) {
      setWasNextCalled(true);
      navigation.goBack();
    }
  }, [navigation, wasNextCalled]);

  // no useCallBack around RNRRestart, or the app might crash.
  const changeLanguageRTL = async () => {
    await Promise.all([
      I18nManager.forceRTL(!I18nManager.isRTL),
      dispatch(setLanguage(selectedLanguage)),
      updateIdentify(),
    ]);
    setTimeout(() => RNRestart.Restart(), 0);
  };

  const changeLanguage = useCallback(
    async (l: Locale) => {
      const newDirection = i18next.dir(l);
      const currentDirection = I18nManager.isRTL ? "rtl" : "ltr";
      if (newDirection !== currentDirection) {
        setSelectedLanguage(l);
        toggleModal();
      } else {
        dispatch(setLanguage(l));
        updateIdentify();

        const deviceLanguageId = lastSeenDevice?.deviceInfo.languageId;
        const potentialDeviceLanguage = localeIdToDeviceLanguage[l];
        const langAvailableOnDevice =
          potentialDeviceLanguage !== undefined &&
          availableLanguages.includes(potentialDeviceLanguage);

        // Nb firmware version verification is not really needed here, the presence of a language id
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
      toggleModal,
    ],
  );

  const closeDeviceLanguagePrompt = useCallback(() => {
    setIsDeviceLanguagePromptOpen(false);
    next();
  }, [next]);

  const deviceModel = getDeviceModel(
    lastSeenDevice?.modelId || DeviceModelId.nanoX,
  );

  return (
    <>
      <Flex flex={1} p={6}>
        <ScrollView testID="scrollView-language-change">
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
      <QueuedDrawer
        isRequestingToBeOpened={isDeviceLanguagePromptOpen}
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
              deviceModel={deviceModel}
              onConfirm={() => {
                track("Page LiveLanguageChange LanguageInstallTriggered", {
                  selectedLanguage: localeIdToDeviceLanguage[currentLocale],
                });
                setDeviceForChangeLanguageAction(lastConnectedDevice);
              }}
            />
          )}
        </Flex>
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={isRestartPromptOpened}
        preventBackdropClick={false}
        title={<Trans i18nKey={"onboarding.stepLanguage.RestartModal.title"} />}
        description={
          <Trans i18nKey={"onboarding.stepLanguage.RestartModal.paragraph"} />
        }
        onClose={closeRestartPromptModal}
      >
        <Flex flexDirection={"row"}>
          <Button
            event="ConfirmationModalCancel"
            type="secondary"
            flexGrow="1"
            title={<Trans i18nKey="common.cancel" />}
            onPress={closeRestartPromptModal}
            marginRight={4}
          />
          <Button
            event="ConfirmationModalConfirm"
            type={"primary"}
            flexGrow="1"
            title={<Trans i18nKey="common.restart" />}
            onPress={changeLanguageRTL}
          />
        </Flex>
      </QueuedDrawer>
    </>
  );
}

export default OnboardingStepLanguage;
