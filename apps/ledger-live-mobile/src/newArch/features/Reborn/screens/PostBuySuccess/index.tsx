import React from "react";
import { Flex, IconsLegacy, Text, Box } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Button from "~/components/wrappedUi/Button";
import usePostBuySuccessModel from "./usePostBuySuccessModel";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background.main};
`;

type ViewProps = ReturnType<typeof usePostBuySuccessModel>;

function View({ onClose }: ViewProps) {
  const { t } = useTranslation();

  return (
    <StyledSafeAreaView>
      <Flex flex={1} justifyContent="center" alignItems="center" mx={6} my={6}>
        <Flex justifyContent="center" alignItems="center">
          <Box bg="success.c20" p={6} mb={7} borderRadius={999}>
            <Box bg="success.c40" p={6} borderRadius={999}>
              <Box
                height={98}
                width={98}
                alignItems="center"
                justifyContent="center"
                bg="success.c60"
                borderRadius={999}
              >
                <IconsLegacy.CheckAloneMedium size="42px" />
              </Box>
            </Box>
          </Box>
          <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={5}>
            {t("postBuyDevice.title")}
          </Text>
          <Text textAlign="center" maxWidth={"90%"} variant="bodyLineHeight" color="neutral.c80">
            {t("postBuyDevice.desc")}
          </Text>
        </Flex>
      </Flex>
      <Button mx={6} mb={8} type="main" outline={false} onPress={onClose} size="large">
        {t("common.close")}
      </Button>
    </StyledSafeAreaView>
  );
}

const PostBuySuccess = () => {
  return <View {...usePostBuySuccessModel()} />;
};

export default PostBuySuccess;
