import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { fallbackValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import Text from "~/renderer/components/Text";
import {
  Address,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsVoteData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { openURL } from "~/renderer/linking";
import { OperationDetailsExtraProps } from "../types";

const redirectAddress = (currency: CryptoCurrency, address: string) => () => {
  const url = getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) openURL(url);
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<CeloAccount>) => {
  const { currency } = account;
  const { validatorGroups } = useCeloPreloadData();
  switch (type) {
    case "ACTIVATE":
    case "REVOKE":
    case "VOTE": {
      const recipient = operation.recipients[0];
      const validatorGroup = recipient
        ? validatorGroups.find(
            validatorGroup => validatorGroup.address.toLowerCase() === recipient.toLowerCase(),
          ) || fallbackValidatorGroup(recipient)
        : null;
      return (
        <>
          {type !== "ACTIVATE" && operation.extra && operation.extra.celoOperationValue && (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey={`operation.type.${type}`} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <FormattedVal
                    val={operation.extra.celoOperationValue.toFixed()}
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
            {validatorGroup ? (
              <Box flex="1" pl={2}>
                <OpDetailsData justifyContent="flex-start">
                  <OpDetailsVoteData>
                    <Box>
                      <Text ff="Inter|SemiBold">{validatorGroup.name}</Text>
                    </Box>
                    <Address onClick={redirectAddress(currency, validatorGroup.address)}>
                      <SplitAddress value={validatorGroup.address} />
                    </Address>
                  </OpDetailsVoteData>
                </OpDetailsData>
              </Box>
            ) : null}
          </OpDetailsSection>
        </>
      );
    }
    case "LOCK":
    case "UNLOCK":
      return (
        <>
          {operation.extra && operation.extra.celoOperationValue && (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey={`operation.type.${type}`} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <FormattedVal
                    val={operation.extra.celoOperationValue.toFixed()}
                    unit={account.unit}
                    showCode
                    fontSize={4}
                    color="palette.text.shade60"
                  />
                </Box>
              </OpDetailsData>
            </OpDetailsSection>
          )}
        </>
      );
    default:
      return null;
  }
};
export default {
  OperationDetailsExtra,
};
