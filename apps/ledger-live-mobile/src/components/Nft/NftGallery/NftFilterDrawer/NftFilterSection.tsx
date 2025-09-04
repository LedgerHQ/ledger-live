// Fixed TypeScript 5.9 NFT feature compatibility - feature being deprecated
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";

import Link from "../../../wrappedUi/Link";
import styled from "@ledgerhq/native-ui/components/styled";
import { View } from "react-native";
import { NftFilterItemProps } from "./NftFilterItem";

type Props = {
  title: string;
  footer?: string;
  onSeeAllPress?: () => void;
  children?: React.ReactNode;
};

const NftFilterSection: FC<Props> = ({ title, onSeeAllPress, footer, children }) => {
  const childrenArray = React.Children.toArray(children);
  const { t } = useTranslation();
  return (
    <StyledRoot>
      <StyledHeader flexDirection="row" justifyContent="space-between">
        <Flex flex={1}>
          <Text variant="h5" numberOfLines={1} fontWeight="semiBold">
            {title}
          </Text>
        </Flex>
        {onSeeAllPress ? (
          <StyledLink type="color" Icon={IconsLegacy.ChevronRightMedium} onPress={onSeeAllPress}>
            {t("wallet.nftGallery.filters.seeAll")}
          </StyledLink>
        ) : null}
      </StyledHeader>
      {childrenArray.length ? (
        <StyledItems>
          {childrenArray.map((child, i) =>
            React.cloneElement(child as React.ReactElement<NftFilterItemProps>, {
              first: i === 0,
              last: i === childrenArray.length - 1,
            }),
          )}
        </StyledItems>
      ) : null}
      {footer ? (
        <StyledFooter variant="paragraph" color="opacityDefault.c60">
          {footer}
        </StyledFooter>
      ) : null}
    </StyledRoot>
  );
};

export default NftFilterSection;

/* eslint-disable @typescript-eslint/no-explicit-any */
const StyledRoot = styled(View)`
  margin-bottom: ${(props: any) =>
    props.theme.space[4]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
`;

const StyledHeader = styled(Flex)`
  margin-bottom: ${(props: any) =>
    props.theme.space[6]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
`;

const StyledLink = styled(Link)`
  margin-left: ${(props: any) =>
    props.theme.space[4]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
`;

const StyledItems = styled(View)`
  margin-bottom: ${(props: any) =>
    props.theme.space[6]}px; /* eslint-disable-line @typescript-eslint/no-explicit-any */
`;

const StyledFooter = styled(Text)`
  margin-bottom: ${(props: any) => props.theme.space[6]}px;
`;
/* eslint-enable @typescript-eslint/no-explicit-any */
