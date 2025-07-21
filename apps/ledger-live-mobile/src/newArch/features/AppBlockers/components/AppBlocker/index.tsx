import { Box, Flex } from "@ledgerhq/native-ui";
import GradientContainer from "~/components/GradientContainer";
import React from "react";
import { useTheme } from "styled-components/native";
import { Dimensions } from "react-native";

type AppBlockerProps = React.PropsWithChildren<{
  blocked: boolean;
  IconComponent: React.FC;
  TitleComponent: React.FC;
  DescriptionComponent: React.FC;
  MidCTAComponent?: React.FC;
  BottomCTAComponent?: React.FC;
}>;

const AppBlocker: React.FC<AppBlockerProps> = ({
  blocked,
  children,
  IconComponent,
  TitleComponent,
  DescriptionComponent,
  MidCTAComponent = () => null,
  BottomCTAComponent = () => null,
}) => {
  const { colors } = useTheme();
  const { width: screenWidth } = Dimensions.get("screen");

  if (blocked) {
    return (
      <>
        <Flex
          justifyContent="center"
          alignItems="center"
          paddingX={8}
          backgroundColor={colors.background.drawer}
          flex={1}
        >
          <GradientContainer
            color={colors.error.c10}
            startOpacity={0.7}
            endOpacity={0}
            direction="top-to-bottom"
            containerStyle={{
              borderBottomLeftRadius: 200,
              borderBottomRightRadius: 200,
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              top: -50,
              height: "30%",
              width: screenWidth,
            }}
          />
          <Box
            backgroundColor={colors.opacityDefault.c05}
            borderRadius={100}
            height={72}
            width={72}
            display="flex"
            alignItems="center"
            justifyContent="center"
            marginBottom={3}
          >
            <IconComponent />
          </Box>
          <Flex alignItems="center">
            <TitleComponent />
          </Flex>
          <DescriptionComponent />
          <MidCTAComponent />
        </Flex>
        <BottomCTAComponent />
      </>
    );
  }

  return children;
};

export default AppBlocker;
