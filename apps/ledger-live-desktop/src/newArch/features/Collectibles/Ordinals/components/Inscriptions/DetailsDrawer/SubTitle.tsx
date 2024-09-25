import React from "react";
import { t } from "i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import IconContainer from "LLD/features/Collectibles/components/Collection/TableRow/IconContainer";
import { IconProps } from "LLD/features/Collectibles/types/Collection";
import { MappingKeys } from "LLD/features/Collectibles/types/Ordinals";

type Props = {
  icons: (({ size, color, style }: IconProps) => JSX.Element)[];
  names: MappingKeys[];
};

const SubTitle: React.FC<Props> = ({ icons, names }) => (
  <Flex mb={20} alignItems="center" columnGap={12}>
    <IconContainer icons={icons} iconNames={names} />
    <Text variant="bodyLineHeight" fontSize={14} color="neutral.c70">
      {t("ordinals.inscriptions.detailsDrawer.storedOnChain")}
    </Text>
  </Flex>
);

export default SubTitle;
