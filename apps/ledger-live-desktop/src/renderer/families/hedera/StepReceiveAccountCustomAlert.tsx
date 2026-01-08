import React from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import styled from "styled-components";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  isTokenAssociationRequired,
  isAutoTokenAssociationEnabled,
} from "@ledgerhq/live-common/families/hedera/utils";
import { isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import { Link } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/reducers/modals";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import type { StepProps as ReceiveStepProps } from "~/renderer/modals/Receive/Body";
import TranslatedError from "~/renderer/components/TranslatedError";
import type { StepProps as ReceiveWithAssociationStepProps } from "./ReceiveWithAssociationModal/types";

type Props = (ReceiveStepProps | ReceiveWithAssociationStepProps) & {
  account: AccountLike;
};

const Container = styled.div`
  margin-top: 16px;
`;

const ErrorBox = styled(Box)`
  margin-bottom: 16px;
  color: ${p => p.theme.colors.pearl};
`;

const AssociationPrerequisiteAlert = ({ account, closeModal }: Props) => {
  const dispatch = useDispatch();

  const triggerAssociate = () => {
    closeModal();
    dispatch(
      openModal("MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION", { account, receiveTokenMode: true }),
    );
  };

  return (
    <Container>
      <Alert
        type="primary"
        learnMoreUrl={urls.hedera.tokenAssociation}
        learnMoreLabel={
          <Trans i18nKey="hedera.receive.warnings.associationPrerequisite.learnMore" />
        }
      >
        <Trans i18nKey="hedera.receive.warnings.associationPrerequisite.text">
          <Link onClick={triggerAssociate} color="inherit" textProps={{ fontWeight: "medium" }} />
        </Trans>
      </Alert>
    </Container>
  );
};

const AssociationInsufficientFundsError = (props: Readonly<Props>) => {
  const isReceiveWithAssociationModal = "transaction" in props;

  if (!isReceiveWithAssociationModal) {
    return null;
  }

  const { insufficientAssociateBalance } = props.status.errors;

  if (!insufficientAssociateBalance) {
    return null;
  }

  return (
    <ErrorBox>
      <Text fontSize={12} fontWeight="medium">
        <TranslatedError error={insufficientAssociateBalance} field="description" noLink />
      </Text>
    </ErrorBox>
  );
};

const AssociationRequiredAlert = () => {
  return (
    <Alert
      type="warning"
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreLabel={<Trans i18nKey="hedera.receive.warnings.associationRequired.learnMore" />}
    >
      <Trans i18nKey="hedera.receive.warnings.associationRequired.text" />
    </Alert>
  );
};

const StepReceiveAccountCustomAlert = (props: Props) => {
  const { account, token, receiveTokenMode } = props;
  const isAssociationFlow = receiveTokenMode ? isTokenAssociationRequired(account, token) : false;

  if (!receiveTokenMode && !isTokenAccount(account) && !isAutoTokenAssociationEnabled(account)) {
    return <AssociationPrerequisiteAlert {...props} />;
  }

  if (token && isAssociationFlow) {
    return (
      <Container>
        <AssociationInsufficientFundsError {...props} />
        <AssociationRequiredAlert />
      </Container>
    );
  }

  return null;
};

export default StepReceiveAccountCustomAlert;
