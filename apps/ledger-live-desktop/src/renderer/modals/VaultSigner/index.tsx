import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";

import Label from "~/renderer/components/Label";
import Alert from "~/renderer/components/Alert";
import { vaultSignerSelector } from "~/renderer/reducers/settings";
import { setVaultSigner } from "~/renderer/actions/settings";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import InputPassword from "~/renderer/components/InputPassword";
import ExternalLink from "~/renderer/components/ExternalLink";
import { openURL } from "~/renderer/linking";

const VaultSigner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { host, token, workspace, ...rest } = useSelector(vaultSignerSelector);
  const [localHost, setLocalHost] = useState<string>(host);
  const [localWorkspace, setLocalWorkspace] = useState<string>(workspace);
  const [localToken, setLocalToken] = useState<string>(token);

  const onSubmit = ({ onClose }: { onClose: () => void }) => {
    dispatch(
      setVaultSigner({
        ...rest,
        token: localToken,
        host: localHost,
        workspace: localWorkspace,
      }),
    );
    onClose();
  };

  const isValid = localHost !== "" && localWorkspace !== "" && localToken !== "";

  return (
    <Modal
      name="MODAL_VAULT_SIGNER"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="vaultSigner.modal.title" />}
          noScroll
          render={() => (
            <Flex flexDirection="column" rowGap={4}>
              <Alert type="primary">
                <Flex flexDirection="column" rowGap={2}>
                  <Trans i18nKey="vaultSigner.modal.info" />
                  <ExternalLink
                    label={t("vaultSigner.modal.info_link")}
                    isInternal={false}
                    onClick={() => openURL("https://help.vault.ledger.com")}
                  />
                </Flex>
              </Alert>
              <Flex flexDirection="column" rowGap={1}>
                <Label>
                  <Trans i18nKey="vaultSigner.modal.workspace.title" />
                </Label>
                <Input
                  onFocus={() => undefined}
                  onBlur={() => undefined}
                  onChange={setLocalWorkspace}
                  value={localWorkspace}
                  placeholder={t("vaultSigner.modal.workspace.placeholder")}
                />
              </Flex>
              <Flex flexDirection="column" rowGap={1}>
                <Label>
                  <Trans i18nKey="vaultSigner.modal.host.title" />
                </Label>
                <Input
                  onFocus={() => undefined}
                  onBlur={() => undefined}
                  onChange={setLocalHost}
                  value={localHost}
                  placeholder={t("vaultSigner.modal.host.placeholder")}
                />
              </Flex>
              <Flex flexDirection="column" rowGap={1}>
                <Label>
                  <Trans i18nKey="vaultSigner.modal.token.title" />
                </Label>
                <InputPassword onChange={setLocalToken} value={localToken} />
              </Flex>
              <Flex alignSelf="flex-end">
                <Button primary onClick={() => onSubmit({ onClose })} disabled={!isValid}>
                  <Trans i18nKey="vaultSigner.modal.submit" />
                </Button>
              </Flex>
            </Flex>
          )}
        />
      )}
    />
  );
};

export default VaultSigner;
