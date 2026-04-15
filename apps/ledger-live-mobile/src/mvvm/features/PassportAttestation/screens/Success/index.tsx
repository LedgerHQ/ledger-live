import React, { useCallback } from "react";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import PreventNativeBack from "~/components/PreventNativeBack";
import { NavigatorName } from "~/const";
import type { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import { CommonActions } from "@react-navigation/native";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    typeof ScreenName.PassportAttestationSuccess
  >
>;

export default function SuccessScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { proof } = route.params;

  const handleClose = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: NavigatorName.Main }],
      }),
    );
  }, [navigation]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <PreventNativeBack />
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        flex={1}
        px={4}
      >
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          rowGap={8}
          flex={1}
          mb={80}
        >
          <SuccessIcon borderRadius={50}>
            <Icons.CheckmarkCircleFill size="L" color={colors.success.c60} />
          </SuccessIcon>

          <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
            Age verified
          </Text>

          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" px={16}>
            Your age has been verified using a zero-knowledge proof. This attestation proves you are{" "}
            {proof.minimumAge}+ without revealing your date of birth.
          </Text>

          <Flex flexDirection="row" alignItems="center" columnGap={4} mt={16}>
            <Icons.CheckmarkCircleFill size="XS" color={colors.success.c60} />
            <Text variant="body" color="success.c60" fontWeight="medium">
              Proof of Age ({proof.minimumAge}+)
            </Text>
          </Flex>
        </Flex>

        <Flex flexDirection="column" rowGap={10} mb={8} width="100%" px="16px">
          <Button type="main" onPress={handleClose} testID="passport-attestation-close">
            Close
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

const SuccessIcon = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
`;
