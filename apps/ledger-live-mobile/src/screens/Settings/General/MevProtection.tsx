import React, { ReactNode, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Flex, Text, Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setMevProtection } from "~/actions/settings";
import { mevProtectionSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import { track } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking } from "react-native";
import styled from "styled-components/native";

const StyledText = styled(Text).attrs(() => ({
  color: "neutral.c70",
}))`
  text-decoration: underline;
  text-decoration-color: ${({ theme }) => theme.colors.neutral.c70};
`;
const MevProtectionRow = () => {
  const { t } = useTranslation();
  const mevProctection = useSelector(mevProtectionSelector);

  const dispatch = useDispatch();

  const llMevProtectionFeatureFlag = useFeature("llMevProtection");
  const mevLearnMoreLink = llMevProtectionFeatureFlag?.params?.link?.trim() || undefined;

  const onPressLink = (url: string) => Linking.openURL(url);

  const toggleMevProtection = useCallback(
    (value: boolean) => {
      dispatch(setMevProtection(value));

      track(
        "toggle_clicked",
        {
          toggleAction: value ? "ON" : "OFF",
          toggle: "MEV",
          page: "Page Settings General",
        },
        true,
      );
    },
    [dispatch],
  );

  const description: ReactNode = (
    <Flex>
      <Text variant="body" fontWeight="medium" color="neutral.c70">
        {t("settings.display.mevProtectionDesc")}
      </Text>
      {mevLearnMoreLink && (
        <StyledText
          onPress={() => onPressLink(mevLearnMoreLink)}
          variant="body"
          fontWeight="medium"
        >
          {t("settings.display.mevProtectionLearnMore")}
        </StyledText>
      )}
    </Flex>
  );

  return (
    <>
      <Track event={mevProctection ? "mev_activated" : "mev_disactivated"} onUpdate />
      <SettingsRow
        event="MevProtectionRow"
        title={t("settings.display.mevProtection")}
        noTextDesc
        desc={description}
      >
        <Switch checked={mevProctection} onChange={() => toggleMevProtection(!mevProctection)} />
      </SettingsRow>
    </>
  );
};

export default MevProtectionRow;
