import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ButtonBase from "~/renderer/components/Button";
import TextBase from "~/renderer/components/Text";

export const Container = styled.div`
  display: flex;
  flex-direction: row;
  column-gap: 0.375rem;
  align-items: center;
  color: ${p => p.theme.colors.palette.text.shade100};
  justify-content: flex-end;
`;
export const Text = styled(TextBase).attrs(() => ({
  ff: "Inter",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "1.4",
}))`
  display: inline-block;
  color: ${p => p.theme.colors.palette.secondary.main};

  &:first-letter {
    text-transform: uppercase;
  }
`;
const Button = styled(ButtonBase).attrs(() => ({
  color: "palette.primary.main",
}))`
  padding: 0;
  height: unset;
`;

export const NoValuePlaceholder = () => (
  <TextBase color="palette.text.shade40" mr={3} fontSize={4} fontWeight="600">
    {"-"}
  </TextBase>
);

const SummaryValue = ({
  value,
  handleChange,
  children,
}: {
  value?: string;
  handleChange?: (() => void) | null;
  children?: React.ReactNode;
}) => {
  const { t } = useTranslation();

  return (
    <Container>
      {children}
      {value && (
        <Text data-testid={"swap-target-account"} title={String(value ?? "")}>
          {value}
        </Text>
      )}
      {handleChange ? (
        <Button onClick={handleChange} data-testid="change-exchange-details-button">
          {t("swap2.form.changeCTA")}
        </Button>
      ) : null}
    </Container>
  );
};

export default SummaryValue;
