import React, { memo } from "react";
import { Box } from "@ledgerhq/native-ui";
import HeaderErrorTitle from "~/components/HeaderErrorTitle";
import { useNetInfo } from "@react-native-community/netinfo";
import { NetworkDown } from "@ledgerhq/errors";

type ErrorBannerProps = {
  error: Error;
};

const ErrorBanner = ({ error }: ErrorBannerProps) => {
  const { isConnected } = useNetInfo();
  const networkError = isConnected ? new NetworkDown() : null;

  return (
    <Box paddingY={16}>
      <HeaderErrorTitle withDescription error={networkError || error} />
    </Box>
  );
};

export default memo(ErrorBanner);
