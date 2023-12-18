import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import CheckBox from "~/renderer/components/CheckBox";
import Button from "~/renderer/components/Button";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import { dismissBanner } from "~/renderer/actions/settings";
import { closePlatformAppDrawer } from "~/renderer/actions/UI";
import { platformAppDrawerStateSelector } from "~/renderer/reducers/UI";
import Text from "./Text";
import { AppDetails } from "./Platform/AppDetails";
import ExternalLink from "./ExternalLink/index";
import LiveAppDisclaimer from "./WebPlatformPlayer/LiveAppDisclaimer";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import {
  createAction,
  Result as StartExchangeResult,
} from "@ledgerhq/live-common/hw/actions/startExchange";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import {
  Data as StartExchangeData,
  isStartExchangeData,
} from "~/renderer/modals/Platform/Exchange/StartExchange/index";
import CompleteExchange, {
  Data as CompleteExchangeData,
  isCompleteExchangeData,
} from "~/renderer/modals/Platform/Exchange/CompleteExchange/Body";

const Divider = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
`;

export const LiveAppDrawer = () => {
  const [dismissDisclaimerChecked, setDismissDisclaimerChecked] = useState<boolean>(false);
  // @ts-expect-error how to type payload?
  const {
    isOpen,
    payload,
  }: {
    isOpen: boolean;
    payload: {
      title: string;
      type: string;
      manifest: AppManifest;
      disclaimerId: string;
      data?: StartExchangeData | CompleteExchangeData;
      next: (manifest: AppManifest, isChecked: boolean) => void;
    };
  } = useSelector(platformAppDrawerStateSelector);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onContinue = useCallback(() => {
    if (payload && payload.type === "DAPP_DISCLAIMER") {
      const { manifest, disclaimerId, next } = payload;
      if (dismissDisclaimerChecked && disclaimerId) {
        dispatch(dismissBanner(disclaimerId));
      }
      dispatch(closePlatformAppDrawer());
      next(manifest, dismissDisclaimerChecked);
    }
  }, [dismissDisclaimerChecked, dispatch, payload]);
  const drawerContent = useCallback(() => {
    if (!payload) {
      return null;
    }
    const { type, manifest, data } = payload;
    const action = createAction(connectApp, startExchange);
    switch (type) {
      case "DAPP_INFO":
        return manifest ? (
          <Box pt={7} px={6}>
            <AppDetails manifest={manifest} />
            <Divider my={6} />
            <Text ff="Inter|SemiBold">{t(`platform.app.informations.website`)}</Text>
            <Text ff="Inter" color="#8a80db">
              <ExternalLink
                label={manifest?.homepageUrl}
                isInternal={false}
                onClick={() => openURL(manifest?.homepageUrl)}
              />
            </Text>
          </Box>
        ) : null;
      case "DAPP_DISCLAIMER":
        return (
          <>
            <Box px={6} flex={1} justifyContent="center">
              <Box>{manifest ? <LiveAppDisclaimer manifest={manifest} /> : null}</Box>
            </Box>

            <Box pb={24}>
              <Divider my={24} />
              <Box px={6} horizontal alignItems="center" justifyContent="space-between">
                <Box
                  horizontal
                  alignItems="flex-start"
                  onClick={() => setDismissDisclaimerChecked(!dismissDisclaimerChecked)}
                  style={{
                    flex: 1,
                    cursor: "pointer",
                  }}
                >
                  <CheckBox
                    isChecked={dismissDisclaimerChecked}
                    data-test-id="dismiss-disclaimer"
                  />
                  <Text
                    ff="Inter|SemiBold"
                    fontSize={4}
                    style={{
                      marginLeft: 8,
                      overflowWrap: "break-word",
                      flex: 1,
                    }}
                  >
                    {t("platform.disclaimer.checkbox")}
                  </Text>
                </Box>

                <Button primary onClick={onContinue} data-test-id="drawer-continue-button">
                  {t("platform.disclaimer.CTA")}
                </Button>
              </Box>
            </Box>
          </>
        );
      case "EXCHANGE_START":
        return data && isStartExchangeData(data) ? (
          <Box alignItems={"center"} height={"100%"} px={32}>
            <DeviceAction
              action={action}
              request={{
                exchangeType: data.exchangeType,
              }}
              onResult={(result: StartExchangeResult) => {
                if ("startExchangeResult" in result) {
                  data.onResult(result.startExchangeResult as unknown as string);
                }
                if ("startExchangeError" in result) {
                  data.onCancel?.(result.startExchangeError as unknown as Error);
                }
              }}
            />
          </Box>
        ) : null;
      case "EXCHANGE_COMPLETE":
        return data && isCompleteExchangeData(data) ? <CompleteExchange data={data} /> : null;
      default:
        return null;
    }
  }, [payload, dismissDisclaimerChecked, onContinue, t]);

  return (
    <SideDrawer
      title={payload ? t(payload.title) : ""}
      isOpen={isOpen}
      onRequestClose={() => {
        dispatch(closePlatformAppDrawer());
      }}
      direction="left"
    >
      <Box flex="1" justifyContent="space-between">
        {drawerContent()}
      </Box>
    </SideDrawer>
  );
};
