import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, IconBox, Text, Checkbox, IconsLegacy, Button } from "@ledgerhq/native-ui";
import { Disclaimer } from "../hooks";
import { AppIcon } from "../AppIcon";
import LedgerIcon from "~/icons/Ledger";
import QueuedDrawer from "~/components/QueuedDrawer";

export function DAppDisclaimer({
  disclaimer: { name, icon, isChecked, isOpened, onClose, toggleCheck, onConfirm },
}: {
  disclaimer: Disclaimer;
}) {
  const { t } = useTranslation();

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onClose}>
      <Flex flexDirection="row" justifyContent="center" alignItems="center" mb={10}>
        <IconBox iconSize={28} boxSize={40} Icon={LedgerIcon} />
        {icon && (
          <>
            <IconsSeparator />
            <Flex mx={2}>
              <AppIcon size={40} icon={icon} />
            </Flex>
          </>
        )}
      </Flex>

      <Text variant="h2" mb={6} textAlign="center" color="neutral.c100" uppercase>
        {name}
      </Text>

      <Text variant="body" mb={10} color="neutral.c70" textAlign="center">
        {t("platform.disclaimer.description")}
      </Text>

      <Flex
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        mb={6}
        padding={6}
        backgroundColor="primary.c20"
        borderRadius={2}
      >
        <IconsLegacy.InfoMedium color="primary.c90" size={20} />
        <Text variant="body" color="primary.c90" ml={5}>
          {t("platform.disclaimer.legalAdviceShort")}
        </Text>
      </Flex>

      <Flex
        flexDirection="row"
        justifyContent="flex-start"
        alignItems="center"
        backgroundColor="neutral.c30"
        padding={6}
        borderRadius={2}
      >
        <Checkbox
          label={t("platform.disclaimer.checkbox")}
          checked={isChecked}
          onChange={toggleCheck}
        />
      </Flex>

      <Flex mt={8}>
        <Button type="main" onPress={onConfirm}>
          {t("platform.disclaimer.CTA")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

const IconsSeparator = React.memo(() => (
  <Flex flexDirection="row" justifyContent="center" alignItems="center" mx={2}>
    {Array(6)
      .fill(undefined)
      .map((_, i) => (
        <Flex key={i} width="3px" height={1} marginX={2} backgroundColor="neutral.c40" />
      ))}
  </Flex>
));
