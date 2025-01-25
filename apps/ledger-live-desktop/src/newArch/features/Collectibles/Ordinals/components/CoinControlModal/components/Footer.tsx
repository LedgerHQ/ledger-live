import React from "react";
import { Flex, Icons, Button, Link } from "@ledgerhq/react-ui";
import { BitcoinOutput } from "@ledgerhq/coin-bitcoin/lib/types";
import { useTranslation } from "react-i18next";

type Props = {
  onClickLink: () => void;
  onClose: () => void;
  returning?: BitcoinOutput; // will be used in the future
};

const Footer: React.FC<Props> = ({ onClickLink, onClose }) => {
  const { t } = useTranslation();

  return (
    <Flex justifyContent="space-between" alignItems="center" flex={1} p={10}>
      <Flex alignItems="center" columnGap={1}>
        <Link
          textProps={{
            fontSize: 4,
            color: "palette.text.shade100",
          }}
          onClick={onClickLink}
        >
          {t("ordinals.coinControl.learnMore")}
        </Link>
        <Icons.ExternalLink size="S" />
      </Flex>
      <Button borderRadius={4} variant="color" onClick={onClose}>
        {t("ordinals.coinControl.confirm")}
      </Button>
    </Flex>
  );
};

export default Footer;
