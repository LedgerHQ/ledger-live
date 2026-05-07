import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Text from "~/renderer/components/Text";

export default function CantonTermsModal() {
  return (
    <Modal
      centered
      name="MODAL_CANTON_TERMS"
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          title={<Trans i18nKey="families.canton.disclaimer.terms.title" />}
          render={() => (
            <Box p={4}>
              <Text ff="Inter|SemiBold" fontSize={4} color="neutral.c100" mb={3}>
                <Trans i18nKey="families.canton.disclaimer.terms.sectionTitle" />
              </Text>
              <Text
                ff="Inter|Regular"
                fontSize={4}
                color="neutral.c80"
                style={{ whiteSpace: "pre-line" }}
              >
                <Trans i18nKey="families.canton.disclaimer.terms.body" />
              </Text>
            </Box>
          )}
        />
      )}
    />
  );
}
