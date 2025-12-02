import React from "react";
import { DialogHeader } from "@ledgerhq/ldls-ui-react";
import { AssetList } from "./components/AssetList";
import { SearchBar } from "./components/SearchBar";
import { Box, Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";

type AssetSelectionProps = {
  onClose: () => void;
  onBack?: () => void;
  onAssetSelect: (assetId: string) => void;
};

const StyledDialogHeader = styled(DialogHeader)`
  padding: var(--spacing-0, 0) var(--spacing-24, 24px);
`;

const AssetSelectorContent = styled(Flex)`
  height: 612px;
  overflow: hidden;
`;

const ScrollableContent = styled(Flex)`
  overflow-y: auto;
  flex: 1;
`;

export const AssetSelection = ({ onClose, onBack, onAssetSelect }: AssetSelectionProps) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  return (
    <>
      <StyledDialogHeader
        appearance="extended"
        title="Select asset"
        onClose={onClose}
        onBack={onBack}
      />
      <AssetSelectorContent flexDirection="column" rowGap={4}>
        <Box padding={"1px"}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </Box>

        <ScrollableContent flexDirection="column" rowGap={2}>
          <AssetList searchQuery={debouncedSearchQuery} onAssetSelect={onAssetSelect} />
        </ScrollableContent>
      </AssetSelectorContent>
    </>
  );
};
