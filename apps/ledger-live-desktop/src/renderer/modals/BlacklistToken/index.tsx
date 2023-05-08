import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body from "~/renderer/modals/BlacklistToken/Body";

const BlacklistTokenModal = () => (
  <Modal
    name="MODAL_BLACKLIST_TOKEN"
    centered
    render={({ data, onClose }: RenderProps<{ token: TokenCurrency }>) => (
      <Body token={data.token} onClose={onClose} />
    )}
  />
);
export default BlacklistTokenModal;
