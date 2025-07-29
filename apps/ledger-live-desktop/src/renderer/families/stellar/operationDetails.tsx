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

const OperationDetailsExtra = ({
  operation: { extra },
}: OperationDetailsExtraProps<Account, StellarOperation>) => {
  let memo = undefined;
  switch (extra.memo?.type) {
    case "MEMO_ID":
    case "MEMO_TEXT":
    case "MEMO_HASH":
    case "MEMO_RETURN":
      memo = extra.memo.value;
      break;
  }

  return (
    <>
      {Object.keys(extra).map(key => {
        if (["assetCode", "assetIssuer", "memo"].includes(key)) {
          return (
            <OpDetailsSection key={key}>
              <OpDetailsTitle>
                <Trans i18nKey={`families.stellar.${key}`} defaults={key} />
              </OpDetailsTitle>
              <OpDetailsData>
                {key === "assetIssuer" ? (
                  <HashContainer>
                    <SplitAddress value={extra[key] ?? ""} />
                  </HashContainer>
                ) : null}
                {key === "assetCode" ? <Ellipsis>{extra[key]}</Ellipsis> : null}
                {key === "memo" ? <Ellipsis>{memo}</Ellipsis> : null}
              </OpDetailsData>
            </OpDetailsSection>
          );
        }
        return null;
      })}
    </>
  );
};
export default {
  OperationDetailsExtra,
};
