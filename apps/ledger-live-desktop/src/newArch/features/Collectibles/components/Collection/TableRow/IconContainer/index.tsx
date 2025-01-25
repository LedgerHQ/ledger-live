import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { IconProps } from "LLD/features/Collectibles/types/Collection";
import RareSatToolTip from "./ToolTip";
import { MappingKeys } from "LLD/features/Collectibles/types/Ordinals";

type Props = {
  icons: (({ size, color, style }: IconProps) => JSX.Element)[];
  iconNames: MappingKeys[];
};

const IconContainer: React.FC<Props> = ({ icons, iconNames }) => {
  return (
    <Flex
      borderRadius="8px"
      justifyContent="center"
      alignItems="center"
      bg="opacityDefault.c05"
      borderColor="opacityDefault.c10"
      borderWidth="1px"
      borderStyle="solid"
      p="8px"
      columnGap="8px"
    >
      {icons.map(
        (Icon, index) =>
          iconNames && (
            <RareSatToolTip key={index} content={iconNames[index]}>
              <div data-testid={`raresatIcon-${iconNames[index]}-${index}`} />
              {/* only for testing nothing displayed since I can't do it on icon */}
              <Icon size="XS" color="neutral.c100" />
            </RareSatToolTip>
          ),
      )}
    </Flex>
  );
};

export default IconContainer;
