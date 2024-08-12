import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Checkbox, Button, Icons, Box } from "@ledgerhq/native-ui";
import { translateContent } from "@ledgerhq/live-common/wallet-api/logic";
import ManifestRow from "LLM/features/Web3Hub/components/ManifestRow";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useLocale } from "~/context/Locale";
import useDisclaimerViewModel from "./useDisclaimerViewModel";

type Props = {
  disclaimer: ReturnType<typeof useDisclaimerViewModel>;
};

export { useDisclaimerViewModel };

export default function Disclaimer({
  disclaimer: { isOpened, isChecked, toggleCheck, onClose, onConfirm, manifest },
}: Props) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const description = useMemo(() => {
    return manifest?.content.description
      ? translateContent(manifest.content.description, locale)
      : undefined;
  }, [locale, manifest?.content.description]);

  const clearSigningEnabled = useMemo(() => {
    return manifest?.categories.includes("clear signing");
  }, [manifest?.categories]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onClose}>
      {manifest ? (
        <Flex flexDirection="row" alignItems="center" height={72}>
          <ManifestRow manifest={manifest} />
        </Flex>
      ) : null}

      {description ? (
        <Flex mt={6}>
          <Text numberOfLines={12} fontSize={14} lineHeight={"22px"} color="smoke">
            {description}
          </Text>
        </Flex>
      ) : null}

      <Box mt={6} height="1px" width="100%" backgroundColor={"translucentGrey"} />

      {clearSigningEnabled ? (
        <Flex mt={6} flexDirection={"row"} alignItems={"center"}>
          <Box mr={2}>
            <Icons.Eye color={"smoke"} />
          </Box>
          <Text fontSize={14} color="smoke">
            {t("web3hub.components.disclaimer.clearSigningEnabled")}
          </Text>
        </Flex>
      ) : (
        <Flex mt={6} flexDirection={"row"} alignItems={"center"}>
          <Box mr={2}>
            <Icons.EyeCross color={"smoke"} />
          </Box>
          <Text fontSize={14} color="smoke">
            {t("web3hub.disclaimer.clearSigningDisabled")}
          </Text>
        </Flex>
      )}

      <Flex mt={6}>
        <Checkbox
          label={"  " + t("web3hub.components.disclaimer.checkbox")}
          checked={isChecked}
          onChange={toggleCheck}
        />
      </Flex>

      <Flex mt={6}>
        <Button type="main" onPress={onConfirm}>
          {t("web3hub.components.disclaimer.CTA", { app: manifest?.name })}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
