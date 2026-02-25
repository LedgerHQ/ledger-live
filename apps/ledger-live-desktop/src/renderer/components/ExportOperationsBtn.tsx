import React from "react";
import { createStructuredSelector } from "reselect";
import { useTranslation } from "react-i18next";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import DownloadCloud from "~/renderer/icons/DownloadCloud";
import Label from "~/renderer/components/Label";
import Button from "~/renderer/components/Button";
import { accountsSelector } from "~/renderer/reducers/accounts";

type OwnProps = {
  primary?: boolean;
  dataTestId?: string;
};

const mapDispatchToProps = {
  openModal,
};

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = OwnProps & PropsFromRedux;

const ExportOperationsBtn = ({
  primary,
  accounts,
  dataTestId,
  openModal: openModalProp,
}: Props) => {
  const { t } = useTranslation();
  const handleOpenModal = () => openModalProp("MODAL_EXPORT_OPERATIONS", undefined);

  if (!accounts.length && !primary) return null;
  return primary ? (
    <Button
      small
      primary
      event="ExportAccountOperations"
      disabled={!accounts.length}
      onClick={handleOpenModal}
      data-testid={dataTestId}
    >
      {t("exportOperationsModal.cta")}
    </Button>
  ) : (
    <LabelWrapper onClick={handleOpenModal}>
      <Box mr={1}>
        <DownloadCloud />
      </Box>
      <span>{t("exportOperationsModal.title")}</span>
    </LabelWrapper>
  );
};

export default connector(ExportOperationsBtn);

const LabelWrapper = styled(Label)`
  &:hover {
    color: ${p => p.theme.colors.wallet};
    cursor: pointer;
  }
  color: ${p => p.theme.colors.wallet};
  font-size: 13px;
  font-family: "Inter", Arial;
  font-weight: 600;
`;
