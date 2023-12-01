import React, { memo } from "react";
import { useSelector } from "react-redux";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useTheme } from "styled-components/native";
import { Box } from "@ledgerhq/native-ui";
import { networkErrorSelector } from "~/reducers/appstate";
import HeaderErrorTitle from "~/components/HeaderErrorTitle";

const Header = () => {
  const { error } = useGlobalSyncState();
  const networkError = useSelector(networkErrorSelector);
  const { colors } = useTheme();

  return error ? (
    <Box bg={colors.background.main} pt={16}>
      <HeaderErrorTitle withDescription error={networkError || error} />
    </Box>
  ) : null;
};

export default memo(Header);
