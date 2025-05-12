import React from "react";
import { Entry } from "../types";
import { Flex, Icons, Text } from "@ledgerhq/native-ui/index";
import { useTranslation } from "react-i18next";
import Illustration from "~/images/illustration/Illustration";
import { ImageSourcePropType, TouchableOpacity } from "react-native";

type RowProps = Readonly<{
  entryPoint: Entry;
  illustration: ImageSourcePropType;
  link: string;
  redirect: () => void;
}>;

export function Row({ entryPoint, link, illustration, redirect }: RowProps) {
  const { t } = useTranslation();
  const title = `nftEntryPoint.entry.${entryPoint}`;

  return (
    <TouchableOpacity testID={`nft-entry-point-${entryPoint}`} onPress={redirect}>
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center" paddingY={4}>
        <Flex justifyContent="space-between" flexDirection="row" alignItems="center">
          <Illustration lightSource={illustration} darkSource={illustration} size={48} />
          <Flex flexDirection="column" ml={4} rowGap={4}>
            <Text fontSize="16px" fontWeight="semiBold" color="neutral.c100" variant="large">
              {t(title)}
            </Text>
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              {link}
            </Text>
          </Flex>
        </Flex>

        <Icons.ChevronRight size="M" color="neutral.c100" />
      </Flex>
    </TouchableOpacity>
  );
}
