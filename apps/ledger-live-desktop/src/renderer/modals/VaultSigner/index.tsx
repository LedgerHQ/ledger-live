import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Flex } from "@ledgerhq/react-ui";
import Label from "~/renderer/components/Label";
import { setEnvOnAllThreads } from "~/helpers/env";
import { vaultSignerSelector } from "~/renderer/reducers/settings";
import { setVaultSigner } from "~/renderer/actions/settings";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import InputPassword from "~/renderer/components/InputPassword";

const VaultSigner = ({ name }: { name: string }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { host, token, workspace, ...rest } = useSelector(vaultSignerSelector);
  const [localHost, setLocalHost] = useState<string>(host);
  const [localWorkspace, setLocalWorkspace] = useState<string>(workspace);
  const [localToken, setLocalToken] = useState<string>(token);

  const onSubmit = onClose => {
    setEnvOnAllThreads("VAULT_SIGNER_HOST", localHost);
    setEnvOnAllThreads("VAULT_SIGNER_TOKEN", localToken);

    dispatch(
      setVaultSigner({ ...rest, token: localToken, host: localHost, workspace: localWorkspace }),
    );
    onClose();
  };

  const isValid = localHost !== "" && localWorkspace !== "" && localToken !== "";

  return (
    <Modal
      name={name}
      centered
      render={({ onClose }: { onClose: void }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="vaultSigner.modal.title" />}
          noScroll
          render={() => (
            <Flex flexDirection="column" rowGap={4}>
              <Flex flexDirection="column" rowGap={1}>
                <Label>
                  <Trans i18nKey="vaultSigner.modal.host.title" />
                </Label>
                <Input
                  onChange={setLocalHost}
                  value={localHost}
                  placeholder={t("vaultSigner.modal.host.placeholder")}
                />
              </Flex>
              <Flex flexDirection="column" rowGap={1}>
                <Label>
                  <Trans i18nKey="vaultSigner.modal.workspace.title" />
                </Label>
                <Input
                  onChange={setLocalWorkspace}
                  value={localWorkspace}
                  placeholder={t("vaultSigner.modal.workspace.placeholder")}
                />
              </Flex>
              <Flex flexDirection="column" rowGap={1}>
                <Label>
                  <Trans i18nKey="vaultSigner.modal.token.title" />
                </Label>
                <InputPassword
                  onChange={setLocalToken}
                  value={localToken}
                  placeholder={t("vaultSigner.modal.token.placeholder")}
                />
              </Flex>
              <Flex alignSelf="flex-end">
                <Button primary onClick={() => onSubmit(onClose)} disabled={!isValid}>
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
