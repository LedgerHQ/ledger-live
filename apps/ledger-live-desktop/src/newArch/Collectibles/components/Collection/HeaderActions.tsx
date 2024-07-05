import Button from "~/renderer/components/Button";
import { t } from "i18next";
import React from "react";
import Box from "~/renderer/components/Box";

type Props = {
  children?: JSX.Element;
  textKey: string;
};

const HeaderActions: React.FC<Props> = ({ children, textKey }) => {
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
