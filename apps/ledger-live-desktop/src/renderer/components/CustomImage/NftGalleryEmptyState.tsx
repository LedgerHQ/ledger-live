import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import Illustration from "~/renderer/components/Illustration";
import NftEmptyStateLight from "./assets/NftEmptyStateLight.svg";
import NftEmptyStateDark from "./assets/NftEmptyStateDark.svg";

const NftGalleryEmptyState = () => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection={"column"} alignItems="center">
      <Illustration size={280} lightSource={NftEmptyStateLight} darkSource={NftEmptyStateDark} />
      <Text fontSize={8} color="neutral.c100" mb={3}>
        {t("customImage.steps.choose.nftEmptyStateTitle")}
      </Text>
      <Text fontSize={6} color="neutral.c80">
        {t("customImage.steps.choose.nftEmptyStateDescription")}
      </Text>
    </Flex>
  );
};

export default NftGalleryEmptyState;
