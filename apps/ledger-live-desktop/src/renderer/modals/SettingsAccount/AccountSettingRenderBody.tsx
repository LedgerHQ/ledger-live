import React, { PureComponent, memo } from "react";
import styled from "styled-components";
import get from "lodash/get";
import { compose } from "redux";
import { connect } from "react-redux";
import { TFunction } from "i18next";
import { Trans, withTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { validateNameEdition } from "@ledgerhq/live-common/account/index";
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
import Select from "~/renderer/components/Select";
import Spoiler from "~/renderer/components/Spoiler";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import Space from "~/renderer/components/Space";
import Button from "~/renderer/components/Button";
import { DerivationMode, getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
type State = {
  accountName: string | undefined | null;
  accountUnit: Unit | undefined | null;
  endpointConfig: string | undefined | null;
  accountNameError: Error | undefined | null;
  endpointConfigError: Error | undefined | null;
  isRemoveAccountModalOpen: boolean;
};
type OwnProps = {
  onClose?: () => void;
  data: unknown;
};
type Props = {
  setDataModal: Function;
  updateAccount: Function;
  removeAccount: Function;
  t: TFunction;
} & OwnProps;
const unitGetOptionValue = (unit: Unit) => unit.magnitude + "";
const renderUnitItemCode = (item: { data: Unit }) => item.data.code;
const mapDispatchToProps = {
  setDataModal,
  updateAccount,
  removeAccount,
};
const defaultState = {
  accountName: null,
  accountUnit: null,
  endpointConfig: null,
  accountNameError: null,
  endpointConfigError: null,
  isRemoveAccountModalOpen: false,
};
class AccountSettingRenderBody extends PureComponent<Props, State> {
  state = {
    ...defaultState,
  };

  getAccount(data: unknown): Account {
    const { accountName } = this.state;
    const account = get(data, "account", {});
    return {
      ...account,
      ...(accountName !== null
        ? {
            name: accountName,
          }
        : {}),
    };
  }

  handleChangeName = (value: string) =>
    this.setState({
      accountName: value,
    });

  handleSubmit =
    (account: Account, onClose: () => void) =>
    (e: React.SyntheticEvent<HTMLFormElement | HTMLInputElement>) => {
      e.preventDefault();
      const { updateAccount, setDataModal } = this.props;
      const { accountName, accountUnit, endpointConfig, endpointConfigError } = this.state;
      if (!account.name.length) {
        this.setState({
          accountNameError: new AccountNameRequiredError(),
        });
      } else if (!endpointConfigError) {
        const name = validateNameEdition(account, accountName);
        account = {
          ...account,
          unit: accountUnit || account.unit,
          name,
        };
        if (endpointConfig && !endpointConfigError) {
          account.endpointConfig = endpointConfig;
        }
        updateAccount(account);
        setDataModal("MODAL_SETTINGS_ACCOUNT", {
          account,
        });
        onClose();
      }
    };

  handleFocus = (e: React.FocusEvent<HTMLInputElement>, name: string) => {
    e.target.select();
    switch (name) {
      case "accountName":
        this.setState({
          accountNameError: null,
        });
        break;
      case "endpointConfig":
        this.setState({
          endpointConfigError: null,
        });
        break;
      default:
        break;
    }
  };

  handleChangeUnit = (value?: Unit | null) => {
    this.setState({
      accountUnit: value,
    });
  };

  handleOpenRemoveAccountModal = () =>
    this.setState({
      isRemoveAccountModalOpen: true,
    });

  handleCloseRemoveAccountModal = () =>
    this.setState({
      isRemoveAccountModalOpen: false,
    });

  handleRemoveAccount = (account: Account) => {
    const { removeAccount, onClose } = this.props;
    removeAccount(account);
    this.setState({
      isRemoveAccountModalOpen: false,
    });
    onClose?.();
  };

  render() {
    const { accountUnit, accountNameError, isRemoveAccountModalOpen } = this.state;
    const { t, onClose, data } = this.props;
    if (!data) return null;
    const account = this.getAccount(data);
    const usefulData = {
      xpub: account.xpub || undefined,
      index: account.index,
      freshAddressPath: account.freshAddressPath,
      id: account.id,
      blockHeight: account.blockHeight,
    };
    const onSubmit = onClose && this.handleSubmit(account, onClose);
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
                  value={account.name}
                  maxLength={getEnv("MAX_ACCOUNT_NAME_SIZE")}
                  onChange={this.handleChangeName}
                  onEnter={onSubmit}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                    this.handleFocus(e, "accountName")
                  }
                  error={accountNameError}
                  id="input-edit-name"
                />
              </Box>
            </Container>
            <Container>
              <Box>
                <OptionRowTitle>{t("account.settings.unit.title")}</OptionRowTitle>
                <OptionRowDesc>{t("account.settings.unit.desc")}</OptionRowDesc>
              </Box>
              <Box
                style={{
                  width: 230,
                }}
              >
                <Select
                  isSearchable={false}
                  onChange={this.handleChangeUnit}
                  getOptionValue={unitGetOptionValue}
                  renderValue={renderUnitItemCode}
                  renderOption={renderUnitItemCode}
                  value={accountUnit || account.unit}
                  options={account.currency.units}
                />
              </Box>
            </Container>
            <Spoiler textTransform title={t("account.settings.advancedLogs")}>
              {tag ? <Tips tag={tag} /> : null}
              <AdvancedLogsContainer>{JSON.stringify(usefulData, null, 2)}</AdvancedLogsContainer>
            </Spoiler>
            <ConfirmModal
              analyticsName="RemoveAccount"
              isDanger
              centered
              isOpened={isRemoveAccountModalOpen}
              onClose={this.handleCloseRemoveAccountModal}
              onReject={this.handleCloseRemoveAccountModal}
              onConfirm={() => this.handleRemoveAccount(account)}
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
              onClick={this.handleOpenRemoveAccountModal}
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
}
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
const ConnectedAccountSettingRenderBody = compose(
  connect(null, mapDispatchToProps),
  withTranslation(),
)(AccountSettingRenderBody) as React.ComponentType<OwnProps>;
export default ConnectedAccountSettingRenderBody;
export const Container = styled(Box).attrs(() => ({
  flow: 2,
  horizontal: true,
  mb: 3,
  pb: 4,
}))`
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  justify-content: space-between;
`;
export const OptionRowDesc = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 3,
  textAlign: "left",
  lineHeight: 1.69,
  color: "palette.text.shade60",
  shrink: 1,
}))``;
export const OptionRowTitle = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
  fontSize: 4,
  textAlign: "left",
  lineHeight: 1.69,
}))``;
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
