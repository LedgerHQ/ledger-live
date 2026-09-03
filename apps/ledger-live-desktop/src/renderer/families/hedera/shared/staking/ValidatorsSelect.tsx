import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
// FilterOptionOption type for react-select v5 filter callback
type FilterOptionOption<T> = { label: string; value: string; data: T };
import styled from "styled-components";
import { Box } from "@ledgerhq/react-ui";
import type { HederaAccount, HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { filterValidatorBySearchTerm } from "@ledgerhq/live-common/families/hedera/utils";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import Select from "~/renderer/components/Select";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import ValidatorOption from "~/renderer/families/hedera/shared/staking/ValidatorOption";
import TranslatedError from "~/renderer/components/TranslatedError";

type Props = {
  account: HederaAccount;
  selectedValidatorId: string | null;
  error?: Error;
  warning?: Error;
  disabled?: boolean;
  showRemovedPlaceholder?: boolean;
  onChangeValidator?: (validator: HederaValidator | null) => void;
};

export default function ValidatorsSelect({
  account,
  selectedValidatorId,
  error,
  warning,
  disabled,
  showRemovedPlaceholder,
  onChangeValidator,
}: Readonly<Props>) {
  const [query, setQuery] = useState<string>();
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const queryValidators = useHederaValidators(account.currency.id);
  const options = queryValidators.validators;

  const renderItem = useCallback(
    (item: { data: HederaValidator; isDisabled: boolean }) => {
      return <ValidatorOption validator={item.data} unit={unit} />;
    },
    [unit],
  );

  const filterOptions = useCallback(
    (option: FilterOptionOption<HederaValidator>, search: string): boolean => {
      const validator = option.data;
      return filterValidatorBySearchTerm(validator, search);
    },
    [],
  );

  const value = useMemo(() => {
    return options.find(v => v.id === selectedValidatorId) ?? null;
  }, [selectedValidatorId, options]);

  const displayError = error ?? (disabled ? null : queryValidators.error);

  const getPlaceholder = () => {
    if (queryValidators.error) {
      return t("hedera.redelegation.flow.steps.validators.unableToLoadSelectPlaceholder");
    }

    if (queryValidators.loading) {
      return t("hedera.redelegation.flow.steps.validators.loadingValidatorPlaceholder");
    }

    if (showRemovedPlaceholder) {
      return t("hedera.redelegation.flow.steps.validators.removedValidatorSelectPlaceholder");
    }

    return t("hedera.redelegation.flow.steps.validators.newValidatorSelectPlaceholder");
  };

  const renderErrorMessage = () => {
    if (displayError) {
      return (
        <ErrorDisplay id="input-error">
          <TranslatedError error={displayError} />
        </ErrorDisplay>
      );
    }

    if (warning) {
      return (
        <WarningDisplay id="input-warning">
          <TranslatedError error={warning} />
        </WarningDisplay>
      );
    }

    return null;
  };

  return (
    <>
      <Select
        key={selectedValidatorId}
        value={value}
        error={displayError}
        options={options}
        getOptionValue={option => option.address}
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        filterOption={filterOptions}
        inputValue={query}
        isLoading={queryValidators.loading}
        isDisabled={disabled || options.length <= 1}
        placeholder={getPlaceholder()}
        noOptionsMessage={({ inputValue }) =>
          t("hedera.redelegation.flow.steps.validators.newValidatorSelectNoOption", {
            validatorName: inputValue,
          })
        }
        onChange={validator => {
          onChangeValidator?.(validator ?? null);
        }}
      />
      <ErrorContainer hasError={!!displayError || !!warning}>{renderErrorMessage()}</ErrorContainer>
    </>
  );
}

const ErrorContainer = styled(Box)<{
  hasError: boolean;
}>`
  margin-top: 0px;
  font-size: 12px;
  width: 100%;
  transition: all 0.4s ease-in-out;
  will-change: max-height;
  max-height: ${p => (p.hasError ? 60 : 0)}px;
  min-height: ${p => (p.hasError ? 20 : 0)}px;
`;

const ErrorDisplay = styled(Box)`
  color: ${p => p.theme.colors.pearl};
`;

const WarningDisplay = styled(Box)`
  color: ${p => p.theme.colors.warning};
`;
