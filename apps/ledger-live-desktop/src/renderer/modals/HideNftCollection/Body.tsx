import Box from "~/renderer/components/Box";
import { Trans, useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import React from "react";
import Footer from "~/renderer/modals/HideNftCollection/Footer";
import { SupportedBlockchain } from "@ledgerhq/live-nft/supported";

const Body = ({
  onClose,
  collectionId,
  collectionName,
  blockchain,
}: {
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  blockchain: string;
}) => {
  const { t } = useTranslation();
  return (
    <ModalBody
      onClose={onClose}
      title={t("hideNftCollection.title")}
      render={() => (
        <Box>
          <Box
            ff="Inter|Regular"
            fontSize={4}
            color="palette.text.shade60"
            textAlign="center"
            mb={2}
            mt={3}
          >
            <Trans
              i18nKey="hideNftCollection.desc"
              parent="div"
              values={{
                collectionName,
              }}
            >
              {"This action will hide all NFTs from the "}
              <Text ff="Inter|SemiBold" color="palette.text.shade100">
                {collectionName}
              </Text>
              {" collection, you can show them again using "}
              <Text ff="Inter|SemiBold" color="palette.text.shade100">
                {"Settings"}
              </Text>
            </Trans>
          </Box>
        </Box>
      )}
      renderFooter={() => (
        <Footer
          collectionId={collectionId}
          onClose={onClose}
          blockchain={blockchain as SupportedBlockchain}
        />
      )}
    />
  );
};
export default Body;
