import React from "react";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { isAccount } from "@ledgerhq/live-common/account/index";
import { getLLDCoinFamily } from "~/renderer/families";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";
import { useTranslation } from "react-i18next";

export const ExplorerLink = ({ account, url, currencyName, operation }: { account: AccountLike, url: string | null | undefined, currencyName: string | undefined, operation: Operation }) => {
  if (url) {
    if (account && isAccount(account)) {
      console.log(account.currency.family);
      const Comp = getLLDCoinFamily(account.currency.family).ExplorerLink;
      if (Comp) {
        return <Comp account={account} url={url} currencyName={currencyName!} operation={operation} />;
      } else {
        const { t } = useTranslation();
        return(
          <Box m={0} ff="Inter|SemiBold" horizontal justifyContent="center" fontSize={4} my={1}>
            <LinkWithExternalIcon
              fontSize={4}
              onClick={() =>
                openURL(url, "viewOperationInExplorer", {
                  currencyId: currencyName,
                })
              }
              label={t("operationDetails.viewOperation")}
            />
          </Box>
        )
      }
    }
  }
  return null;
};
