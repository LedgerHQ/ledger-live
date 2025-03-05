import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Icons, Link, Flex, Button } from "@ledgerhq/native-ui";
import QueuedDrawer from "~/components/QueuedDrawer";
import useAddressTypeTooltipViewModel, { type Props } from "./useAddressTypeTooltipViewModel";
import SchemeRow from "./components/SchemeRow";

type ViewProps = ReturnType<typeof useAddressTypeTooltipViewModel>;

const View = ({
  formattedAccountSchemes,
  currency,
  isOpen,
  displayLearnMoreButton,
  onOpen,
  onClose,
  onClickLearnMore,
}: ViewProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Link onPress={onOpen} style={styles.link}>
        <Flex alignItems="center" flexDirection="row" columnGap={8}>
          <Text variant="bodyLineHeight" fontWeight="semiBold" style={styles.underline}>
            {t("addAccounts.scanDeviceAccounts.whichAddressType")}
          </Text>
          <Icons.InformationFill size="S" color="neutral.c100" />
        </Flex>
      </Link>

      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} style={styles.modal}>
        <Flex alignItems="center" justifyContent="center" marginTop={24} marginBottom={16}>
          <Text variant="body" color="neutral.c70">
            {t("addAccounts.addressTypeInfo.subtitle")}
          </Text>
          <Text variant="h3">{t("addAccounts.addressTypeInfo.title")}</Text>
        </Flex>
        {formattedAccountSchemes.map(scheme => (
          <SchemeRow key={scheme} scheme={scheme} currency={currency} />
        ))}
        {displayLearnMoreButton && (
          <Button
            type="main"
            Icon={() => <Icons.ExternalLink size="M" color="primary.c10" />}
            iconPosition="left"
            onPress={onClickLearnMore}
          >
            {t("common.learnMore")}
          </Button>
        )}
      </QueuedDrawer>
    </>
  );
};

const styles = StyleSheet.create({
  link: {
    alignSelf: "flex-start",
    paddingTop: 16,
  },
  underline: {
    textDecorationLine: "underline",
  },
  modal: {
    paddingHorizontal: 24,
  },
});

const AddressTypeTooltip: React.FC<Props> = props => (
  <View {...useAddressTypeTooltipViewModel(props)} />
);

export default AddressTypeTooltip;
