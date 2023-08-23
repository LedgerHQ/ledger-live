import React from "react";
import {Account, Operation} from "@ledgerhq/types-live";
import { getTransactionExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { t } from "i18next";
import { openURL } from "~/renderer/linking";


const ExplorerLink: React.FC<{ account: Account, url: string, currencyName: string, operation: Operation }> = ({ account, currencyName, operation }) => {
    console.log("in hedera?");
    const url = getTransactionExplorer(getDefaultExplorerView(account.currency), operation.extra.consensusTimeStamp)

    return (
        <Box m={0} ff="Inter|SemiBold" horizontal justifyContent="center" fontSize={4} my={1}>
            <LinkWithExternalIcon
                fontSize={4}
                onClick={() =>
                    openURL(url!, "viewOperationInExplorer", {
                    currencyId: currencyName,
                    })
                }
                label={t("operationDetails.viewOperation")}
            />
        </Box>
    );
}

export default ExplorerLink;