import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { StakingMappedDelegation } from "@ledgerhq/live-common/families/evm/staking/types";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import EvmValidatorIcon from "~/renderer/families/evm/shared/components/EvmValidatorIcon";

type Props = Readonly<{
  delegation: StakingMappedDelegation;
}>;

/**
 * Read-only display of the validator the user is undelegating from.
 * The validator is picked upstream via the "Stop staking" CTA on the delegation row,
 * so there is no search/select experience in the undelegation modal (contrary to the
 * delegation flow where the user picks a validator).
 */
export default function ValidatorField({ delegation }: Props) {
  const { t } = useTranslation();
  const { validator, validatorAddress, formattedAmount } = delegation;
  const name = validator?.name ?? validatorAddress;
  return (
    <Box mb={4}>
      <Label>{t("ethereum.evmStaking.undelegation.flow.steps.amount.fields.validator")}</Label>
      <Container horizontal alignItems="center" justifyContent="space-between" p={3}>
        <Box horizontal alignItems="center">
          <EvmValidatorIcon
            validator={
              validator ?? {
                validatorAddress,
                name: validatorAddress,
              }
            }
          />
          <Text ml={2} ff="Inter|Medium" fontSize={4} color="neutral.c100">
            {name}
          </Text>
        </Box>
        <Text ff="Inter|Regular" fontSize={4} color="neutral.c80">
          {formattedAmount}
        </Text>
      </Container>
    </Box>
  );
}

const Container = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;
