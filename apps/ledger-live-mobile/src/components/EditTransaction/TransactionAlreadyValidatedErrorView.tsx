import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "~/context/Locale";
import Button from "~/components/Button";
import NeedHelp from "~/components/NeedHelp";
import SupportLinkError from "~/components/SupportLinkError";
import TranslatedError from "~/components/TranslatedError";
import { useTheme } from "styled-components/native";

type Props = {
  error: Error;
  onClose: () => void;
};

export default function TransactionAlreadyValidatedErrorView({ error, onClose }: Readonly<Props>) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background.main,
        },
      ]}
    >
      <View style={styles.container}>
        <Flex flexDirection="column" alignItems="center" alignSelf="stretch">
          <Flex height={100} justifyContent="center">
            <BoxedIcon
              Icon={CloseMedium}
              backgroundColor={colors.opacityDefault.c05}
              size={64}
              variant="circle"
              borderColor="none"
              iconSize={32}
              iconColor={colors.error.c60}
            />
          </Flex>

          <Text
            variant="h4"
            fontWeight="semiBold"
            textAlign="center"
            numberOfLines={3}
            mb={2}
            mt={24}
          >
            <Trans i18nKey="errors.TransactionAlreadyValidated.title" />
          </Text>

          <Text variant="bodyLineHeight" color="neutral.c80" textAlign="center" numberOfLines={6}>
            <TranslatedError error={error} />
          </Text>
          <SupportLinkError error={error} />
        </Flex>

        <Button
          event="SendErrorClose"
          title={<Trans i18nKey="common.close" />}
          type="lightSecondary"
          containerStyle={styles.button}
          onPress={onClose}
        />
      </View>
      <View
        style={[
          styles.footer,
          {
            borderColor: colors.neutral.c20,
          },
        ]}
      >
        <NeedHelp />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
