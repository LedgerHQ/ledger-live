import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationConfirm
  >
>;

function maskDocNumber(doc: string): string {
  if (doc.length <= 3) return doc;
  return doc.slice(0, 2) + "***" + doc.slice(-1);
}

function formatDob(yymmdd: string): string {
  if (yymmdd.length !== 6) return yymmdd;
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const century = yy <= 30 ? 2000 : 1900;
  return `${dd}/${mm}/${century + yy}`;
}

export default function ConfirmScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { mrzData } = route.params;

  const handleConfirm = useCallback(() => {
    navigation.navigate(ScreenName.PassportAttestationReadNFC, { mrzData });
  }, [navigation, mrzData]);

  const handleEdit = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Flex flex={1} flexDirection="column" justifyContent="space-between" px={6} pt={6}>
          <Flex flexDirection="column">
            <Flex flexDirection="column" alignItems="center" rowGap={12} mb={24}>
              <IconContainer borderRadius={50}>
                <Icons.ShieldCheck size="L" color="primary.c80" />
              </IconContainer>
              <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
                Confirm Age Verification
              </Text>
              <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
                Review the information below. Proceeding will create a zero-knowledge proof that you
                are 18 or older.
              </Text>
            </Flex>

            <Flex
              p={16}
              borderRadius={12}
              backgroundColor="opacityDefault.c05"
              mb={16}
            >
              <Flex flexDirection="column" rowGap={12} width="100%">
                <DetailRow>
                  <Text variant="small" color="neutral.c70">
                    Document Number
                  </Text>
                  <Text variant="small" color="neutral.c100" fontWeight="semiBold">
                    {maskDocNumber(mrzData.documentNumber)}
                  </Text>
                </DetailRow>
                <DetailRow>
                  <Text variant="small" color="neutral.c70">
                    Date of Birth
                  </Text>
                  <Text variant="small" color="neutral.c100" fontWeight="semiBold">
                    {formatDob(mrzData.dateOfBirth)}
                  </Text>
                </DetailRow>
                {mrzData.nationality && mrzData.nationality !== "N/A" && (
                  <DetailRow>
                    <Text variant="small" color="neutral.c70">
                      Nationality
                    </Text>
                    <Text variant="small" color="neutral.c100" fontWeight="semiBold">
                      {mrzData.nationality}
                    </Text>
                  </DetailRow>
                )}
              </Flex>
            </Flex>

            <Flex
              p={16}
              borderRadius={12}
              borderWidth={1}
              borderColor={colors.neutral.c40}
              mb={24}
              flexDirection="row"
              columnGap={12}
            >
              <Icons.Information size="S" color={colors.primary.c80} />
              <Flex flex={1}>
                <Text variant="small" color="neutral.c70">
                  A zero-knowledge proof will be generated to attest you are 18 or older. Your date
                  of birth will not be stored or shared — only the cryptographic proof is saved and
                  synced across your Ledger Live instances via the TrustChain.
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Flex flexDirection="column" rowGap={10} mb={8}>
            <Button
              type="main"
              onPress={handleConfirm}
              testID="passport-confirm-button"
            >
              Create Proof and Continue
            </Button>
            <Button
              type="default"
              outline
              onPress={handleEdit}
              testID="passport-edit-button"
            >
              Edit Details
            </Button>
          </Flex>
        </Flex>
      </ScrollView>
    </SafeAreaView>
  );
}

const IconContainer = styled(Box)`
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
