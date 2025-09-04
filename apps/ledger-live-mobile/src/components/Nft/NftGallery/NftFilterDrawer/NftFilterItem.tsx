// Fixed TypeScript 5.9 NFT feature compatibility - feature being deprecated
import React, { FC, ReactElement } from "react";

import { Flex, Tag, Text } from "@ledgerhq/native-ui";

import styled from "@ledgerhq/native-ui/components/styled";

import { NftSelectionCheckbox } from "../../NftSelectionCheckbox";
import CurrencyIcon from "../../../CurrencyIcon";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { TouchableOpacity, View } from "react-native";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import Switch from "../../../Switch";

export type NftFilterItemProps = {
  first?: boolean;
  last?: boolean;
  leftComponent: ReactElement;
  rightComponent: ReactElement;
  onPress: () => void;
  children?: React.ReactNode;
};

const NftFilterItem: FC<NftFilterItemProps> = ({
  onPress,
  first,
  last,
  leftComponent,
  rightComponent,
  children,
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <StyledRoot
        first={first}
        last={last}
        flexShrink={1}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <StyledLeft>{leftComponent}</StyledLeft>
        <Flex flexDirection="row" alignItems="center" flex={1}>
          <Text variant="body" numberOfLines={1}>
            {children}
          </Text>
        </Flex>
        <StyledRight>{rightComponent}</StyledRight>
      </StyledRoot>
    </TouchableOpacity>
  );
};
export default NftFilterItem;

export type NftFilterCurrencyItemProps = {
  readonly currency: CryptoCurrencyId;
  readonly isSelected: boolean;
  readonly onPress: () => void;
} & Omit<NftFilterItemProps, "leftComponent" | "rightComponent">;

export const NftFilterCurrencyItem: FC<NftFilterCurrencyItemProps> = ({
  currency,
  isSelected,
  ...rest
}) => {
  const currencyObject = getCryptoCurrencyById(currency);
  return (
    <NftFilterItem
      {...rest}
      leftComponent={<CurrencyIcon size={32} currency={currencyObject} />}
      rightComponent={<NftSelectionCheckbox isSelected={isSelected} />}
    >
      {currencyObject.name}
    </NftFilterItem>
  );
};

export type NftFilterTagItemProps = {
  readonly isSelected: boolean;
  readonly tag: string;
  readonly onPress: () => void;
} & Omit<NftFilterItemProps, "leftComponent" | "rightComponent">;

export const NftFilterTagItem: FC<NftFilterTagItemProps> = ({ isSelected, tag, ...rest }) => {
  return (
    <NftFilterItem
      {...rest}
      leftComponent={<StyledTag uppercase={false}>{tag}</StyledTag>}
      rightComponent={<Switch value={isSelected} />}
    />
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const StyledRoot = styled(Flex)<{ first?: boolean; last?: boolean }>`
  background-color: ${(props: any) =>
    props.theme.colors.opacityDefault
      .c05}; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  height: ${(props: any) =>
    props.theme.space[10]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  padding: 0 ${(props: any) => props.theme.space[4]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  border-bottom-style: solid;
  border-bottom-color: ${(props: any) =>
    props.theme.colors.opacityDefault
      .c05}; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  ${(props: any) =>
    !props.last
      ? `border-bottom-width: 1px;`
      : ""} /* eslint-disable-line @typescript-eslint/no-explicit-any */
  ${(props: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) =>
    props.first
      ? `
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    `
      : ""}
  ${(props: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) =>
    props.last
      ? `
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        `
      : ""}
`;

const StyledLeft = styled(View)`
  margin-right: ${(props: any) =>
    props.theme.space[2]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
`;

const StyledRight = styled(View)`
  margin-left: ${(props: any) =>
    props.theme.space[4]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
`;

const StyledTag = styled(Tag)`
  background-color: ${(props: any) => props.theme.colors.opacityDefault.c05};
`;
/* eslint-enable @typescript-eslint/no-explicit-any */
