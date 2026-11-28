import React from "react";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui";
import { App } from "@ledgerhq/types-live";
import { isLedgerApp } from "@ledgerhq/live-common/apps/developer";
import Box from "~/renderer/components/Box";
import Ellipsis from "~/renderer/components/Ellipsis";
import IconBuilding from "~/renderer/icons/Building";

type Props = {
  app: Pick<App, "authorName">;
};

/** Who develops the app: Ledger (check icon) or a community developer (building icon). */
const AppDeveloper = ({ app }: Props) => {
  const { t } = useTranslation();
  const isLedger = isLedgerApp(app);
  const label = app.authorName?.trim() || t("manager.applist.item.communityApp");

  return (
    <Box horizontal alignItems="center" color="neutral.c70" data-testid="manager-app-developer">
      <Box noShrink>
        {isLedger ? (
          <Icons.CheckmarkCircleFill size="XS" color="primary.c80" />
        ) : (
          <IconBuilding size={16} />
        )}
      </Box>
      <Ellipsis ml={2} ff="Inter|Medium" fontSize={3} color="neutral.c70">
        {label}
      </Ellipsis>
    </Box>
  );
};

export default AppDeveloper;
