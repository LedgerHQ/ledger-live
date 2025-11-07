import React from "react";
import { ScrollView, Linking } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import styled from "styled-components/native";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useLocalizedUrl } from "~/newArch/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import Animation from "../Animation";
import Button from "../Button";

const Wrapper = styled(Flex).attrs({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  minHeight: "160px",
})``;

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "150px",
  m: 6,
})``;

const TitleText = ({ children }: { children: React.ReactNode }) => (
  <Flex>
    <Text textAlign="center" variant="h4" fontWeight="semiBold">
      {children}
    </Text>
  </Flex>
);

const CenteredText = styled(Text).attrs({
  fontWeight: "medium",
  textAlign: "center",
})``;

type Props = {
  t: (key: string, options?: { [key: string]: string | number }) => string;
  device: Device;
  provider: string;
  theme: "light" | "dark";
  onClose?: () => void;
};

export function ThorSwapIncompatibility({ t, device, provider, theme, onClose }: Props) {
  const hardwareWalletUrl = useLocalizedUrl(urls.hardwareWallet);

  return (
    <ScrollView>
      <Wrapper width="100%" mt="30%" mb="10%" rowGap={16} pr="16px" pl="16px">
        <AnimationContainer marginTop="16px">
          <Animation
            source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
            style={getDeviceAnimationStyles(device.modelId)}
          />
        </AnimationContainer>
        <TitleText>
          {t("transfer.swap2.wrongDevice.title", { provider: getProviderName(provider) })}
        </TitleText>
        <Flex mt={4}>
          <CenteredText color="neutral.c70">
            {t("transfer.swap2.wrongDevice.description", { provider })}
          </CenteredText>
        </Flex>
      </Wrapper>

      <Button
        type="main"
        outline={false}
        onPress={() => Linking.openURL(hardwareWalletUrl)}
        alignSelf="stretch"
      >
        {t("transfer.swap2.wrongDevice.explore_compatible_devices")}
      </Button>

      <Button outline={true} type="main" onPress={onClose} mt={4} alignSelf="stretch">
        {t("transfer.swap2.wrongDevice.swapWithAnotherProvider")}
      </Button>
    </ScrollView>
  );
}
