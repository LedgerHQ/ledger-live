import React from "react";
import { Currency, Operation, Account } from "@ledgerhq/types-live";
import {
  OpDetailsTitle,
  OpDetailsSection,
  OpDetailsData,
  OpDetailsVoteData,
  Address,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { Trans } from "react-i18next";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { openURL } from "~/renderer/linking";
import FormattedVal from "~/renderer/components/FormattedVal";
import { fallbackValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
const redirectAddress = (currency: Currency, address: string) => () => {
  const url = getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) openURL(url);
};
type OperationDetailsExtraProps = {
  operation: Operation;
  extra: {
    [key: string]: any;
  };
  type: string;
  account: Account;
};
const OperationDetailsExtra = ({ operation, type, account }: OperationDetailsExtraProps) => {
  const { currency } = account;
  const { validatorGroups } = useCeloPreloadData();
  switch (type) {
    case "ACTIVATE":
    case "REVOKE":
    case "VOTE": {
      const recipient = operation.recipients[0];
      const validatorGroup =
        recipient &&
        (validatorGroups.find(
          validatorGroup => validatorGroup.address.toLowerCase() === recipient.toLowerCase(),
        ) ||
          fallbackValidatorGroup(recipient));
      return (
        <>
          {type !== "ACTIVATE" && (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey={`operation.type.${type}`} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <FormattedVal
                    val={operation.extra.celoOperationValue}
                    unit={account.unit}
                    showCode
                    fontSize={4}
                    color="palette.text.shade60"
                  />
                </Box>
              </OpDetailsData>
            </OpDetailsSection>
          )}
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"celo.delegation.validatorGroup"} />
            </OpDetailsTitle>
            <Box flex="1" pl={2}>
              <OpDetailsData justifyContent="flex-start">
                <OpDetailsVoteData>
                  <Box>
                    <Text ff="Inter|SemiBold">{validatorGroup?.name}</Text>
                  </Box>
                  <Address onClick={redirectAddress(currency, validatorGroup?.address)}>
                    <SplitAddress value={validatorGroup?.address} />
                  </Address>
                </OpDetailsVoteData>
              </OpDetailsData>
            </Box>
          </OpDetailsSection>
        </>
      );
    }
    case "LOCK":
    case "UNLOCK":
      return (
        <>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={`operation.type.${type}`} />
            </OpDetailsTitle>
            <OpDetailsData>
              <Box>
                <FormattedVal
                  val={operation.extra.celoOperationValue}
                  unit={account.unit}
                  showCode
                  fontSize={4}
                  color="palette.text.shade60"
                />
              </Box>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
    default:
      return null;
  }
};
export default {
  OperationDetailsExtra,
};
