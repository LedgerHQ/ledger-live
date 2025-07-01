import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import CheckBox from "~/renderer/components/CheckBox";
import Box from "~/renderer/components/Box";
import { Button, Flex, Icons, IconsLegacy, Link, Text } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import { rgba } from "~/renderer/styles/helpers";
import { deprecateWarningReminder } from "~/renderer/actions/settings";
import { useDateFormatted } from "~/renderer/hooks/useDateFormatter";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  max-width: 100%;
  margin: auto ${p => p.theme.space[5]}px;
`;

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
}: {
  coinName: string;
  date?: Date;
  onContinue?: () => void;
  productName: string;
  screenName: DeviceDeprecationScreens;
  displayClearSigningWarning?: boolean;
}) => {
  const dispatch = useDispatch();
  const [isChecked, setIsChecked] = useState(false);
  const dateFormatted = useDateFormatted(date);
  const toggleCheck = useCallback(() => {
    setIsChecked(prev => !prev);
  }, []);
  const shopUrl = useLocalizedUrl(urls.deviceDeprecation.shop);
  const learnMoreUrl = useLocalizedUrl(urls.deviceDeprecation.learnMore);
  const [currentScreenName, setCurrentScreenName] = useState(screenName);
  const handleUgradeClick = () => {
    openURL(shopUrl);
  };
  const handleLearnMoreClick = () => {
    openURL(learnMoreUrl);
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
    } else if (onContinue) {
      onContinue();
    }
  };

  const mappedIcons = {
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
  const mappedTitles = {
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
  const mappedSubTitleKeys = {
    [DeviceDeprecationScreens.clearSigningScreen]: "deviceDeprecation.warning.subtitle",
    [DeviceDeprecationScreens.warningScreen]: "deviceDeprecation.info.subtitle",
    [DeviceDeprecationScreens.errorScreen]: "deviceDeprecation.error.subtitle",
  };
  return (
    <Wrapper>
      <Flex
        mx={20}
        rowGap={5}
        style={{
          flexDirection: "column",
        }}
      >
        <Box
          flow={3}
          style={{
            width: "100%",
          }}
        >
          <CircleIcon>{mappedIcons[currentScreenName]}</CircleIcon>
          <Text
            fontWeight="600"
            data-testid="warning-deprecation-title"
            textAlign="center"
            fontSize={24}
          >
            {mappedTitles[currentScreenName]}
          </Text>
          <Text color="palette.text.shade60" textAlign="center" fontWeight="500" fontSize={14}>
            <Trans i18nKey={mappedSubTitleKeys[currentScreenName]} />
          </Text>
        </Box>
        <Box
          flow={4}
          style={{
            width: "100%",
          }}
        >
          <Button variant="main" size="large" onClick={handleUgradeClick}>
            <Trans i18nKey={`deviceDeprecation.update`} />
          </Button>
          {currentScreenName !== DeviceDeprecationScreens.errorScreen ? (
            <Button
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
            </Button>
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
    </Wrapper>
  );
};
