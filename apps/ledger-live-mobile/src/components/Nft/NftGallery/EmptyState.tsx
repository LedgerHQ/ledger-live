import React, { FC } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "@ledgerhq/native-ui/components/styled";
import Button from "../../Button";
import { useTranslation } from "react-i18next";

export type Props = {
  readonly onPress: () => void;
};

const EmptyState: FC<Props> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <StyledRoot testID="wallet-nft-gallery-empty" flexGrow={1} justifyContent="center">
      <Flex alignItems="center">
        <Text variant="h5" fontWeight="semiBold" marginBottom={8} textAlign="center">
          {t("wallet.nftGallery.emptyFiltered.title")}
        </Text>
        <Button testID="wallet-nft-gallery-empty-reset-button" type="primary" onPress={onPress}>
          {t("wallet.nftGallery.emptyFiltered.button")}
        </Button>
      </Flex>
    </StyledRoot>
  );
};
export default EmptyState;

const StyledRoot = styled(Flex)`
  padding-bottom: 150px;
`;
