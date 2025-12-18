import { Flex, Icons, IconsLegacy, Text, Link, Checkbox } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { useDispatch } from "react-redux";
import styled from "styled-components/native";

import { SettingsActionTypes } from "~/actions/types";
import { useFormatDate } from "~/hooks/useDateFormatter";
import Button from "~/components/Button";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "~/newArch/hooks/useLocalizedUrls";

const CircleIcon = styled(Flex).attrs({
  padding: 16,
  borderRadius: 100,
  backgroundColor: "neutral.c30",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
})``;

export const enum DeviceDeprecationScreens {
  clearSigningScreen,
  warningScreen,
  errorScreen,
}

export const DeviceDeprecationScreen = ({
  coinName,
  date,
  onContinue,
  productName,
  displayClearSigningWarning = false,
  screenName,
}: {
  coinName: string;
  date?: Date;
  onContinue?: () => void;
  productName: string;
  displayClearSigningWarning?: boolean;
  screenName: DeviceDeprecationScreens;
}) => {
  const dispatch = useDispatch();
  const [isChecked, setIsChecked] = useState(false);
  const formatDate = useFormatDate();

  const [currentScreenName, setCurrentScreenName] = useState(screenName);
  const toggleCheck = useCallback(() => {
    setIsChecked(prev => !prev);
  }, []);

  const dateFormatted = formatDate(date || new Date());
  const openURL = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const shopUrl = useLocalizedUrl(urls.deviceDeprecation.shop);
  const learnMoreUrl = useLocalizedUrl(urls.deviceDeprecation.learnMore);
  const handleUgradeClick = () => {
    openURL(shopUrl);
  };
  const handleLearnMoreClick = () => {
    openURL(learnMoreUrl);
  };
  const handleContinue = useCallback(() => {
    if (isChecked) {
      dispatch({
        type: SettingsActionTypes.DEPRECATION_DO_NOT_REMIND,
        payload: coinName,
      });
    }
    if (
      displayClearSigningWarning &&
      currentScreenName === DeviceDeprecationScreens.warningScreen
    ) {
      setCurrentScreenName(DeviceDeprecationScreens.clearSigningScreen);
    } else if (onContinue) {
      onContinue();
    }
  }, [isChecked, displayClearSigningWarning, currentScreenName, onContinue, dispatch, coinName]);

  const mapedIcon = {
    [DeviceDeprecationScreens.clearSigningScreen]: (
      <Icons.WarningFill size="L" color="palette.warning.c70" />
    ),
    [DeviceDeprecationScreens.warningScreen]: (
      <Icons.InformationFill size="L" color="primary.c80" />
    ),
    [DeviceDeprecationScreens.errorScreen]: (
      <IconsLegacy.CircledCrossSolidMedium size={40} color="error.c60" />
    ),
  };
  const mapedTitle = {
    [DeviceDeprecationScreens.clearSigningScreen]: (
      <Trans
        i18nKey={`deviceDeprecation.warning.title`}
        values={{
          device: productName,
        }}
      />
    ),
    [DeviceDeprecationScreens.warningScreen]: (
      <Trans
        i18nKey={`deviceDeprecation.info.title`}
        values={{
          device: productName,
          date: dateFormatted,
          coinName: coinName,
        }}
      />
    ),
    [DeviceDeprecationScreens.errorScreen]: (
      <Trans
        i18nKey={`deviceDeprecation.error.title`}
        values={{
          device: productName,
        }}
      />
    ),
  };
  const mapedSubTitleKey = {
    [DeviceDeprecationScreens.clearSigningScreen]: `deviceDeprecation.warning.subtitle`,
    [DeviceDeprecationScreens.warningScreen]: `deviceDeprecation.info.subtitle`,
    [DeviceDeprecationScreens.errorScreen]: `deviceDeprecation.error.subtitle`,
  };

  return (
    <Flex
      alignItems="center"
      flexDirection="column"
      px={6}
      style={{
        width: "100%",
      }}
    >
      <CircleIcon>{mapedIcon[currentScreenName]}</CircleIcon>
      <Text
        fontWeight="semiBold"
        textAlign="center"
        testID="warning-deprecation-title"
        fontSize={24}
        mt={6}
      >
        {mapedTitle[currentScreenName]}
      </Text>
      <Text color="opacityDefault.c70" textAlign="center" fontWeight="medium" fontSize={14} mt={4}>
        <Trans i18nKey={mapedSubTitleKey[currentScreenName]} />
      </Text>

      <Button
        type="main"
        size="large"
        mt={8}
        style={{ width: "100%" }}
        alignSelf="stretch"
        onPress={handleUgradeClick}
        data-testid="update-button"
      >
        <Trans i18nKey="deviceDeprecation.update" />
      </Button>
      {currentScreenName !== DeviceDeprecationScreens.errorScreen ? (
        <Button
          mt={4}
          type="shade"
          size="large"
          outline
          alignSelf="stretch"
          onPress={handleContinue}
          testID="warning-deprecation-continue"
        >
          <Trans
            i18nKey={
              currentScreenName === DeviceDeprecationScreens.clearSigningScreen
                ? `deviceDeprecation.warning.continue`
                : `deviceDeprecation.continue`
            }
          />
        </Button>
      ) : null}
      <Link
        onPress={handleLearnMoreClick}
        style={{
          marginTop: 10,
        }}
      >
        <Text
          mt={4}
          style={{
            color: "palette.text.shade60",
            textAlign: "center",
            fontSize: 14,
          }}
        >
          <Trans i18nKey="deviceDeprecation.learnMore" />
        </Text>
      </Link>
      {currentScreenName === DeviceDeprecationScreens.warningScreen ? (
        <Flex
          backgroundColor="neutral.c30"
          testID="dismiss-disclaimer"
          p={5}
          mt={5}
          borderRadius={5}
          alignSelf="stretch"
        >
          <Checkbox
            checked={isChecked}
            onChange={toggleCheck}
            label={<Trans i18nKey="deviceDeprecation.info.reminder" />}
          />
        </Flex>
      ) : null}
    </Flex>
  );
};
