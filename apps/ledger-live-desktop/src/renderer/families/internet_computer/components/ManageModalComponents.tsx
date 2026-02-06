import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import { CopiableField } from "./CopialbleField";
import { StyledIconInfo } from "./StyledIconInfo";

const Section = styled(Box)`
  width: 100%;
`;

const SectionHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const SectionHeaderLeft = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleRow = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 8px;
`;

const Element = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 0;
  justify-content: space-between;
`;

type ManageModalSectionProps = {
  title: string;
  titleTooltip?: string;
  description?: string;
  value?: React.ReactNode;
  children: React.ReactNode;
};

export function ManageModalSection({
  title,
  titleTooltip,
  description,
  value,
  children,
}: ManageModalSectionProps) {
  return (
    <Section>
      <SectionHeader>
        <SectionHeaderLeft>
          <TitleRow>
            <Text ff="Inter|SemiBold" fontSize={6} color="palette.text.shade100">
              {title}
            </Text>
            {titleTooltip && (
              <Tooltip content={titleTooltip}>
                <Box>
                  <StyledIconInfo size={14} />
                </Box>
              </Tooltip>
            )}
          </TitleRow>
          {description && (
            <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade60">
              {description}
            </Text>
          )}
        </SectionHeaderLeft>
        {value && (
          <Text ff="Inter|SemiBold" fontSize={6} color="palette.text.shade100">
            {value}
          </Text>
        )}
      </SectionHeader>
      <Box>{children}</Box>
    </Section>
  );
}

type ManageModalElementProps = {
  label: string;
  labelTooltip?: string;
  value?: React.ReactNode;
  copiableValue?: boolean;
  copiableLabel?: boolean;
  ellipsis?: boolean;
  valueTooltip?: string;
};

export function ManageModalElement({
  label,
  labelTooltip,
  value,
  ellipsis,
  copiableValue,
  copiableLabel,
  valueTooltip,
}: ManageModalElementProps) {
  return (
    <Element>
      <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
        <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade100">
          {copiableLabel ? (
            <CopiableField value={label}>
              <Text ff="Inter|Regular" fontSize={4}>
                {label}
              </Text>
            </CopiableField>
          ) : (
            label
          )}
        </Text>
        {labelTooltip && (
          <Tooltip content={labelTooltip}>
            <Box>
              <StyledIconInfo size={14} />
            </Box>
          </Tooltip>
        )}
      </Box>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={4} color="palette.text.shade100">
          {copiableValue ? (
            <CopiableField value={value as string}>
              <Text ff="Inter|SemiBold" fontSize={4}>
                {ellipsis
                  ? (value as string).slice(0, 10) + "..." + (value as string).slice(-10)
                  : value}
              </Text>
            </CopiableField>
          ) : (
            value
          )}
        </Text>
        {valueTooltip && (
          <Tooltip content={valueTooltip}>
            <Box>
              <StyledIconInfo size={14} />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Element>
  );
}

type ManageModalActionElementProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
};

export function ManageModalActionElement({
  label,
  onClick,
  disabled,
  hidden,
}: ManageModalActionElementProps) {
  return (
    <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
      {!hidden && (
        <Button key={label} primary onClick={onClick} disabled={disabled}>
          {label}
        </Button>
      )}
    </Box>
  );
}

type ManageModalElementWithIconProps = {
  label: string;
  labelTooltip?: string;
  value?: React.ReactNode;
  valueTooltip?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    hidden?: boolean;
    danger?: boolean;
    outline?: boolean;
  }[];
  icon?: React.ReactNode;
  copiableLabel?: boolean;
  hidden?: boolean;
};

export function ManageModalElementWithAction({
  label,
  labelTooltip,
  value,
  valueTooltip,
  copiableLabel,
  action,
  icon,
  hidden,
}: ManageModalElementWithIconProps) {
  if (hidden) {
    return null;
  }

  return (
    <Element>
      <Box style={{ flexDirection: "row", gap: 8 }}>
        {icon && (
          <Box
            height={54}
            width={54}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#131415",
              borderRadius: "4px",
            }}
          >
            {icon}
          </Box>
        )}
        <Box style={{ gap: 8 }}>
          <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
            {value && (
              <Text ff="Inter|SemiBold" fontSize={4} color="palette.text.shade100">
                {value}
              </Text>
            )}
            {valueTooltip && (
              <Tooltip content={valueTooltip}>
                <Box>
                  <StyledIconInfo size={14} />
                </Box>
              </Tooltip>
            )}
          </Box>
          <Box>
            <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
              {copiableLabel ? (
                <CopiableField value={label}>
                  <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade100">
                    {label}
                  </Text>
                </CopiableField>
              ) : (
                <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade100">
                  {label}
                </Text>
              )}
              {labelTooltip && (
                <Tooltip content={labelTooltip}>
                  <StyledIconInfo size={14} />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box style={{ flexDirection: "row", gap: 8 }}>
        {action &&
          action.map(action =>
            action.hidden ? null : (
              <Button
                key={action.label}
                primary={!action.outline}
                onClick={action.onClick}
                disabled={action.disabled}
                danger={action.danger}
                outline={action.outline}
              >
                {action.label}
              </Button>
            ),
          )}
      </Box>
    </Element>
  );
}
