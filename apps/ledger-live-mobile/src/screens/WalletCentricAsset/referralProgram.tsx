import React, { useCallback } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { ChevronRightMedium, GiftMedium } from "@ledgerhq/native-ui/assets/icons";
import { Linking, TouchableOpacity } from "react-native";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { track } from "~/analytics";
import { ScreenName } from "~/const";

const ReferralContainer = styled(Flex)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: ${p => p.theme.space[3]}px;
`;

export function ReferralProgram() {
  const { t } = useTranslation();
  const referralProgramMobile = useFeature("referralProgramMobile");
  const accessReferralProgram = useCallback(() => {
    const path = referralProgramMobile?.params?.path;
    if (referralProgramMobile?.enabled && path) {
      Linking.canOpenURL(path).then(() => Linking.openURL(path));
      track("banner_clicked", {
        button: "Referral program",
        page: ScreenName.Asset,
      });
    }
  }, [referralProgramMobile]);

  return (
    <TouchableOpacity onPress={accessReferralProgram}>
      <ReferralContainer mx={5} mt={4} p={5} flexDirection="row" justifyContent="space-between">
        <Flex flexDirection="row">
          <GiftMedium />
          <Text variant="paragraphLineHeight" fontWeight="medium" ml={4}>
            {t("account.referralProgram")}
          </Text>
        </Flex>
        <ChevronRightMedium />
      </ReferralContainer>
    </TouchableOpacity>
  );
}
