import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { TFunction } from "i18next";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import {
  MAX_NOMINATIONS,
  hasMinimumBondBalance,
} from "@ledgerhq/live-common/families/polkadot/logic";
import {
  usePolkadotPreloadData,
  useSortedValidators,
} from "@ledgerhq/live-common/families/polkadot/react";
import {
  PolkadotAccount,
  PolkadotNominationInfo,
  PolkadotNomination,
  PolkadotValidator,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import { PolkadotValidatorsRequired } from "@ledgerhq/live-common/families/polkadot/errors";
import { radii } from "~/renderer/styles/theme";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import ValidatorListHeader from "~/renderer/components/Delegation/ValidatorListHeader";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import Ellipsis from "~/renderer/components/Ellipsis";
import TranslatedError from "~/renderer/components/TranslatedError";
import Label from "~/renderer/components/Label";
import Alert from "~/renderer/components/Alert";

// Specific Validator Row
import ValidatorRow from "./ValidatorRow";
const DrawerWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  px: 3,
}))`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
`;
const NominationError = styled(Box).attrs<{
  isError?: boolean;
}>(p => ({
  flex: 1,
  horizontal: true,
  alignItems: "center",
  py: "8px",
  px: 3,
  fontSize: 4,
  bg: "palette.background.default",
  ff: "Inter|SemiBold",
  color: p.isError ? p.theme.colors.pearl : p.theme.colors.orange,
}))<{
  isError?: boolean;
}>`
  border-style: solid;
  border-width: 1px 1px 0 1px;
  border-color: ${p => p.theme.colors.palette.divider};
  border-top-left-radius: ${radii[1]}px;
  border-top-right-radius: ${radii[1]}px;
`;
const MaybeChillLink = styled(Label).attrs(() => ({
  ff: "Inter|Medium",
}))`
  display: inline-flex;
  margin-left: auto;
  color: ${p => p.theme.colors.wallet};
  &:hover {
    opacity: 0.9;
    cursor: pointer;
  }
`;
const SimpleList = styled.ul`
  list-style: none;
`;

// returns the first error
function getStatusError(status: TransactionStatus, type = "errors"): Error | undefined | null {
  if (!status || !status[type as keyof TransactionStatus]) return null;
  const firstKey = Object.keys(status[type as keyof TransactionStatus]!)[0];
  // @ts-expect-error This is complicated to prove that type / firstKey are the right keys
  return firstKey ? status[type][firstKey] : null;
}

type Props = {
  t: TFunction;
  validators: PolkadotNominationInfo[];
  nominations: PolkadotNomination[];
  account: PolkadotAccount;
  status: TransactionStatus;
  onChangeNominations: (updater: (a: PolkadotNominationInfo[]) => PolkadotNominationInfo[]) => void;
  bridgePending: boolean;
  onGoToChill: React.MouseEventHandler;
};
const ValidatorField = ({
  account,
  onChangeNominations,
  status,
  validators,
  nominations,
  onGoToChill,
}: Props) => {
  invariant(account, "polkadot account required");
  const [search, setSearch] = useState("");
  const { polkadotResources } = account;
  invariant(polkadotResources && nominations, "polkadot transaction required");
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet: false,
  };
  const preloaded = usePolkadotPreloadData();
  const { staking, validators: polkadotValidators } = preloaded;
  const maxNominatorRewardedPerValidator = staking?.maxNominatorRewardedPerValidator ?? 0;

  const SR = useSortedValidators(search, polkadotValidators, nominations);
  const hasMinBondBalance = hasMinimumBondBalance(account);
  const minimumBondBalance = BigNumber(preloaded.minimumBondBalance);
  const minimumBondBalanceStr = formatCurrencyUnit(unit, minimumBondBalance, formatConfig);

  // Addresses that are no longer validators
  const nonValidators = nominations
    .filter(nomination => !nomination.status)
    .map(nomination => nomination.address);
  const validatorsSelected = validators.length;
  const onUpdateNomination = useCallback(
    (address: string, isSelected: boolean) => {
      onChangeNominations(existing => {
        const update = existing.filter(v => v !== address);
        if (isSelected) {
          update.push(address);
        }
        return update;
      });
    },
    [onChangeNominations],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const explorerView = getDefaultExplorerView(account.currency);
  const onExternalLink = useCallback(
    (address: string) => {
      const srURL = explorerView && getAddressExplorer(explorerView, address);
      if (srURL) openURL(srURL);
    },
    [explorerView],
  );
  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [setSearch],
  );

  /** auto focus first input on mount */
  useEffect(() => {
    if (containerRef && containerRef.current && containerRef.current.querySelector) {
      const firstInput = containerRef.current.querySelector("input");
      if (firstInput && firstInput.focus) firstInput.focus();
    }
  }, []);
  const renderItem = useCallback(
    (validator: PolkadotValidator, i: number): React.ReactNode => {
      const isSelected = validators.indexOf(validator.address) > -1;
      const disabled = validators.length >= MAX_NOMINATIONS;
      return (
        <ValidatorRow
          key={`SR_${validator.address}_${i}`}
          validator={validator}
          unit={unit}
          isSelected={isSelected}
          onExternalLink={onExternalLink}
          onUpdateVote={onUpdateNomination}
          disabled={disabled}
          maxNominatorRewardedPerValidator={maxNominatorRewardedPerValidator}
        />
      );
    },
    [validators, unit, onExternalLink, onUpdateNomination, maxNominatorRewardedPerValidator],
  );
  if (!status) return null;
  const error = getStatusError(status, "errors");
  const warning = getStatusError(status, "warnings");
  const maybeChill = error instanceof PolkadotValidatorsRequired;
  const ignoreError = error instanceof PolkadotValidatorsRequired && !nominations.length; // Do not show error on first nominate

  return (
    <>
      {nonValidators.length || !hasMinBondBalance ? (
        <Alert type="warning" mx="12px" mb="20px">
          <SimpleList>
            {!hasMinBondBalance ? (
              <li>
                <Trans
                  i18nKey="polkadot.bondedBalanceBelowMinimum"
                  values={{
                    minimumBondBalance: minimumBondBalanceStr,
                  }}
                />
              </li>
            ) : null}
            {nonValidators.length ? (
              <li>
                <Trans
                  i18nKey="polkadot.nominate.steps.validators.notValidatorsRemoved"
                  values={{
                    count: nonValidators.length,
                  }}
                />
              </li>
            ) : null}
          </SimpleList>
        </Alert>
      ) : null}
      <ValidatorSearchInput search={search} onSearch={onSearch} />
      <ValidatorListHeader
        votesSelected={validatorsSelected}
        votesAvailable={MAX_NOMINATIONS}
        max={0}
        maxText={""}
        maxVotes={MAX_NOMINATIONS}
        totalValidators={SR.length}
        notEnoughVotes={false}
        hideVotes
      />
      <Box ref={containerRef} id="nominate-list">
        <ScrollLoadingList
          data={SR}
          style={{
            flex: "1 0 240px",
          }}
          renderItem={renderItem}
          noResultPlaceholder={SR.length <= 0 && search && <NoResultPlaceholder search={search} />}
        />
        {!ignoreError && (error || warning) && (
          <DrawerWrapper>
            <NominationError isError={!!error}>
              <Ellipsis>
                <TranslatedError error={error || warning} />
              </Ellipsis>
              {maybeChill && (
                <MaybeChillLink onClick={onGoToChill}>
                  <Trans i18nKey="polkadot.nominate.steps.validators.maybeChill" />
                </MaybeChillLink>
              )}
            </NominationError>
          </DrawerWrapper>
        )}
      </Box>
    </>
  );
};
export default ValidatorField;
