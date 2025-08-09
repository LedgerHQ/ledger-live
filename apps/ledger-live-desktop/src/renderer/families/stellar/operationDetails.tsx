import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
  HashContainer,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import { Account } from "@ledgerhq/types-live";
import { OperationDetailsExtraProps } from "../types";
import { StellarOperation } from "@ledgerhq/live-common/families/stellar/types";
import { formatMemo } from "@ledgerhq/live-common/families/stellar/ui";

const OperationDetailsExtra = ({
  operation: { extra },
}: OperationDetailsExtraProps<Account, StellarOperation>) => {
  return (
    <>
      {Object.keys(extra).map(key => {
        let details: React.JSX.Element | undefined = undefined;
        switch (key) {
          case "assetCode": {
            details = <Ellipsis>{extra[key]}</Ellipsis>;
            break;
          }
          case "assetIssuer": {
            details = (
              <HashContainer>
                <SplitAddress value={extra[key] ?? ""} />
              </HashContainer>
            );
            break;
          }
          case "memo": {
            const label = formatMemo(extra);
            if (label) details = <Ellipsis>{label}</Ellipsis>;
            break;
          }
        }

        if (details)
          return (
            <OpDetailsSection key={key}>
              <OpDetailsTitle>
                <Trans i18nKey={`families.stellar.${key}`} defaults={key} />
              </OpDetailsTitle>
              <OpDetailsData>{details}</OpDetailsData>
            </OpDetailsSection>
          );

        return null;
      })}
    </>
  );
};
export default {
  OperationDetailsExtra,
};
