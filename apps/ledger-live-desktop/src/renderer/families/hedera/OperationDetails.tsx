import React from "react";
import { Trans, useTranslation } from "react-i18next";
import type { OperationType } from "@ledgerhq/types-live";
import { isValidExtra } from "@ledgerhq/live-common/families/hedera/utils";
import type { HederaAccount, HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import { Link } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import type {
  AddressCellProps,
  OperationDetailsExtraProps,
  OperationDetailsPostAccountSectionProps,
} from "~/renderer/families/types";
import Alert from "~/renderer/components/Alert";
import { Cell } from "~/renderer/components/OperationsList/AddressCell";
import Box from "~/renderer/components/Box";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  TextEllipsis,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { cryptoAssetsHooks } from "~/config/bridge-setup";

const OperationDetailsPostAccountSection = ({
  operation,
}: OperationDetailsPostAccountSectionProps<HederaAccount, HederaOperation>) => {
  const { t } = useTranslation();

  if (operation.type !== "ASSOCIATE_TOKEN") {
    return null;
  }

  const { token } = cryptoAssetsHooks.useTokenByAddressInCurrency(
    operation.extra.associatedTokenId || "",
    "hedera",
  );

  if (!token) {
    return null;
  }

  return (
    <OpDetailsSection>
      <OpDetailsTitle>{t("hedera.operationDetails.postAccountSection")}</OpDetailsTitle>
      <OpDetailsData>
        <TextEllipsis>
          {token.contractAddress} ({token.name})
        </TextEllipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

const OperationDetailsPostAlert = ({
  account,
  operation,
}: OperationDetailsExtraProps<HederaAccount, HederaOperation>) => {
  const dispatch = useDispatch();

  if (operation.type !== "ASSOCIATE_TOKEN") {
    return null;
  }

  const extra = isValidExtra(operation.extra) ? operation.extra : null;
  const associatedTokenId = extra?.associatedTokenId;

  const { token } = cryptoAssetsHooks.useTokenByAddressInCurrency(
    associatedTokenId || "",
    "hedera",
  );

  if (!token) {
    return null;
  }

  const openReceiveModal = () => {
    const tokenAccount = account.subAccounts?.find(
      a => a.token.contractAddress === token.contractAddress,
    );

    dispatch(
      openModal(
        "MODAL_RECEIVE",
        tokenAccount ? { account: tokenAccount, parentAccount: account } : { account },
      ),
    );
  };

  return (
    <Alert
      type="primary"
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreLabel={<Trans i18nKey="hedera.operationDetails.postAlert.learnMore" />}
    >
      <Trans i18nKey="hedera.operationDetails.postAlert.text">
        <Link onClick={openReceiveModal} color="inherit" textProps={{ fontWeight: "medium" }} />
      </Trans>
    </Alert>
  );
};

const AddressCell = ({ operation }: AddressCellProps<HederaOperation>) => {
  const { token } = cryptoAssetsHooks.useTokenByAddressInCurrency(
    operation.extra.associatedTokenId || "",
    "hedera",
  );

  if (!token) {
    return <Box flex="1" />;
  }

  return (
    <Cell>
      <Box color="palette.text.shade80" ff="Inter" fontSize={3}>
        {token.contractAddress} ({token.name})
      </Box>
    </Cell>
  );
};

const addressCell = {
  ASSOCIATE_TOKEN: AddressCell,
} satisfies Partial<Record<OperationType, unknown>>;

export default {
  OperationDetailsPostAccountSection,
  OperationDetailsPostAlert,
  addressCell,
};
