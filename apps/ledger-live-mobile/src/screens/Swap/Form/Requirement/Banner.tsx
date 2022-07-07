import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { ActionRequired } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { useTranslation } from "react-i18next";

interface Props {
  required: ActionRequired;
  provider: string;
}

export function Banner({ provider, required }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const onPress = useCallback(() => {
    navigation.navigate(required, { provider });
  }, [navigation, provider, required]);

  const key = useMemo(() => required.toString().toLowerCase(), [required]);

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={4}
      marginY={4}
      borderRadius={4}
      backgroundColor="primary.c10"
    >
      <Text color="primary.c70">
        {t(`transfer.swap2.form.providers.${key}.required`)}
      </Text>

      <Button type="main" size="small" onPress={onPress}>
        {t(`transfer.swap2.form.providers.${key}.complete`)}
      </Button>
    </Flex>
  );
}
