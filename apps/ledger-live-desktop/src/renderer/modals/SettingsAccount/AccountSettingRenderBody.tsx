import React, { memo, useState } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import { validateNameEdition } from "@ledgerhq/live-wallet/accountName";
import { setAccountName as actionSetAccountName } from "@ledgerhq/live-wallet/store";
import { AccountNameRequiredError } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import { urls } from "~/config/urls";
import { setDataModal } from "~/renderer/actions/modals";
import { removeAccount, updateAccount } from "~/renderer/actions/accounts";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Alert from "~/renderer/components/Alert";
import Input from "~/renderer/components/Input";
import Spoiler from "~/renderer/components/Spoiler";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import Space from "~/renderer/components/Space";
import Button from "~/renderer/components/Button";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";

type Props = {
  onClose?: () => void;
  account: Account;
};

function AccountSettingRenderBody(props: Props) {
  const { onClose, account: dataAccount } = props;

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountNameError, setAccountNameError] = useState<Error | null>(null);
  const [isRemoveAccountModalOpen, setIsRemoveAccountModalOpen] = useState<boolean>(false);

  function getAccount(): Account {
    return {
      ...dataAccount,
      ...(accountName !== null
        ? {
            name: accountName,
          }
        : {}),
    };
  }

  const handleChangeName = (value: string) => setAccountName(value);

  const handleSubmit =
    (account: Account, onClose: () => void) =>
    (e: React.SyntheticEvent<HTMLFormElement | HTMLInputElement>) => {
      e.preventDefault();

      if (!accountName || !accountName.length) {
        setAccountNameError(new AccountNameRequiredError());
      } else {
        const name = validateNameEdition(account, accountName);
        dispatch(updateAccount(account));
        dispatch(actionSetAccountName(account.id, name));
        dispatch(
          setDataModal("MODAL_SETTINGS_ACCOUNT", {
            account,
          }),
        );
        onClose();
      }
    };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    e.target.select();
    switch (name) {
      case "accountName":
        setAccountNameError(null);
        break;
      default:
        break;
    }
  };

  const handleOpenRemoveAccountModal = () => setIsRemoveAccountModalOpen(true);

  const handleCloseRemoveAccountModal = () => setIsRemoveAccountModalOpen(false);

  const handleRemoveAccount = (account: Account) => {
    dispatch(removeAccount(account));
    setIsRemoveAccountModalOpen(false);
    onClose?.();
  };

  const storeAccountName = useMaybeAccountName(dataAccount);

  if (!dataAccount) return null;

  const displayAccountName = accountName === null ? storeAccountName : accountName;
  const account = getAccount();
  const usefulData = {
    xpub: account.xpub || undefined,
    index: account.index,
    freshAddressPath: account.freshAddressPath,
    id: account.id,
    blockHeight: account.blockHeight,
  };
  const onSubmit = onClose && handleSubmit(account, onClose);
  const tag =
    account.derivationMode !== undefined &&
    account.derivationMode !== null &&
    getTagDerivationMode(account.currency, account.derivationMode as DerivationMode);
  return (
    <ModalBody
      onClose={onClose}
      title={t("account.settings.title")}
      render={() => (
        <>
          <TrackPage category="Modal" name="AccountSettings" />
          <Container>
            <Box>
              <OptionRowTitle>{t("account.settings.accountName.title")}</OptionRowTitle>
              <OptionRowDesc>{t("account.settings.accountName.desc")}</OptionRowDesc>
            </Box>
            <Box>
              <Input
                autoFocus
                containerProps={{
                  style: {
                    width: 230,
                  },
                }}
                value={displayAccountName}
                maxLength={getEnv("MAX_ACCOUNT_NAME_SIZE")}
                onChange={handleChangeName}
                onEnter={onSubmit}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => handleFocus(e, "accountName")}
                error={accountNameError}
                id="input-edit-name"
              />
            </Box>
          </Container>
          <Spoiler textTransform title={t("account.settings.advancedLogs")}>
            {tag ? <Tips tag={tag} /> : null}
            <AdvancedLogsContainer data-test-id="Advanced_Logs">
              {JSON.stringify(usefulData, null, 2)}
            </AdvancedLogsContainer>
          </Spoiler>
          <ConfirmModal
            analyticsName="RemoveAccount"
            isDanger
            centered
            isOpened={isRemoveAccountModalOpen}
            onClose={handleCloseRemoveAccountModal}
            onReject={handleCloseRemoveAccountModal}
            onConfirm={() => handleRemoveAccount(account)}
            title={t("settings.removeAccountModal.title")}
            subTitle={t("common.areYouSure")}
            desc={
              <Box>
                {t("settings.removeAccountModal.desc")}
                <Alert type="warning" mt={4}>
                  {t("settings.removeAccountModal.warning")}
                </Alert>
              </Box>
            }
          />
          <Space of={20} />
        </>
      )}
      renderFooter={() => (
        <>
          <Button
            event="OpenAccountDelete"
            danger
            type="button"
            onClick={handleOpenRemoveAccountModal}
            data-test-id="account-settings-delete-button"
          >
            {t("settings.removeAccountModal.delete")}
          </Button>
          <Button
            data-test-id="account-settings-apply-button"
            event="DoneEditingAccount"
            ml="auto"
            onClick={onSubmit}
            primary
          >
            {t("common.apply")}
          </Button>
        </>
      )}
    />
  );
}

export default React.memo(AccountSettingRenderBody);

export const OptionRowDesc = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 3,
  textAlign: "left",
  lineHeight: 1.69,
  color: "palette.text.shade60",
}))``;

export const OptionRowTitle = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  fontSize: 4,
  textAlign: "left",
  lineHeight: 1.69,
}))``;

const AdvancedLogsContainer = styled.div`
  border: 1px dashed ${p => p.theme.colors.palette.background.default};
  background-color: ${p => p.theme.colors.palette.background.default};
  color: ${p => p.theme.colors.palette.text.shade100};
  font-family: monospace;
  font-size: 11px;
  outline: none;
  padding: 20px;
  margin-top: 15px;
  width: 100%;
  white-space: pre-wrap;
  word-wrap: break-word;
  ${p => p.theme.overflow.xy};
  user-select: text;
`;
export const Container = styled(Box).attrs(() => ({
  flow: 2,
  horizontal: true,
  mb: 3,
  pb: 4,
}))`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  justify-content: space-between;
`;

const Tips = memo(function Tips({ tag }: { tag: string }) {
  return (
    <Alert type="primary" learnMoreUrl={urls.xpubLearnMore}>
      <Trans
        i18nKey="account.settings.advancedTips"
        values={{
          tag,
        }}
      />
    </Alert>
  );
});
