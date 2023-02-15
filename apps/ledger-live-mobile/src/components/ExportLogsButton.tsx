import React from "react";
import { Trans } from "react-i18next";
import { Icons, Text, Link } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import useExportLogs from "./useExportLogs";

const StyledLink = styled(Link).attrs({
  iconPosition: "left",
})`
  padding: 12px;
`;

const ExportLogsButton = () => {
  const onExport = useExportLogs();
  return (
    <StyledLink Icon={Icons.DownloadMedium} onPress={onExport}>
      <Text variant="body" fontSize={5}>
        <Trans i18nKey="common.saveLogs" />
      </Text>
    </StyledLink>
  );
};

export default ExportLogsButton;
