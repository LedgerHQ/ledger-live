// @flow

import React, { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import styled from "styled-components";

import ValidatorRow from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Check from "~/renderer/icons/Check";
import Logo from "~/renderer/icons/Logo";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

import { constants } from "~/renderer/families/elrond/constants";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { ValidatorType } from "~/renderer/families/elrond/types";
import type { ValidatorRowProps } from "~/renderer/components/Delegation/ValidatorRow";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

type ValidatorItemType = ValidatorType & {
  onSelectValidator: (recipient: string) => void,
  disabled: boolean,
  active: boolean,
  unit: Unit,
};

const StyledValidatorRow: ThemedComponent<ValidatorRowProps> = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;
  pointer-events: ${provider => (provider.disabled ? "none" : "auto")};
  opacity: ${provider => (provider.disabled ? "0.25" : "1")};
`;

const ChosenMark: ThemedComponent<{ active: boolean }> = styled(Check).attrs(p => ({
  color: p.active ? p.theme.colors.palette.primary.main : "transparent",
  size: 14,
}))``;

const ValidatorItem = (props: ValidatorItemType) => {
  const {
    contract,
    identity,
    unit,
    totalActiveStake,
    onSelectValidator,
    serviceFee,
    active,
    disabled,
  } = props;

  const onExternalLink = useCallback(
    (address: string) => {
      openURL(
        address === constants.figment
          ? urls.ledgerValidator
          : `${constants.explorer}/providers/${address}`,
      );
    },
    [constants.figment, constants.explorer, urls.ledgerValidator],
  );

  const icon = useMemo(
    () =>
      contract === constants.figment ? (
        <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
      ) : (
        <FirstLetterIcon label={identity.name || contract} />
      ),
    [contract, constants.figment, identity.name],
  );

  const onClick = useCallback(
    recipient => {
      if (!disabled) {
        onSelectValidator(recipient.address);
      }
    },
    [disabled, onSelectValidator],
  );

  return (
    <StyledValidatorRow
      {...{ disabled, unit, icon, onClick, onExternalLink }}
      key={contract}
      validator={{ address: contract }}
      title={identity.name || contract}
      sideInfo={
        <Box style={{ flexDirection: "row" }}>
          <Box style={{ flexDirection: "column" }}>
            <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4} textAlign="right">
              {formatCurrencyUnit(unit, new BigNumber(totalActiveStake), {
                showCode: true,
              })}
            </Text>

            <Text fontSize={2} textAlign="right">
              <Trans color="palette.text.shade50" i18nKey="elrond.delegation.totalStake" />
            </Text>
          </Box>

          <Box ml={2} justifyContent="center" alignContent="center">
            <ChosenMark active={active ?? false} />
          </Box>
        </Box>
      }
      subtitle={
        <Box>
          <Text ff="Inter|Medium" fontSize={2} color="palette.text.shade50">
            <Trans i18nKey="elrond.delegation.commission" /> {`${Number(serviceFee) / 100} %`}
          </Text>
        </Box>
      }
    />
  );
};

export default ValidatorItem;
