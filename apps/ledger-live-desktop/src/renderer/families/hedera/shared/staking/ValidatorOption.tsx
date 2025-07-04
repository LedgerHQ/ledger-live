import React from "react";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { Unit } from "@ledgerhq/types-cryptoassets";
import {
  InfoContainer,
  SideInfo,
  Title as DefaultTitle,
} from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import ValidatorIcon from "./ValidatorIcon";
import { Flex } from "@ledgerhq/react-ui/index";

type Props = {
  validator: HederaValidator;
  unit: Unit;
};

function ValidatorOption({ validator, unit }: Props) {
  return (
    <Flex alignItems="center">
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
    </Flex>
  );
}

const Title = styled(DefaultTitle)`
  pointer-events: none;
`;

export default ValidatorOption;
