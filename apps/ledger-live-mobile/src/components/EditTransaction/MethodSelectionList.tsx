import { Box, Flex, SelectableList, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Dimensions, Linking } from "react-native";
import { Trans } from "~/context/Locale";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

type Props<TEditType extends string> = {
  haveFundToCancel: boolean;
  haveFundToSpeedup: boolean;
  isOldestEditableOperation: boolean;
  learnMoreUrl: string;
  ticker: string;
  onSelect: (value: TEditType) => void;
};

const getSpeedUpDescriptionKey = (
  haveFundToSpeedup: boolean,
  isOldestEditableOperation: boolean,
):
  | "editTransaction.speedUp.description"
  | "editTransaction.error.notEnoughFundsToSpeedup"
  | "editTransaction.error.notlowestNonceToSpeedup" => {
  if (!haveFundToSpeedup) {
    return "editTransaction.error.notEnoughFundsToSpeedup";
  }
  if (!isOldestEditableOperation) {
    return "editTransaction.error.notlowestNonceToSpeedup";
  }
  return "editTransaction.speedUp.description";
};

export default function MethodSelectionList<TEditType extends string>({
  haveFundToCancel,
  haveFundToSpeedup,
  isOldestEditableOperation,
  learnMoreUrl,
  ticker,
  onSelect,
}: Readonly<Props<TEditType>>) {
  const localizedLearnMoreUrl = useLocalizedUrl(learnMoreUrl);
  const onLearnMorePress = useCallback(() => {
    if (localizedLearnMoreUrl) {
      Linking.openURL(localizedLearnMoreUrl);
    }
  }, [localizedLearnMoreUrl]);

  return (
    <>
      <SelectableList onChange={value => onSelect(value as TEditType)}>
        <SelectableList.Element
          disabled={!haveFundToSpeedup || !isOldestEditableOperation}
          value={"speedup"}
        >
          <Box style={{ width: Dimensions.get("window").width * 0.8 }}>
            <Text fontWeight="bold">
              <Trans i18nKey="editTransaction.speedUp.title" />
            </Text>
            <Flex>
              <Text style={{ marginTop: 15, marginBottom: 0 }}>
                <Trans
                  i18nKey={getSpeedUpDescriptionKey(haveFundToSpeedup, isOldestEditableOperation)}
                />
              </Text>
            </Flex>
          </Box>
        </SelectableList.Element>

        <SelectableList.Element disabled={!haveFundToCancel} value={"cancel"}>
          <Box style={{ width: Dimensions.get("window").width * 0.8 }}>
            <Text fontWeight="bold">
              <Trans i18nKey="editTransaction.cancel.title" />
            </Text>
            <Text
              style={{
                marginTop: 15,
                marginBottom: 0,
                overflow: "hidden",
              }}
            >
              {haveFundToCancel ? (
                <Trans i18nKey="editTransaction.cancel.description" values={{ ticker }} />
              ) : (
                <Trans i18nKey="editTransaction.error.notEnoughFundsToCancel" />
              )}
            </Text>
          </Box>
        </SelectableList.Element>
      </SelectableList>
      <Text style={{ marginTop: 8, textDecorationLine: "underline" }} onPress={onLearnMorePress}>
        <Trans i18nKey="editTransaction.learnMore" />
      </Text>
    </>
  );
}
