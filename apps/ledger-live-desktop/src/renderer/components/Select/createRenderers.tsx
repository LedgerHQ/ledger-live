import React from "react";
import styled from "styled-components";
import {
  components,
  OptionProps,
  PlaceholderProps,
  DropdownIndicatorProps,
  ClearIndicatorProps,
  InputProps,
} from "react-select";
import Box from "~/renderer/components/Box";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import IconCheck from "~/renderer/icons/Check";
import IconAngleDown from "~/renderer/icons/AngleDown";
import IconCross from "~/renderer/icons/Cross";
import { useTranslation } from "react-i18next";
import SearchIcon from "~/renderer/icons/Search";
import { rgba } from "~/renderer/styles/helpers";

const InputWrapper = styled(Box)`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;

  & input {
    color: ${p => p.theme.colors.neutral.c80} !important;
    caret-color: ${p => p.theme.colors.neutral.c80} !important;
    opacity: 1 !important;
    visibility: visible !important;
    background: transparent !important;
  }
  & input::placeholder {
    color: ${p => p.theme.colors.neutral.c40};
  }

  /* react-select v5 specific selectors */
  & > div {
    color: ${p => p.theme.colors.neutral.c80} !important;
  }
`;

const HiddenInputWrapper = styled.div`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({
  renderOption,
  renderValue,
  selectProps,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderOption?: (a: any) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderValue?: (a: any) => React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectProps: any;
}) => ({
  ...STYLES_OVERRIDE,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Option: function Option(props: OptionProps<any, any>) {
    const { data, isSelected, isDisabled } = props;
    const { disabledTooltipText } = selectProps;
    return (
      <components.Option {...props}>
        <Box horizontal pr={4} relative>
          <Box
            grow
            style={{
              flex: 1,
            }}
          >
            {renderOption ? renderOption(props) : data?.label}
          </Box>
          {isSelected && (
            <InformativeContainer color="primary.c80">
              <IconCheck size={12} />
            </InformativeContainer>
          )}
          {isDisabled && disabledTooltipText && (
            <InformativeContainer disabled>
              <LabelInfoTooltip text={disabledTooltipText ?? ""} />
            </InformativeContainer>
          )}
        </Box>
      </components.Option>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SingleValue: function SingleValue(props: any) {
    const { data, selectProps } = props;
    const { isSearchable, menuIsOpen } = selectProps;
    return menuIsOpen && isSearchable ? null : (
      <components.SingleValue {...props}>
        {renderValue ? renderValue(props) : data?.label}
      </components.SingleValue>
    );
  },
});
const STYLES_OVERRIDE = {
  DropdownIndicator: function DropdownIndicator(
    props: DropdownIndicatorProps<{ label: string; value: string }, false>,
  ) {
    return (
      <components.DropdownIndicator {...props}>
        <IconAngleDown size={20} color={props.isDisabled ? "transparent" : "currentcolor"} />
      </components.DropdownIndicator>
    );
  },
  ClearIndicator: function ClearIndicator(
    props: ClearIndicatorProps<{ label: string; value: string }, false>,
  ) {
    return (
      <components.ClearIndicator {...props}>
        <IconCross size={16} />
      </components.ClearIndicator>
    );
  },
  Placeholder: function Placeholder(
    props: PlaceholderProps<{ label: string; value: string }, false>,
  ) {
    const { selectProps } = props;
    const { isSearchable, menuIsOpen } = selectProps;
    return menuIsOpen && isSearchable ? null : <components.Placeholder {...props} />;
  },
  Input: function Input(props: InputProps<{ label: string; value: string }, false>) {
    const { t } = useTranslation();
    const { selectProps } = props;
    const { isSearchable, menuIsOpen } = selectProps;
    return menuIsOpen && isSearchable ? (
      <InputWrapper color={"neutral.c60"} horizontal pr={3}>
        <SearchIcon size={16} />
        <components.Input {...props} placeholder={t("common.searchWithoutEllipsis")} />
      </InputWrapper>
    ) : (
      <HiddenInputWrapper>
        <components.Input {...props} />
      </HiddenInputWrapper>
    );
  },
};
const InformativeContainer = styled(Box).attrs(() => ({
  alignItems: "center",
  justifyContent: "center",
}))<{ disabled?: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 10px;
  color: ${p => (p.disabled ? rgba(p.theme.colors.neutral.c100, 0.5) : null)};
`;
