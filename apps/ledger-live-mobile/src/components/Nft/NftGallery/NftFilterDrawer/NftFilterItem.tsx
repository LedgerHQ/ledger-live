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
  readonly first?: boolean;
  readonly last?: boolean;
  readonly leftComponent: ReactElement;
  readonly rightComponent: ReactElement;
  readonly onPress: () => void;
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

const StyledRoot = styled(Flex)<{ first?: boolean; last?: boolean }>`
  background-color: ${props => props.theme.colors.opacityDefault.c05};
  height: ${props => props.theme.space[10]}px;
  padding: 0 ${props => props.theme.space[4]}px;
  border-bottom-style: solid;
  border-bottom-color: ${props => props.theme.colors.opacityDefault.c05};
  ${props => (!props.last ? `border-bottom-width: 1px;` : "")}
  ${props =>
    props.first
      ? `
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    `
      : ""}
  ${props =>
    props.last
      ? `
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        `
      : ""}
`;

const StyledLeft = styled(View)`
  margin-right: ${props => props.theme.space[2]}px;
`;

const StyledRight = styled(View)`
  margin-left: ${props => props.theme.space[4]}px;
`;

const StyledTag = styled(Tag)`
  background-color: ${props => props.theme.colors.opacityDefault.c05};
`;
