// @flow

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text} from "@ledgerhq/react-ui"
import Button from "~/renderer/components/ButtonV3";
import type { Account } from "@ledgerhq/live-common/types/index";

import { getAccountBannerState as getCosmosBannerState } from "@ledgerhq/live-common/families/cosmos/logic";
import { getAccountBannerProps as getCosmosBannerProps} from "~/renderer/families/cosmos/utils"

const getBannerProps = async (account: Account, hooks) => {
    const id = account.currency.id;
    switch(id) {
        case 'cosmos':
            const state = await getCosmosBannerState(account);
            const props = getCosmosBannerProps(state, account, hooks);
            return props
   
        default:
            return  { display: false }
      }
}

type BannerProps = {
    title: string,
    description: string,
    cta: string,
    onClick: () => void,
};

const AccountBanner = ({title, description, cta, onClick}: BannerProps) => {
    return (
        <Alert
            type="info"
            showIcon={false}
            containerProps={{ mt: -4, mb: 4, mx: 0, p: 12 }}
            renderContent={({ color, textProps }) => (
                <div style={{  display: "flex", alignItems: "center", width: "100%" }}>
                    <div style={{ flex:1, width: "100%", display: "flex", flexDirection: "column" }}>
                        <Text color="inherit" {...textProps} style={{ display: "flex", width: "100%", fontSize: "14px", fontWeight: 700 }}>{title}</Text>
                        <Text color="inherit" {...textProps} style={{ display: "flex", width: "100%", fontSize: "14px", marginTop: "10px" }}> {description}</Text>
                    </div>
                    <Button
                        variant="color"
                        ml={12}
                        onClick={onClick}
                    >
                        {cta}
                    </Button>
                </div>
            )}
        />
    );
}

export { getBannerProps, AccountBanner};
