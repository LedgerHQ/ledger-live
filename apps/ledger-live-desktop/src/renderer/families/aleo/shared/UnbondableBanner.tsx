import BigNumber from "bignumber.js";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { Unit } from "@domain/entity-currency-unit";
import Alert from "~/renderer/components/Alert";
import FormattedVal from "~/renderer/components/FormattedVal";

const TextContent = styled.div`
  display: inline-flex;
`;

type Props = {
  unit: Unit;
  bondedBalance: BigNumber;
};

const UnbondableBanner = ({ unit, bondedBalance }: Props) => (
  <Alert type="secondary" small>
    <TextContent>
      <Trans i18nKey="aleo.unbond.flow.steps.amount.unbondableBanner" />
      <FormattedVal
        style={{ width: "auto" }}
        color="neutral.c100"
        val={bondedBalance}
        unit={unit}
        prefix=" "
        disableRounding
        showCode
        alwaysShowValue
        data-testid="unbond-unbondable-banner"
      />
    </TextContent>
  </Alert>
);

export default UnbondableBanner;
