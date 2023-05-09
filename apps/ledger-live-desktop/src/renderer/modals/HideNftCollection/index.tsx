import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body from "~/renderer/modals/HideNftCollection/Body";
const HideNftCollectionModal = () => (
  <Modal
    name="MODAL_HIDE_NFT_COLLECTION"
    centered
    render={({
      data,
      onClose,
    }: RenderProps<{ collectionName: string; collectionId: string; onClose?: () => void }>) => (
      <Body
        collectionName={data.collectionName}
        collectionId={data.collectionId}
        onClose={() => {
          onClose?.();
          data?.onClose?.();
        }}
      />
    )}
  />
);
export default HideNftCollectionModal;
