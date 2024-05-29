import React from "react";
import styled from "styled-components";
import { ExternalViewerButton } from "LLD/Collectibles/components/DetailDrawer/components";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import IconSend from "~/renderer/icons/Send";
import { ProtoNFT, Account, NFTMetadata } from "@ledgerhq/types-live";

const NFTActions = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0px;
  justify-content: center;
`;

type CtasProps = {
  protoNft: ProtoNFT;
  account: Account;
  metadata: NFTMetadata;
  onNFTSend: () => void;
};

const Ctas: React.FC<CtasProps> = ({ protoNft, account, metadata, onNFTSend }) => {
  const { t } = useTranslation();

  return (
    <NFTActions>
      <Button
        style={{
          flex: 1,
          justifyContent: "center",
        }}
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

      <ExternalViewerButton nft={protoNft} account={account} metadata={metadata as NFTMetadata} />
    </NFTActions>
  );
};

export default Ctas;
