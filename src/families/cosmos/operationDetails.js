// @flow
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
import { urls } from "../../config/urls";

function getURLFeesInfo(op: Operation): ?string {
  return op.fee.gt(200000) ? urls.cosmosStakingRewards : undefined;
}

function getURLWhatIsThis(op: Operation): ?string {
  return op.type !== "IN" && op.type !== "OUT"
    ? urls.cosmosStakingRewards
    : undefined;
}

type Props = {
  extra: CosmosExtraTxInfo,
  type: OperationType,
  account: Account,
};

function OperationDetailsExtra({ extra, type, account }: Props) {
  const mappedExtra = useMappedExtraOperationDetails({
    extra,
    account,
  });

  switch (type) {
    case "DELEGATE":
    case "REDELEGATE":
    case "UNDELEGATE":
      if (!mappedExtra.validators) {
        return null;
      }
      return (
        <OperationDetailsValidators
          account={account}
          delegations={mappedExtra.validators}
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
      {delegations.map(({ address, validator, formattedAmount }, i) => (
        <DelegationInfo
          key={address + i}
          address={address}
          name={validator?.name ?? address}
          formattedAmount={formattedAmount}
          onPress={redirectAddressCreator(address)}
        />
      ))}
    </Section>
  );
}
