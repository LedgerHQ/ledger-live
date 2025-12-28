import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Option } from "react-select/src/filters";
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
  selectedValidatorNodeId: number | null;
  error?: Error;
  warning?: Error;
  disabled?: boolean;
  showRemovedPlaceholder?: boolean;
  onChangeValidator?: (validator: HederaValidator | null) => void;
};

export default function ValidatorsSelect({
  account,
  selectedValidatorNodeId,
  error,
  warning,
  disabled,
  showRemovedPlaceholder,
  onChangeValidator,
}: Readonly<Props>) {
  const [query, setQuery] = useState<string>();
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const options = useHederaValidators(account.currency);

  const renderItem = useCallback(
    (item: { data: HederaValidator; isDisabled: boolean }) => {
      return <ValidatorOption validator={item.data} unit={unit} />;
    },
    [unit],
  );

  const filterOptions = useCallback((option: Option, search: string): boolean => {
    const validator = option.data as HederaValidator;
    return filterValidatorBySearchTerm(validator, search);
  }, []);

  const value = useMemo(() => {
    return options.find(v => v.nodeId === selectedValidatorNodeId) ?? null;
  }, [selectedValidatorNodeId, options]);

  const renderErrorMessage = () => {
    if (error) {
      return (
        <ErrorDisplay id="input-error">
          <TranslatedError error={error} />
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
        key={selectedValidatorNodeId}
        value={value}
        error={error}
        options={options}
        getOptionValue={option => option.name}
        renderValue={renderItem}
        renderOption={renderItem}
        onInputChange={setQuery}
        filterOption={filterOptions}
        inputValue={query}
        isDisabled={disabled || options.length <= 1}
        placeholder={
          showRemovedPlaceholder
            ? t("hedera.redelegation.flow.steps.validators.removedValidatorSelectPlaceholder")
            : t("hedera.redelegation.flow.steps.validators.newValidatorSelectPlaceholder")
        }
        noOptionsMessage={({ inputValue }) =>
          t("hedera.redelegation.flow.steps.validators.newValidatorSelectNoOption", {
            validatorName: inputValue,
          })
        }
        onChange={validator => {
          onChangeValidator?.(validator ?? null);
        }}
      />
      <ErrorContainer hasError={error || warning}>{renderErrorMessage()}</ErrorContainer>
    </>
  );
}

const ErrorContainer = styled(Box)<{
  hasError: Error | undefined;
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
