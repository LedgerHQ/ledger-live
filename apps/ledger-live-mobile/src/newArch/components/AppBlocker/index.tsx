import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import GradientContainer from "~/components/GradientContainer";
import React from "react";
import { useTheme } from "styled-components/native";

type AppBlockerProps = React.PropsWithChildren<{
  blocked: boolean;
  IconComponent: React.FC;
  ButtonComponent: React.FC;
  title: string;
  description: string;
}>;

const AppBlocker: React.FC<AppBlockerProps> = ({
  blocked,
  children,
  IconComponent,
  title,
  description,
  ButtonComponent,
}) => {
  const { colors } = useTheme();

  if (blocked) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
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
            width: "100%",
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
          {/*<Icons.DeleteCircleFill size="L" color="error.c60" />*/}
        </Box>
        <Text
          variant="body"
          color="neutral.c100"
          fontSize={24}
          fontWeight="semiBold"
          marginTop={24}
        >
          {title}
        </Text>
        <Text variant="body" fontSize={14} color="neutral.c70" marginTop={16}>
          {description}
        </Text>
        <ButtonComponent />
        {/*<Button*/}
        {/*  type="main"*/}
        {/*  Icon={() => <Icons.ExternalLink size="M" color="neutral.c100" />}*/}
        {/*  iconPosition="right"*/}
        {/*  border={2}*/}
        {/*  borderStyle="solid"*/}
        {/*  borderColor={colors.opacityDefault.c50}*/}
        {/*  borderRadius={500}*/}
        {/*  color="neutral.c100"*/}
        {/*  outline*/}
        {/*  onPress={handleLearnMore}*/}
        {/*  marginTop={24}*/}
        {/*>*/}
        {/*  {t("geoBlocking.learnMore")}*/}
        {/*</Button>*/}
      </Flex>
    );
  }

  return children;
};

export default AppBlocker;
