import React from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { Unit } from "@ledgerhq/types-cryptoassets";
import {
  InfoContainer,
  SideInfo,
  Row as DefaultRow,
  Title as DefaultTitle,
} from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import ValidatorIcon from "./ValidatorIcon";
import styled from "styled-components";

type Props = {
  validator: HederaValidator;
  unit: Unit;
};

function ReadonlyValidatorRow({ validator, unit }: Readonly<Props>) {
  return (
    <Row disabled active={false} data-testid="modal-provider-row">
      <ValidatorIcon validatorName={validator.name} />
      <InfoContainer>
        <Title>
          <Text data-testid="modal-provider-title">{validator.name}</Text>
        </Title>
      </InfoContainer>
      <SideInfo>
        <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
          {formatCurrencyUnit(unit, new BigNumber(validator.activeStake.toString()), {
            showCode: true,
          })}
        </Text>
      </SideInfo>
    </Row>
  );
}

const Row = styled(DefaultRow)`
  flex: 0 0 46px;
  margin-top: 4px;
  margin-bottom: 0;
`;

const Title = styled(DefaultTitle)`
  pointer-events: none;
`;

export default ReadonlyValidatorRow;
