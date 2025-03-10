import React, { memo } from "react";
import { useSelector } from "react-redux";
import { Box } from "@ledgerhq/native-ui";
import { networkErrorSelector } from "~/reducers/appstate";
import HeaderErrorTitle from "~/components/HeaderErrorTitle";
import useAppStateListener from "~/components/useAppStateListener";

type ErrorHeaderProps = {
  error: Error;
};

const Error = ({ error }: ErrorHeaderProps) => {
  useAppStateListener();
  const networkError = useSelector(networkErrorSelector);

  return (
    <Box paddingY={16}>
      <HeaderErrorTitle withDescription error={networkError || error} />
    </Box>
  );
};

export default memo(Error);
