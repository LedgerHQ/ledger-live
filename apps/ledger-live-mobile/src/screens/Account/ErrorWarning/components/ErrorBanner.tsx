import React, { memo } from "react";
import { Box } from "@ledgerhq/native-ui";
import HeaderErrorTitle from "~/components/HeaderErrorTitle";
import { useNetworkState } from "expo-network";
import { NetworkDown } from "@ledgerhq/live-common/errors";

type ErrorBannerProps = {
  error: Error;
};

const ErrorBanner = ({ error }: ErrorBannerProps) => {
  const { isConnected } = useNetworkState();
  const networkError = isConnected ? new NetworkDown() : null;

  return (
    <Box paddingY={16}>
      <HeaderErrorTitle withDescription error={networkError || error} />
    </Box>
  );
};

export default memo(ErrorBanner);
