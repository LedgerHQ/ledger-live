import React from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import styled from "styled-components";
import { Flex, Icons } from "@ledgerhq/react-ui";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  InfoContainer,
  SideInfo,
  Title as DefaultTitle,
} from "~/renderer/components/Delegation/ValidatorRow";
import Text from "~/renderer/components/Text";
import ValidatorIcon from "./ValidatorIcon";

type Props = {
  validator: HederaValidator;
  unit: Unit;
};

function ValidatorOption({ validator, unit }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <ValidatorIcon validator={validator} />
      <InfoContainer>
        <Title>
          <Text data-testid="modal-provider-title">{validator.name}</Text>
        </Title>
        {validator.overstaked && (
          <Flex alignItems="center" columnGap={1} color="warning.c70">
            <Icons.Warning size="XS" style={{ width: "10px" }} />
            <Text fontSize={2}>
              {t("hedera.delegation.flow.steps.validator.rowSubtitleOverstaked")}
            </Text>
          </Flex>
        )}
      </InfoContainer>
      <SideInfo>
        <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
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
