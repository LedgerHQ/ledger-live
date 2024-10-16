import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { Box, Flex, Icons, Tooltip, Text } from "@ledgerhq/react-ui";
import NoOrdinalsRow from "./NoOrdinalsRow";
import Checkbox from "~/renderer/components/CheckBox";
import FormattedVal from "~/renderer/components/FormattedVal";
import { space } from "@ledgerhq/react-ui/styles/theme";
import { useOrdinalRowModel, Props } from "./useOrdinalRowModel";

const Container = styled(Box)<{ disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 8px;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.palette.neutral.c20};
  background-color: ${({ theme }) => theme.colors.palette.opacityDefault.c05};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};

  &:hover {
    border-color: ${({ theme, disabled }) =>
      disabled ? theme.colors.palette.text.shade20 : theme.colors.palette.primary.main};
  }
`;

const UtxoContainer = styled(Flex)<{ isOpened?: boolean }>`
  background-color: ${({ theme, isOpened }) =>
    isOpened ? theme.colors.palette.opacityDefault.c05 : undefined};
`;

const TooltipContainer = styled(Box)`
  background-color: ${({ theme }) => theme.colors.palette.neutral.c100};
  padding: 8px;
  border-radius: 16px;
  display: flex;
  gap: 2px;
`;

type ViewProps = ReturnType<typeof useOrdinalRowModel>;

function View({
  utxo,
  account,
  unit,
  isDetailsVisible,
  disabled,
  last,
  unconfirmed,
  input,
  excluded,
  toggleDetailsVisibility,
  handleClick,
}: ViewProps) {
  const renderLeftSelection = () => {
    if (unconfirmed)
      return (
        <Tooltip
          placement="top"
          content={
            <TooltipContainer>
              <Icons.Information size="S" />
              <Trans i18nKey={"bitcoin.cannotSelect.pending"} />
            </TooltipContainer>
          }
        />
      );

    if (last)
      return (
        <Tooltip
          placement="top"
          content={
            <TooltipContainer>
              <Icons.Information size="S" />
              <Trans i18nKey={"bitcoin.cannotSelect.last"} />
            </TooltipContainer>
          }
        >
          <Checkbox isChecked disabled />
        </Tooltip>
      );

    return <Checkbox isChecked={!excluded} onChange={handleClick} />;
  };
  return (
    <Container>
      <UtxoContainer
        flexDirection="row"
        flex={1}
        width="100%"
        alignItems="center"
        columnGap={12}
        justifyContent="space-between"
        py={2}
        px={space[5]}
        borderRadius={8}
        isOpened={isDetailsVisible}
        onClick={handleClick}
      >
        <Flex flexDirection="row" flex={1} alignItems="center" width="100%" columnGap={12}>
          {renderLeftSelection()}
          <Box>
            <FormattedVal
              val={utxo.value}
              unit={unit}
              showCode
              fontSize={4}
              color="palette.text.shade100"
              ff="Inter|SemiBold"
            />
            {utxo.blockHeight ? (
              <Text ff="Inter|Medium" fontSize={3} color={"palette.text.shade50"}>
                {account.blockHeight - utxo.blockHeight + " confirmations"}
              </Text>
            ) : (
              <Text ff="Inter|Medium" fontSize={3} color={"alertRed"}>
                <Trans i18nKey="bitcoin.pending" />
              </Text>
            )}
          </Box>
          <Box
            style={{
              flexBasis: "10%",
            }}
          >
            {input && !disabled ? (
              <Text
                ff="Inter|Bold"
                fontSize={2}
                color="wallet"
                style={{
                  lineHeight: "10px",
                }}
              >
                <Trans i18nKey="bitcoin.inputSelected" />
              </Text>
            ) : null}
          </Box>
        </Flex>
        <Box
          onClickCapture={toggleDetailsVisibility}
          display="flex"
          alignItems="center"
          data-testid="chevron"
        >
          {isDetailsVisible ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </Box>
      </UtxoContainer>
      {isDetailsVisible && (
        <NoOrdinalsRow
          hash={utxo.hash}
          address={String(utxo.address)}
          outputIndex={utxo.outputIndex}
        />
      )}
    </Container>
  );
}

export const Row: React.FC<Props> = props => {
  return <View {...useOrdinalRowModel(props)} />;
};
