import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import type { OperationDetailsExtraProps } from "../types";

import { CasperAccount, CasperOperation } from "@ledgerhq/live-common/families/casper/types";

const OperationDetailsExtra = ({
  operation: o,
}: OperationDetailsExtraProps<CasperAccount, CasperOperation>) => {
  return (
    <>
      {o.extra.transferId && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="families.casper.transferId" defaults="transferId" />
          </OpDetailsTitle>
          <OpDetailsData>
            <Ellipsis>{o.extra.transferId}</Ellipsis>
          </OpDetailsData>
        </OpDetailsSection>
      )}
    </>
  );
};

export default {
  OperationDetailsExtra,
};
