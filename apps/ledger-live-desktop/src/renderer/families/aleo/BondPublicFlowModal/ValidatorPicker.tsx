import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import BigSpinner from "~/renderer/components/BigSpinner";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
import AleoValidatorRow, { isDisabled } from "./ValidatorRow";

const LIST_HEIGHT = 256;

type Props = {
  currency: CryptoCurrency;
  selected: string;
  lockedTo: string | null;
  onSelect: (address: string) => void;
  onRetry: () => void;
};

export default function ValidatorPicker({
  currency,
  selected,
  lockedTo,
  onSelect,
  onRetry,
}: Props) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const { validators, loading, error } = useAleoValidators(currency);

  useEffect(() => {
    if (lockedTo) return;

    const current = validators.find(({ address }) => address === selected);
    if (!current || !isDisabled(current)) return;

    const replacement = validators.find(validator => !isDisabled(validator));
    if (replacement) onSelect(replacement.address);
  }, [validators, selected, lockedTo, onSelect]);

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matched = needle
      ? validators.filter(
          ({ address, name }) =>
            address.includes(needle) || (name?.toLowerCase() ?? "").includes(needle),
        )
      : validators;

    return [...matched].sort((left, right) => Number(isDisabled(left)) - Number(isDisabled(right)));
  }, [search, validators]);

  const renderItem = useCallback(
    (validator: AleoValidator) => (
      <AleoValidatorRow
        key={validator.address}
        validator={validator}
        currency={currency}
        selected={selected === validator.address}
        locked={false}
        onSelect={onSelect}
      />
    ),
    [currency, selected, onSelect],
  );

  if (lockedTo) {
    const bonded = validators.find(({ address }) => address === lockedTo);
    return (
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="bonded-validator">
          {bonded ? (
            <AleoValidatorRow
              validator={bonded}
              currency={currency}
              selected
              locked
              onSelect={onSelect}
            />
          ) : (
            <Box p={2}>
              <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c100">
                {shortAddressPreview(lockedTo)}
              </Text>
            </Box>
          )}
        </Box>
      </ValidatorsFieldContainer>
    );
  }

  // An error with a stale list still shows the list; only an empty one is a failure.
  if (error && validators.length === 0) {
    return (
      <Box flow={3} alignItems="flex-start" data-testid="validator-fetch-error">
        <Alert type="warning">
          <Trans i18nKey="aleo.bond.flow.steps.validator.fetchError" />
        </Alert>
        <Button primary onClick={onRetry}>
          <Trans i18nKey="common.retry" />
        </Button>
      </Box>
    );
  }

  if (loading && validators.length === 0) {
    return (
      <ValidatorsFieldContainer>
        <Box
          p={1}
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: LIST_HEIGHT }}
          data-testid="validator-list-loading"
        >
          <BigSpinner size={35} />
        </Box>
      </ValidatorsFieldContainer>
    );
  }

  const shown = showAll
    ? matches
    : [matches.find(({ address }) => address === selected) ?? matches[0]].filter(Boolean);

  const noResults = matches.length === 0 && search.length > 0;
  const expanded = showAll || noResults;

  return (
    <>
      <ValidatorSearchInput
        noMargin
        search={search}
        onSearch={evt => setSearch(evt.target.value)}
      />
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          <ScrollLoadingList
            data={shown}
            style={{
              flex: expanded ? `1 0 ${LIST_HEIGHT}px` : "1 0 64px",
              marginBottom: 0,
              paddingLeft: 0,
              paddingRight: expanded ? 4 : 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={noResults && <NoResultPlaceholder search={search} />}
          />
        </Box>
        {!noResults && (
          <SeeAllButton expanded={showAll} onClick={() => setShowAll(all => !all)}>
            <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
              <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
            </Text>
            <IconAngleDown size={16} />
          </SeeAllButton>
        )}
      </ValidatorsFieldContainer>
    </>
  );
}

const ValidatorsFieldContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

const SeeAllButton = styled.div<{ expanded: boolean }>`
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.neutral.c40};
  height: 40px;
  cursor: pointer;

  &:hover ${Text} {
    text-decoration: underline;
  }

  > :nth-child(2) {
    margin-left: 8px;
    transform: rotate(${p => (p.expanded ? "180deg" : "0deg")});
  }
`;
