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
import { useSelector } from "~/context/hooks";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    typeof ScreenName.PassportAttestationSuccess
  >
>;

export default function SuccessScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { proof } = route.params;

  const featureWalletSync = useFeature("llmWalletSync");
  const trustchain = useSelector(trustchainSelector);
  const isSyncAvailable = !!(featureWalletSync?.enabled && trustchain);

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
          rowGap={16}
          flex={1}
          mb={80}
        >
          <SuccessIcon borderRadius={50}>
            <Icons.CheckmarkCircleFill size="L" color={colors.success.c60} />
          </SuccessIcon>

          <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
            Age Verified
          </Text>

          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            Your age has been verified using a zero-knowledge proof. This attestation proves you are
            over {proof.minimumAge} without revealing your date of birth.
          </Text>

          <Flex
            mt={16}
            p={16}
            borderRadius={12}
            backgroundColor="opacityDefault.c05"
            width="100%"
          >
            <Flex flexDirection="column" rowGap={8} width="100%">
              <DetailRow>
                <Text variant="small" color="neutral.c70">
                  Minimum Age
                </Text>
                <Text variant="small" color="neutral.c100" fontWeight="semiBold">
                  {proof.minimumAge}+
                </Text>
              </DetailRow>
              <DetailRow>
                <Text variant="small" color="neutral.c70">
                  Verified At
                </Text>
                <Text variant="small" color="neutral.c100" fontWeight="semiBold">
                  {new Date(proof.verifiedAt).toLocaleDateString()}
                </Text>
              </DetailRow>
              <DetailRow>
                <Text variant="small" color="neutral.c70">
                  Ledger Sync
                </Text>
                {isSyncAvailable ? (
                  <Flex flexDirection="row" alignItems="center" columnGap={4}>
                    <Text variant="small" color="success.c60" fontWeight="semiBold">
                      Syncing
                    </Text>
                    <Icons.CheckmarkCircleFill size="XS" color={colors.success.c60} />
                  </Flex>
                ) : (
                  <Text variant="small" color="neutral.c50" fontWeight="semiBold">
                    Saved on this device
                  </Text>
                )}
              </DetailRow>
            </Flex>
          </Flex>
        </Flex>

        <Flex flexDirection="column" rowGap={10} mb={8} width="100%" px="16px">
          <Button type="main" onPress={handleClose} testID="passport-attestation-close">
            Done
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
`;

const DetailRow = styled(Flex)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;
