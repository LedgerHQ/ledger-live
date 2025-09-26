import React, { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { OperationType } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/live-common/bridge/crypto-assets/index";
import { isValidExtra } from "@ledgerhq/live-common/families/hedera/logic";
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

const OperationDetailsPostAccountSection = ({
  operation,
}: OperationDetailsPostAccountSectionProps<HederaAccount, HederaOperation>) => {
  const { t } = useTranslation();
  const [token, setToken] = useState<TokenCurrency | null>(null);

  useEffect(() => {
    if (operation.type !== "ASSOCIATE_TOKEN" || !operation.extra.associatedTokenId) {
      setToken(null);
      return;
    }

    async function loadToken() {
      try {
        const foundToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
          operation.extra.associatedTokenId!,
          "hedera",
        );
        setToken(foundToken || null);
      } catch (error) {
        console.error("Failed to load token:", error);
        setToken(null);
      }
    }
    loadToken();
  }, [operation.type, operation.extra.associatedTokenId]);

  if (operation.type !== "ASSOCIATE_TOKEN" || !token) {
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
  const [token, setToken] = useState<TokenCurrency | null>(null);

  useEffect(() => {
    if (operation.type !== "ASSOCIATE_TOKEN") {
      setToken(null);
      return;
    }

    const extra = isValidExtra(operation.extra) ? operation.extra : null;
    const associatedTokenId = extra?.associatedTokenId;

    if (!associatedTokenId) {
      setToken(null);
      return;
    }

    async function loadToken() {
      try {
        const foundToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
          associatedTokenId!,
          "hedera",
        );
        setToken(foundToken || null);
      } catch (error) {
        console.error("Failed to load token:", error);
        setToken(null);
      }
    }
    loadToken();
  }, [operation.type, operation.extra]);

  if (operation.type !== "ASSOCIATE_TOKEN" || !token) {
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
  const [token, setToken] = useState<TokenCurrency | null>(null);

  useEffect(() => {
    if (!operation.extra.associatedTokenId) {
      setToken(null);
      return;
    }

    async function loadToken() {
      try {
        const foundToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
          operation.extra.associatedTokenId!,
          "hedera",
        );
        setToken(foundToken || null);
      } catch (error) {
        console.error("Failed to load token:", error);
        setToken(null);
      }
    }
    loadToken();
  }, [operation.extra.associatedTokenId]);

  if (!token) {
    return null;
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
