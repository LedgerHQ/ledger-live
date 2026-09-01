import { BigNumber } from "bignumber.js";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { Flex, Icons } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import ValidatorRow, {
  IconContainer,
  InfoContainer,
  SideInfo,
} from "~/renderer/components/Delegation/ValidatorRow";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import Check from "~/renderer/icons/Check";
import { openURL } from "~/renderer/linking";

/**
 * Closed to new stake, or paying nothing: still listed and still linkable to the
 * explorer, but sunk below anything better and not selectable.
 */
export const isDisabled = (validator: AleoValidator) =>
  !validator.isOpen ||
  validator.nonEarningReason === "belowCommitteeMinimum" ||
  validator.nonEarningReason === "overConcentrated";

type Props = {
  validator: AleoValidator;
  currency: CryptoCurrency;
  selected: boolean;
  locked: boolean;
  onSelect: (address: string) => void;
};

export default function AleoValidatorRow({
  validator,
  currency,
  selected,
  locked,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const { address, name, nonEarningReason, isOpen, commissionPercent } = validator;
  const unit = currency.units[0];
  const rate = validator.estimatedYearlyRewardsRate;
  const label = name || shortAddressPreview(address);

  const onExternalLink = useCallback(() => {
    const explorerView = getDefaultExplorerView(currency);
    const url = explorerView && getAddressExplorer(explorerView, address);
    if (url) openURL(url);
  }, [currency, address]);

  // A locked row is the already-bonded validator: the only possible target, so it offers
  // no hover affordance either. It stays at full opacity though — unlike a row that is
  // listed but unpickable, it is not being passed over.
  const pickable = !locked && !isDisabled(validator);

  return (
    <RowWrapper
      dimmed={!locked && !pickable}
      data-testid={selected ? "selected-validator" : undefined}
    >
      <StyledValidatorRow
        disabled={!pickable}
        validator={{ address }}
        icon={
          <IconContainer isSR>
            <FirstLetterIcon label={label} />
          </IconContainer>
        }
        title={label}
        subtitle={
          <Text ff="Inter|Medium" fontSize={2} color="neutral.c70">
            {!isOpen ? (
              <Warning label={t("aleo.bond.flow.steps.validator.rowSubtitleClosed")} />
            ) : nonEarningReason ? (
              <ToolTip content={t(`aleo.bond.flow.steps.validator.nonEarning.${nonEarningReason}`)}>
                <Warning label={t("aleo.bond.flow.steps.validator.rowSubtitleEarnsNothing")} />
              </ToolTip>
            ) : (
              <Text fontSize={2}>
                {rate === undefined
                  ? t("aleo.bond.flow.steps.validator.commissionOnly", {
                      commission: commissionPercent,
                    })
                  : t("aleo.bond.flow.steps.validator.rateAndCommission", {
                      rate: (rate * 100).toFixed(1),
                      commission: commissionPercent,
                    })}
              </Text>
            )}
          </Text>
        }
        unit={unit}
        onExternalLink={onExternalLink}
        onClick={pickable ? () => onSelect(address) : undefined}
        sideInfo={
          <Flex flexDirection="row">
            <Flex flexDirection="column" alignItems="flex-end">
              <Text ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
                {formatCurrencyUnit(unit, new BigNumber(validator.stakeMicrocredits), {
                  showCode: true,
                })}
              </Text>
              <Text fontSize={2} color="neutral.c70" textAlign="right">
                <Trans i18nKey="aleo.bond.flow.steps.validator.totalStake" />
              </Text>
            </Flex>
            {locked ? null : (
              <Box ml={2} justifyContent="center">
                <ChosenMark active={selected} />
              </Box>
            )}
          </Flex>
        }
      />
    </RowWrapper>
  );
}

const Warning = ({ label }: { label: string }) => (
  <Flex alignItems="center" columnGap={1} color="warning.c70">
    <Icons.Warning size="XS" style={{ width: "10px" }} />
    <Text fontSize={2}>{label}</Text>
  </Flex>
);

const StyledValidatorRow = styled(ValidatorRow)`
  border-color: transparent;
  margin-bottom: 0;

  /* The shared row always hands its own handler down to the underlying div, so an absent
     onSelect alone still leaves the hover affordance behind. Killing it off the forwarded
     [disabled] attribute is what actually makes the row read as unpickable. */
  &[disabled] {
    cursor: default;
  }
  &[disabled]:hover {
    border-color: transparent;
  }

  /* min-width: 0 is what actually lets a flex child ellipsise instead of forcing
     its parent wider. */
  ${InfoContainer} {
    flex: 1 1 80%;
    min-width: 0;
  }
  ${SideInfo} {
    flex: 0 1 auto;
    min-width: 0;
  }
`;

const ChosenMark = styled(Check).attrs<{ active?: boolean }>(p => ({
  color: p.active ? p.theme.colors.primary.c80 : "transparent",
  size: 14,
}))<{ active?: boolean }>``;

const RowWrapper = styled.div<{ dimmed: boolean }>`
  opacity: ${p => (p.dimmed ? 0.5 : 1)};
`;
