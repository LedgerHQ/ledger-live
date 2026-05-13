import React from "react";
import styled from "styled-components/native";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { DownloadMedium } from "@ledgerhq/native-ui/assets/icons";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import { Wrapper } from "~/components/DeviceAction/rendering";
import {
  useRequiredFirmwareUpdateViewModel,
  type UseRequiredFirmwareUpdateViewModelProps,
  type RequiredFirmwareUpdateViewProps,
} from "./useRequiredFirmwareUpdateViewModel";

const ActionContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  mt: 6,
})``;

const StyledButton = styled(Button).attrs({
  mt: 6,
  alignSelf: "stretch",
})``;

export const RequiredFirmwareUpdateView = ({
  isUsbCapable,
  title,
  description,
  ctaLabel,
  onPressCta,
}: RequiredFirmwareUpdateViewProps) => (
  <Wrapper>
    <Flex flexDirection="column" alignItems="center" alignSelf="stretch">
      <TrackScreen category="Firmware Update" name="Error: App Unavailable Update Firmware" />
      <Flex mb={5}>
        <BoxedIcon size={64} Icon={DownloadMedium} iconSize={24} iconColor="neutral.c100" />
      </Flex>
      <Text variant="h4" fontWeight="semiBold" textAlign="center" numberOfLines={3} mb={6}>
        {title}
      </Text>
      <Text variant="paragraph" textAlign="center" numberOfLines={3} mb={6}>
        {description}
      </Text>
      {isUsbCapable ? (
        <ActionContainer marginBottom={0} marginTop={32}>
          <StyledButton type="main" outline={false} title={ctaLabel} onPress={onPressCta} />
        </ActionContainer>
      ) : null}
    </Flex>
  </Wrapper>
);

export const RequiredFirmwareUpdate = (props: UseRequiredFirmwareUpdateViewModelProps) => (
  <RequiredFirmwareUpdateView {...useRequiredFirmwareUpdateViewModel(props)} />
);
