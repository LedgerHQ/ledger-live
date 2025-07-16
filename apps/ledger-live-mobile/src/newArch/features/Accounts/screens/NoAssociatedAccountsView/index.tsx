import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { Flex, Icons, rgba } from "@ledgerhq/native-ui";
import Circle from "~/components/Circle";
import SafeAreaView from "~/components/SafeAreaView";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import VerticalGradientBackground from "LLM/features/Accounts/components/VerticalGradientBackground";
import useNoAssociatedAccountsViewModel, { type Props } from "./useNoAssociatedAccountsViewModel";

type ViewProps = ReturnType<typeof useNoAssociatedAccountsViewModel>;

function View({ statusColor, space, CustomNoAssociatedAccounts, onCloseNavigation }: ViewProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={["left", "right", "bottom", "top"]} isFlex>
      <VerticalGradientBackground stopColor={statusColor} />
      <Flex
        bg={rgba(statusColor, 0.1)}
        mt={space[13]}
        borderColor="primary.c70"
        alignSelf="center"
        style={styles.iconWrapper}
      >
        <Circle size={24}>
          <Icons.InformationFill size="L" color={statusColor} />
        </Circle>
      </Flex>
      <Flex alignItems="center" justifyContent="center" px={20} flex={1}>
        {<CustomNoAssociatedAccounts />}
      </Flex>
      <Flex px={6} rowGap={6}>
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={onCloseNavigation}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});

const NoAssociatedAccountsView: React.FC<Props> = props => (
  <View {...useNoAssociatedAccountsViewModel(props)} />
);

export default NoAssociatedAccountsView;
