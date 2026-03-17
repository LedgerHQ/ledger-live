import { Box, Flex, Text } from "@ledgerhq/native-ui";
import React, { memo } from "react";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import Link from "~/components/wrappedUi/Link";

type Props = {
  isOperationStuck: boolean;
  onPressCta: () => void;
};

const EditOperationPanelComponent = ({ isOperationStuck, onPressCta }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Flex
      backgroundColor={isOperationStuck ? colors.warning.c70 : colors.warning.c80}
      color="primary.c80"
      width="95%"
      alignSelf="center"
      alignContent="flex-end"
      borderRadius={8}
      padding={8}
    >
      <Box>
        <Text color={colors.neutral.c20}>
          {t(
            isOperationStuck
              ? "editTransaction.panel.stuckMessage"
              : "editTransaction.panel.speedupMessage",
          )}
        </Text>
        <Text marginTop={4}>
          <Link onPress={onPressCta}>
            <Text
              color={colors.neutral.c20}
              style={{ textDecorationLine: "underline" }}
              marginTop={4}
            >
              {t("editTransaction.cta")}
            </Text>
          </Link>
        </Text>
      </Box>
    </Flex>
  );
};

export default memo<Props>(EditOperationPanelComponent);
