import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import IconContainer from "LLD/features/Collectibles/components/Collection/TableRow/IconContainer";
import { IconProps } from "LLD/features/Collectibles/types/Collection";
import { MappingKeys } from "LLD/features/Collectibles/types/Ordinals";
import { useTranslation } from "react-i18next";

type Props = {
  icons: (({ size, color, style }: IconProps) => JSX.Element)[];
  names: MappingKeys[];
};

const SubTitle: React.FC<Props> = ({ icons, names }) => {
  const { t } = useTranslation();
  return (
    <Flex mb={20} alignItems="center" columnGap={12}>
      <IconContainer icons={icons} iconNames={names} />
      <Text variant="bodyLineHeight" fontSize={14} color="neutral.c70">
        {t("ordinals.inscriptions.detailsDrawer.storedOnChain")}
      </Text>
    </Flex>
  );
};

export default SubTitle;
