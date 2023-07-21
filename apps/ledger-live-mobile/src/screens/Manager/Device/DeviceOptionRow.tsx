import React from "react";
import { Flex, IconsLegacy, Link, Text } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";

type Props = {
  Icon: IconType;
  iconSize?: number;
  label: string;
  linkLabel: string;
  onPress?: () => void;
  right?: React.ReactNode;
};

const DeviceOptionRow: React.FC<Props> = props => {
  const { Icon, iconSize, label, right, linkLabel, onPress } = props;
  return (
    <Flex flexDirection="row" alignItems="center">
      <Icon size={iconSize || 24} color="neutral.c80" />
      <Text ml={3} variant="bodyLineHeight" color="neutral.c80">
        {label}
      </Text>
      <Flex flex={1} />
      {right || (
        <Link
          onPress={onPress}
          disabled={!onPress}
          type="color"
          Icon={IconsLegacy.ChevronRightMedium}
        >
          {linkLabel}
        </Link>
      )}
    </Flex>
  );
};

export default DeviceOptionRow;
