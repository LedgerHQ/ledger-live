import React from "react";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  Address,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsVoteData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import { OperationDetailsExtraProps } from "../types";
import { SuiAccount } from "@ledgerhq/live-common/families/sui/types";
import { Operation } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import BigNumber from "bignumber.js";
import { useGetExtraDetails } from "@ledgerhq/live-common/families/sui/react";
import { localeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { Divider } from "@ledgerhq/react-ui/index";

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<SuiAccount, Operation>) => {
  const unit = useAccountUnit(account);
  const extra = useGetExtraDetails(account, type, operation.hash) ?? {};
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  if (!Object.keys(extra).length) {
    return null;
  }
  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(extra.amount), formatConfig);

  if (type === "UNDELEGATE") {
    return (
      <>
        <Divider />
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"operationDetails.extra.undelegatedFrom"} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Address>{extra.name}</Address>
          </OpDetailsData>
        </OpDetailsSection>
        <Divider />
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"operationDetails.extra.undelegatedAmount"} />
          </OpDetailsTitle>
          <OpDetailsData>{formattedAmount}</OpDetailsData>
        </OpDetailsSection>
      </>
    );
  }

  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.validators"} />
      </OpDetailsTitle>

      <OpDetailsData>
        <OpDetailsVoteData>
          <Box>
            <Text>
              <Trans
                i18nKey="operationDetails.extra.votesAddress"
                values={{
                  votes: formattedAmount,
                  name: extra?.name ?? extra.address,
                }}
              >
                <Text ff="Inter|SemiBold">{""}</Text>
                {""}
                <Text ff="Inter|SemiBold">{""}</Text>
              </Trans>
            </Text>
          </Box>
        </OpDetailsVoteData>
      </OpDetailsData>
    </OpDetailsSection>
  );
};
export default {
  OperationDetailsExtra,
};
