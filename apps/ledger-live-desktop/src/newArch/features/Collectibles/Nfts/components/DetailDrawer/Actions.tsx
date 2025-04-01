import React from "react";
import styled from "styled-components";
import { ExternalViewerButton } from "LLD/features/Collectibles/components/DetailDrawer/components";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import IconSend from "~/renderer/icons/Send";
import { ProtoNFT, Account, NFTMetadata } from "@ledgerhq/types-live";
import { Box } from "@ledgerhq/react-ui/index";

const NFTActions = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0px;
  justify-content: center;
`;

type ActionsProps = {
  protoNft: ProtoNFT;
  account: Account;
  metadata: NFTMetadata;
  onNFTSend?: () => void;
};

const buttonStyle = {
  flex: 1,
  justifyContent: "center",
};

const Actions: React.FC<ActionsProps> = ({ protoNft, account, metadata, onNFTSend }) => {
  const { t } = useTranslation();

  return (
    <NFTActions>
      {onNFTSend ? (
        <Button
          data-testid="nft-send-button-sendDrawer"
          style={buttonStyle}
          mr={4}
          primary
          onClick={onNFTSend}
          center
        >
          <IconSend size={12} />
          <Text ml={1} fontSize={3} lineHeight="18px">
            {t("NFT.viewer.actions.send")}
          </Text>
        </Button>
      ) : (
        <Box flex={1} />
      )}

      <ExternalViewerButton nft={protoNft} account={account} metadata={metadata as NFTMetadata} />
    </NFTActions>
  );
};

export default Actions;
