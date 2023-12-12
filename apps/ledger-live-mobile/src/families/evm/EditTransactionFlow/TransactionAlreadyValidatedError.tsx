import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import { CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { CompositeScreenProps } from "@react-navigation/core";

import TranslatedError from "~/components/TranslatedError";
import SupportLinkError from "~/components/SupportLinkError";
import Button from "~/components/Button";
import NeedHelp from "~/components/NeedHelp";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { EditTransactionParamList } from "./EditTransactionParamList";
import { ScreenName } from "~/const";

type Props = CompositeScreenProps<
  StackNavigatorProps<EditTransactionParamList, ScreenName.TransactionAlreadyValidatedError>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

const TransactionAlreadyValidatedErrorComponent = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { error } = route.params;

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
        <Flex flexDirection={"column"} alignItems={"center"} alignSelf="stretch">
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
            variant={"h4"}
            fontWeight="semiBold"
            textAlign={"center"}
            numberOfLines={3}
            mb={2}
            mt={24}
          >
            {t("errors.TransactionAlreadyValidated.title")}
          </Text>

          <>
            <Text
              variant={"bodyLineHeight"}
              color="neutral.c80"
              textAlign="center"
              numberOfLines={6}
            >
              <TranslatedError error={error} />
            </Text>
            <SupportLinkError error={error} />
          </>
        </Flex>

        <Button
          event="SendErrorClose"
          title={<Trans i18nKey="common.close" />}
          type="lightSecondary"
          containerStyle={styles.button}
          onPress={() => {
            navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
          }}
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
};

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

export const TransactionAlreadyValidatedError = memo<Props>(
  TransactionAlreadyValidatedErrorComponent,
);
