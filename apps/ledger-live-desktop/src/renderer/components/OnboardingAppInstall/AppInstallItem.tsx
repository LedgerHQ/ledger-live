import React, { memo } from "react";
import { Icons, Flex, ProgressLoader, Text } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";

type Props = {
  appName: string;
  isActive?: boolean;
  installed?: boolean;
  itemProgress?: number;
  index: number;
};

const AppInstallItem = ({ appName, isActive, installed, itemProgress, index }: Props) => {
  const { colors } = useTheme();

  return (
    <Flex key={appName} flexDirection={"row"} alignItems="center" mb={6}>
      <Flex
        alignItems="center"
        justifyContent="center"
        borderRadius={9999}
        size={40}
        bg={colors.neutral.c30}
      >
        {isActive ? (
          <ProgressLoader
            showPercentage={false}
            stroke={2}
            progress={(itemProgress || 0) * 100}
            radius={12}
          />
        ) : installed ? (
          <Icons.CheckAloneMedium size={18} color="success.c80" />
        ) : (
          <Text color="neutral.c100" variant="body">
            {index + 1}
          </Text>
        )}
      </Flex>
      <Text ml={3} variant="paragraphLineHeight" textTransform="capitalize">
        {appName}
      </Text>
    </Flex>
  );
};

export default memo(AppInstallItem);
