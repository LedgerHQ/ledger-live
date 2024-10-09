import React from "react";
import { Text } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import { Trans, useTranslation } from "react-i18next";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import Button from "~/renderer/components/Button";
import { useHideInscriptions } from "LLD/features/Collectibles/hooks/useHideInscriptions";

const Body = ({
  onClose,
  inscriptionName,
  inscriptionId,
}: {
  onClose: () => void;
  inscriptionName: string;
  inscriptionId: string;
}) => {
  const { t } = useTranslation();
  const { hideInscription } = useHideInscriptions();

  const confirmHide = () => {
    onClose();
    hideInscription(inscriptionId);
  };

  return (
    <ModalBody
      onClose={onClose}
      title={t("ordinals.inscriptions.modal.title")}
      render={() => (
        <Box>
          <Box
            color="palette.text.shade60"
            mb={2}
            mt={3}
            alignItems={"center"}
            textAlign={"center"}
          >
            <Trans
              i18nKey="ordinals.inscriptions.modal.desc"
              t={t}
              values={{ inscriptionName }}
              components={[<Text key={1} ff="Inter|SemiBold" alignSelf={"center"} />]}
            />
          </Box>
        </Box>
      )}
      renderFooter={() => (
        <Box horizontal alignItems="center" justifyContent="flex-end" flow={2}>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button data-testid="modal-confirm-button" onClick={confirmHide} primary>
            {t("ordinals.inscriptions.hide")}
          </Button>
        </Box>
      )}
    />
  );
};
export default Body;
