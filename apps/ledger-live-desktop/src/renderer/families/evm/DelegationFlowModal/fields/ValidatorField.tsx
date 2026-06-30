import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import type { TransactionStatusCommon } from "@ledgerhq/types-live";
import type {
  StakingAccount,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { useEvmStakingValidators } from "@ledgerhq/live-common/families/evm/staking/react";
import Box from "~/renderer/components/Box";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import Spinner from "~/renderer/components/Spinner";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import IconAngleDown from "~/renderer/icons/AngleDown";
import EvmFamilyValidatorRow from "~/renderer/families/evm/shared/components/EvmFamilyValidatorRow";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = Readonly<{
  account: StakingAccount;
  status: TransactionStatusCommon;
  onChangeValidator: (address: string, valId?: string) => void;
  chosenVoteAccAddr: string;
}>;

const ValidatorField = ({ account, onChangeValidator, chosenVoteAccAddr, status }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const unit = useAccountUnit(account);
  const currencyId = account.currency.id;

  const { validators, loading, error } = useEvmStakingValidators(currencyId, search);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [],
  );

  const onChange = useCallback(
    ({ address }: { address: string }) =>
      onChangeValidator(address, validators.find(v => v.validatorAddress === address)?.validatorId),
    [onChangeValidator, validators],
  );

  const chosenValidator = useMemo(() => {
    if (validators.length === 0) return [];
    return [validators.find(v => v.validatorAddress === chosenVoteAccAddr) ?? validators[0]];
  }, [validators, chosenVoteAccAddr]);

  // Auto-select the first validator so the user can continue without an explicit click.
  // Must run in an effect: updating parent transaction during render breaks React rules
  // (StrictMode warnings, possible flicker / inconsistent state).
  useEffect(() => {
    if (chosenVoteAccAddr !== "" || validators.length === 0 || loading) return;
    onChangeValidator(validators[0].validatorAddress, validators[0].validatorId);
  }, [chosenVoteAccAddr, onChangeValidator, validators, loading]);

  const valAddressError = status.errors.valAddress;

  const renderItem = (validator: StakingValidatorItem) => (
    <EvmFamilyValidatorRow
      key={validator.validatorAddress}
      currency={account.currency}
      validator={validator}
      unit={unit}
      active={chosenVoteAccAddr === validator.validatorAddress}
      onClick={onChange}
    />
  );

  return (
    <>
      {error && <ErrorBanner error={error} />}
      {showAll && !error && (
        <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />
      )}
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          {loading ? (
            <Box p={4} alignItems="center" justifyContent="center">
              <Spinner size={24} />
            </Box>
          ) : (
            <ScrollLoadingList
              data={showAll ? validators : chosenValidator}
              style={{
                flex: showAll ? "1 0 256px" : "1 0 64px",
                marginBottom: 0,
                paddingLeft: 0,
              }}
              renderItem={renderItem}
              noResultPlaceholder={
                error ? null : (
                  <Box p={4} alignItems="center">
                    <Text ff="Inter|SemiBold" color="neutral.c70" fontSize={3}>
                      <Trans i18nKey="ethereum.evmStaking.delegation.flow.steps.validator.noResults" />
                    </Text>
                  </Box>
                )
              }
            />
          )}
        </Box>
        <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>
          <IconAngleDown size={16} />
        </SeeAllButton>
      </ValidatorsFieldContainer>
      {valAddressError && (
        <Box mt={2}>
          <Text color="alertRed" fontSize={3}>
            {valAddressError.message}
          </Text>
        </Box>
      )}
    </>
  );
};

const ValidatorsFieldContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

const SeeAllButton = styled.div<{
  expanded: boolean;
}>`
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

export default ValidatorField;
