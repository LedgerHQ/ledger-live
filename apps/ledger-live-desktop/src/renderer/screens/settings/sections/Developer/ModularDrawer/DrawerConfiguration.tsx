import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import { DRAWER_CONFIG_OPTIONS } from "./constants";
import { DrawerConfigurationProps } from "./types";
import { LabeledSelect } from "./LabeledSelect";

export const DrawerConfiguration: React.FC<DrawerConfigurationProps> = ({
  assetsLeftElement,
  setAssetsLeftElement,
  assetsRightElement,
  setAssetsRightElement,
  networksLeftElement,
  setNetworksLeftElement,
  networksRightElement,
  setNetworksRightElement,
}) => {
  return (
    <Flex flexDirection="column" rowGap={3}>
      <Text variant="body" fontWeight="semiBold" fontSize="16px">
        Drawer Configuration
      </Text>
      <Text variant="body" fontWeight="semiBold" fontSize="14px">
        Assets Page
      </Text>
      <LabeledSelect
        label="Left Element"
        value={assetsLeftElement}
        options={DRAWER_CONFIG_OPTIONS.assets.left}
        onChange={setAssetsLeftElement}
      />
      <LabeledSelect
        label="Right Element"
        value={assetsRightElement}
        options={DRAWER_CONFIG_OPTIONS.assets.right}
        onChange={setAssetsRightElement}
      />
      <Text variant="body" fontWeight="semiBold" fontSize="14px">
        Networks Page
      </Text>
      <LabeledSelect
        label="Left Element"
        value={networksLeftElement}
        options={DRAWER_CONFIG_OPTIONS.networks.left}
        onChange={setNetworksLeftElement}
      />
      <LabeledSelect
        label="Right Element"
        value={networksRightElement}
        options={DRAWER_CONFIG_OPTIONS.networks.right}
        onChange={setNetworksRightElement}
      />
    </Flex>
  );
};
