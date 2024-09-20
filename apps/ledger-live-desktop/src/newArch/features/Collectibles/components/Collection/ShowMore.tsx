import React from "react";
import { TokenShowMoreIndicator, IconAngleDown } from "~/renderer/screens/account/TokensList";
import { Text } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import AngleDown from "~/renderer/icons/AngleDown";
import { useTranslation } from "react-i18next";

type Props = {
  onShowMore: () => void;
  isInscriptions?: boolean;
};

const ShowMore: React.FC<Props> = ({ isInscriptions = false, onShowMore }) => {
  const { t } = useTranslation();
  return (
    <TokenShowMoreIndicator expanded onClick={onShowMore}>
      <Box horizontal alignContent="center" justifyContent="center" py={3}>
        <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
          {isInscriptions ? t("ordinals.inscriptions.seeMore") : t("NFT.collections.seeMore")}
        </Text>
        <IconAngleDown>
          <AngleDown size={16} />
        </IconAngleDown>
      </Box>
    </TokenShowMoreIndicator>
  );
};

export default ShowMore;
