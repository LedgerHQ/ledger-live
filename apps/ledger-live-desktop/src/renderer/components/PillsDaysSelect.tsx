import React, { useMemo } from "react";
import { PortfolioRangeOption, useTimeRange } from "~/renderer/actions/settings";
import Select from "~/renderer/components/Select";

type ChangeArgs = { value: PortfolioRangeOption; label: string };

const PilldDaysSelect: React.FC = () => {
  const [selected, onChange, options] = useTimeRange();

  const mappedOptions = useMemo(
    () =>
      options.map(option => ({
        label: option.label,
        value: option,
      })),
    [options],
  );

  const mappedSelected = useMemo(() => {
    const current = options.find(o => o.key === selected) ?? options[0];
    return {
      label: current.label,
      value: current,
    };
  }, [options, selected]);

  const avoidEmptyValue = (option?: ChangeArgs | null) => option && onChange(option.value);

  return (
    <Select
      isSearchable={false}
      small
      minWidth={90}
      onChange={avoidEmptyValue}
      renderSelected={(item: { label: unknown }) => item && item.label}
      value={mappedSelected}
      options={mappedOptions}
    />
  );
};

export default PilldDaysSelect;
