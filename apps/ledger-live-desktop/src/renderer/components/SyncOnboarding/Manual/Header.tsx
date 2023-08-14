import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Flex } from "@ledgerhq/react-ui";
import ExitIcon from "~/renderer/icons/ExitIcon";
import { track } from "~/renderer/analytics/segment";

export type Props = {
  onClose: () => void;
};

const Header = ({ onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <Flex justifyContent="flex-end" position="absolute" right={0}>
      <Link
        m={12}
        size="large"
        type="shade"
        Icon={ExitIcon}
        onClick={() => {
          track("button_clicked", { button: "Exit setup" });
          onClose();
        }}
        iconPosition="left"
      >
        {t("syncOnboarding.exitCTA")}
      </Link>
    </Flex>
  );
};

export default Header;
