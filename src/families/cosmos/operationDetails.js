// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import type {
  Account,
  OperationType,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import { useMappedExtraOperationDetails } from "@ledgerhq/live-common/lib/families/cosmos/react";
import type {
  CosmosExtraTxInfo,
  CosmosMappedDelegationInfo,
} from "@ledgerhq/live-common/lib/families/cosmos/types";
import DelegationInfo from "../../components/DelegationInfo";
import Section from "../../screens/OperationDetails/Section";

/** @TODO cosmos update this url */
const helpURL = "https://support.ledger.com/hc/en-us/articles/360013062139";

function getURLFeesInfo(op: Operation): ?string {
  return op.fee.gt(200000) ? helpURL : undefined;
}

function getURLWhatIsThis(op: Operation): ?string {
  return op.type !== "IN" && op.type !== "OUT" ? helpURL : undefined;
}

type Props = {
  extra: CosmosExtraTxInfo,
  type: OperationType,
  account: Account,
};

function OperationDetailsExtra({ extra, type, account }: Props) {
  const { t } = useTranslation();

  const mappedExtra = useMappedExtraOperationDetails({
    extra,
    account,
  });

  switch (type) {
    case "DELEGATE":
      invariant(
        mappedExtra.validators,
        "cosmos: mapped validators is required",
      );
      return (
        <OperationDetailsValidators
          account={account}
          delegations={mappedExtra.validators}
        />
      );
    case "REDELEGATE":
      return (
        <Section
          title={t("operationDetails.extra.redelegatedTo")}
          // $FlowFixMe
          value={extra.validator.address}
        />
      );
    case "UNDELEGATE":
      return (
        <Section
          title={t("operationDetails.extra.validatorAddress")}
          // $FlowFixMe
          value={extra.validator.address}
        />
      );
    case "REWARD":
    default:
      return null;
  }
}

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
};

type OperationDetailsValidatorsProps = {
  account: Account,
  delegations: CosmosMappedDelegationInfo[],
};

function OperationDetailsValidators({
  account,
  delegations,
}: OperationDetailsValidatorsProps) {
  const { t } = useTranslation();

  const redirectAddressCreator = useCallback(
    address => () => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account],
  );

  return (
    <Section
      title={t("operationDetails.extra.validators", {
        number: delegations.length,
      })}
    >
      {delegations.map(
        ({ validator: { validatorAddress, name }, formattedAmount }, i) => (
          <DelegationInfo
            key={validatorAddress + i}
            address={validatorAddress}
            name={name || validatorAddress}
            formattedAmount={formattedAmount}
            onPress={redirectAddressCreator(validatorAddress)}
          />
        ),
      )}
    </Section>
  );
}
