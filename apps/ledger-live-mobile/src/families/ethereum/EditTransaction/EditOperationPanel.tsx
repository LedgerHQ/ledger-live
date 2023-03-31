import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import LText from "../../../components/LText";
import Link from "../../../components/wrappedUi/Link";

type EditOperationPanelProps = {
  isOperationStuck: boolean;
  onEditTxPress: () => void;
};

export const EditOperationPanel = ({
  isOperationStuck,
  onEditTxPress,
}: EditOperationPanelProps) => {
  const { t } = useTranslation();
  const flag = useFeature("editEthTx");

  return flag?.enabled ? (
    <Flex
      backgroundColor={isOperationStuck ? "warning.c70" : "primary.c80"}
      color={"primary.c80"}
      width="95%"
      alignSelf={"center"}
      alignContent={"flex-end"}
      borderRadius={8}
      padding={8}
    >
      {isOperationStuck ? (
        <Box>
          <LText color="neutral.c20">
            {t("editTransaction.panel.stuckMessage")}
          </LText>
          <LText marginTop={4}>
            <Link onPress={onEditTxPress}>
              <LText
                color="neutral.c20"
                style={{ textDecorationLine: "underline" }}
                marginTop={4}
              >
                {t("editTransaction.cta")}
              </LText>
            </Link>
          </LText>
        </Box>
      ) : (
        <>
          <Box>
            <LText color="neutral.c20">
              {t("editTransaction.panel.speedupMessage")}
            </LText>
            <LText marginTop={4}>
              <Link onPress={onEditTxPress}>
                <LText
                  color="neutral.c20"
                  style={{ textDecorationLine: "underline" }}
                  marginTop={4}
                >
                  {t("editTransaction.cta")}
                </LText>
              </Link>
            </LText>
          </Box>
        </>
      )}
    </Flex>
  ) : null;
};
