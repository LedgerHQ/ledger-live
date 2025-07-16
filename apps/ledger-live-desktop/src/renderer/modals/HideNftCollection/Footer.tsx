import React, { useCallback } from "react";
import Button from "~/renderer/components/Button";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import { useDispatch } from "react-redux";
import { updateNftStatus } from "~/renderer/actions/settings";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";
import { NftStatus } from "@ledgerhq/live-nft/types";

const Footer = ({
  onClose,
  collectionId,
  blockchain,
}: {
  onClose: () => void;
  collectionId: string;
  blockchain: SupportedBlockchain;
}) => {
  const dispatch = useDispatch();

  const confirmHideNftCollection = useCallback(
    (collectionId: string, blockchain: SupportedBlockchain) => {
      dispatch(updateNftStatus(blockchain, collectionId, NftStatus.blacklisted));
    },
    [dispatch],
  );
  return (
    <Box horizontal alignItems="center" justifyContent="flex-end" flow={2}>
      <Button onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        data-testid="modal-confirm-button"
        onClick={() => {
          confirmHideNftCollection(collectionId, blockchain);
          onClose();
        }}
        primary
      >
        <Trans i18nKey="hideNftCollection.hideCTA" />
      </Button>
    </Box>
  );
};
export default Footer;
