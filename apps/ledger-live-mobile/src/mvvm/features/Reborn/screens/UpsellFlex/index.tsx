import React from "react";
import useUpsellFlexModel from "./useUpsellFlexModel";
import { Box, Flex, Icons } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";

import { TrackScreen } from "~/analytics";
import BuyDeviceView from "../../components/BuyDeviceView";

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const StyledSafeAreaView = styled(Box)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.default};
  padding-top: ${p => p.theme.space[10]}px;
`;

const CloseButton = styled(TouchableOpacity)`
  background-color: ${p => p.theme.colors.neutral.c40};
  padding: 8px;
  border-radius: 32px;
`;

type ViewProps = ReturnType<typeof useUpsellFlexModel>;

function View({ handleBack, readOnlyModeEnabled }: Readonly<ViewProps>) {
  return (
    <StyledSafeAreaView>
      {readOnlyModeEnabled ? <TrackScreen category="ReadOnly" name="Upsell Flex" /> : null}
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-end"
        width="100%"
        position="absolute"
        zIndex={10}
        p={6}
        top={50}
      >
        <CloseButton onPress={handleBack} hitSlop={hitSlop}>
          <Icons.Close size="S" />
        </CloseButton>
      </Flex>
      <BuyDeviceView />
    </StyledSafeAreaView>
  );
}

const UpsellFlex = () => <View {...useUpsellFlexModel()} />;

export default UpsellFlex;
