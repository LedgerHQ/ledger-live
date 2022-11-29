import React, { memo } from "react";
import { Button, IconBox, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";

const SafeAreaContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.theme.colors.background.main};
  margin-left: ${p => `${p.theme.space[6]}px`};
  margin-right: ${p => `${p.theme.space[6]}px`};
`;

const BluetoothDisabled: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaContainer>
      <IconBox Icon={BluetoothMedium} iconSize={24} boxSize={64} />
      <Text variant={"h2"} mb={5} mt={7} textAlign="center">
        {t("bluetooth.required")}
      </Text>
      <Text
        mb={onRetry ? 10 : 0}
        variant={"body"}
        fontWeight={"medium"}
        textAlign="center"
        color={"neutral.c80"}
      >
        {t("bluetooth.checkEnabled")}
      </Text>
      {onRetry ? (
        <Button type="main" alignSelf="stretch" outline onPress={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </SafeAreaContainer>
  );
};

export default memo(BluetoothDisabled);
