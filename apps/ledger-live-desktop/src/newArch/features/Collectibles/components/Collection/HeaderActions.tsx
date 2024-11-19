import React from "react";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import { useTranslation } from "react-i18next";

type Props = {
  children?: JSX.Element;
  textKey: string;
};

const HeaderActions: React.FC<Props> = ({ children, textKey }) => {
  const { t } = useTranslation();
  return (
    <Button primary borderRadius={6} icon>
      <Box horizontal alignItems="center" flow={1} display={"flex"}>
        {children}
        <Box>{t(textKey)}</Box>
      </Box>
    </Button>
  );
};

export default HeaderActions;
