import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import CheckBox from "~/renderer/components/CheckBox";
import Box from "~/renderer/components/Box";
import { Button as ButtonV3, Flex, Icons, IconsLegacy, Link, Text } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import { rgba } from "~/renderer/styles/helpers";
import { deprecateWarningReminder } from "~/renderer/actions/settings";
import { useCalendarFormatted } from "~/renderer/hooks/useDateFormatter";
import { urls } from "~/config/urls";

const CircleIcon = styled.div`
  padding: 16px;
  border-radius: 100px;
  background-color: ${p => rgba(p.theme.colors.palette.primary.c80, 0.1)};
  align-items: center;
  gap: 10px;
  display: flex;
  align-self: center;
  justify-content: center;
  width: fit-content;
  height: fit-content;
`;

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
  screenName,
  displayClearSigningWarning = false,
  isSwap = false,
}: {
  coinName: string;
  date: Date;
  onContinue: () => void;
  productName: string;
  screenName: DeviceDeprecationScreens;
  displayClearSigningWarning?: boolean;
  isSwap?: boolean;
}) => {
  const dispatch = useDispatch();
  const [isChecked, setIsChecked] = useState(false);
  const dateFormatted = useCalendarFormatted(date);
  const toggleCheck = useCallback(() => {
    setIsChecked(prev => !prev);
  }, []);

  const [currentScreenName, setCurrentScreenName] = useState(screenName);
  const handleUgradeClick = () => {
    openURL(urls.deviceDeprecation.shop);
  };
  const handleLearnMoreClick = () => {
    openURL(urls.deviceDeprecation.learnMore);
  };
  const handleContinue = () => {
    if (isChecked) {
      dispatch(deprecateWarningReminder(coinName));
    }
    if (
      displayClearSigningWarning &&
      currentScreenName === DeviceDeprecationScreens.warningScreen
    ) {
      setCurrentScreenName(DeviceDeprecationScreens.clearSigningScreen);
    } else {
      onContinue();
    }
  };

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
      mx={20}
      rowGap={5}
      style={{
        flexDirection: "column",
        ...(isSwap ? { height: "100%" } : {}),
      }}
    >
      <Box
        flow={3}
        style={{
          width: "100%",
        }}
      >
        <CircleIcon>{mapedIcon[currentScreenName]}</CircleIcon>
        <Text fontWeight="600" data-testid="warning-deprecation" textAlign="center" fontSize={24}>
          {mapedTitle[currentScreenName]}
        </Text>
        <Text color="palette.text.shade60" textAlign="center" fontWeight="500" fontSize={14}>
          <Trans i18nKey={mapedSubTitleKey[currentScreenName]} />
        </Text>
      </Box>
      <Box
        flow={4}
        style={{
          width: "100%",
        }}
      >
        <ButtonV3 variant="main" size="large" onClick={handleUgradeClick}>
          <Trans i18nKey={`deviceDeprecation.update`} />
        </ButtonV3>
        {currentScreenName !== DeviceDeprecationScreens.errorScreen ? (
          <ButtonV3
            size="large"
            variant="shade"
            data-testid="warning-deprecation-continue"
            onClick={handleContinue}
          >
            <Trans
              i18nKey={
                currentScreenName === DeviceDeprecationScreens.clearSigningScreen
                  ? `deviceDeprecation.warning.continue`
                  : `deviceDeprecation.continue`
              }
            />
          </ButtonV3>
        ) : null}
      </Box>
      <Link color="palette.text.shade60" onClick={handleLearnMoreClick}>
        <Trans i18nKey={`deviceDeprecation.learnMore`} />
      </Link>
      {currentScreenName === DeviceDeprecationScreens.warningScreen ? (
        <Box
          horizontal
          alignItems="flex-start"
          onClick={toggleCheck}
          style={{
            flex: 1,
            cursor: "pointer",
          }}
        >
          <CheckBox isChecked={isChecked} data-testid="dismiss-disclaimer" />
          <Text
            ff="Inter|SemiBold"
            fontSize={4}
            style={{
              marginLeft: 8,
              overflowWrap: "break-word",
              flex: 1,
            }}
          >
            <Trans i18nKey={`deviceDeprecation.info.reminder`} />
          </Text>
        </Box>
      ) : null}
    </Flex>
  );
};
