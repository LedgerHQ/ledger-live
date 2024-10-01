import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { ExternalViewerButton } from "LLD/features/Collectibles/components/DetailDrawer/components";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { Account } from "@ledgerhq/types-live";
import { useHideInscriptions } from "LLD/features/Collectibles/hooks/useHideInscriptions";

type ActionsProps = {
  inscription: SimpleHashNft;
  account: Account;
  onModalClose: () => void;
};

const Actions: React.FC<ActionsProps> = ({ inscription, account, onModalClose }) => {
  const { t } = useTranslation();
  const { openConfirmHideInscriptionModal } = useHideInscriptions();

  const onClick = () => {
    openConfirmHideInscriptionModal(
      inscription.name || inscription.contract.name || "",
      String(inscription.extra_metadata?.ordinal_details?.inscription_id),
      onModalClose,
    );
  };

  return (
    <Flex alignItems="center" columnGap={12}>
      <Button
        outlineGrey
        style={{ flex: 1, justifyContent: "center" }}
        my={4}
        onClick={onClick}
        center
      >
        <Flex columnGap={1}>
          <Icons.Eye color="neutral.c100" />
          <Text variant="bodyLineHeight" fontWeight="600" fontSize={14} color="neutral.c100">
            {t("ordinals.inscriptions.detailsDrawer.hide")}
          </Text>
        </Flex>
      </Button>
      <ExternalViewerButton
        nft={inscription}
        account={account}
        metadata={inscription.extra_metadata}
      />
    </Flex>
  );
};
export default Actions;
