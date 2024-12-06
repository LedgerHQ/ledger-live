import React, { useCallback, useMemo, useState } from "react";
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
  StartExchangeErrorResult,
  StartExchangeSuccessResult,
} from "@ledgerhq/live-common/hw/actions/startExchange";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import connectApp from "@ledgerhq/live-common/hw/connectApp";

import CompleteExchange, {
  Data as CompleteExchangeData,
  isCompleteExchangeData,
} from "~/renderer/modals/Platform/Exchange/CompleteExchange/Body";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import { Exchange, isExchangeSwap } from "@ledgerhq/live-common/exchange/types";
import { HardwareUpdate, renderLoading } from "./DeviceAction/rendering";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";

const Divider = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
`;

const ContentWrapper = styled.main`
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 62px);
  overflow: auto;
  flex: 1;
  justify-content: space-between;
`;

export type StartExchangeData = {
  onCancel?: (startExchangeError: StartExchangeErrorResult) => void;
  exchangeType: ExchangeType;
  provider?: string;
  exchange?: Exchange;
  onResult: (startExchangeResult: StartExchangeSuccessResult) => void;
};

export function isStartExchangeData(data: unknown): data is StartExchangeData {
  if (data === null || typeof data !== "object") {
    return false;
  }
  return "exchangeType" in data;
}

const DrawerClosedError = createCustomErrorClass("DrawerClosedError");

type Keys = Record<string, { title: string; description: string }>;

const INCOMPATIBLE_NANO_S_TOKENS_KEYS: Keys = {
  solana: {
    title: "swap.incompatibility.spl_tokens_title",
    description: "swap.incompatibility.spl_tokens_description",
  },
};

const INCOMPATIBLE_NANO_S_CURRENCY_KEYS: Keys = {
  ton: {
    title: "swap.incompatibility.ton_title",
    description: "swap.incompatibility.ton_description",
  },
  cardano: {
    title: "swap.incompatibility.ada_title",
    description: "swap.incompatibility.ada_description",
  },
};
const getIncompatibleCurrencyKeys = (exchange: ExchangeSwap) => {
  const parentFrom = exchange?.fromParentAccount?.currency?.id || "";
  const parentTo = exchange?.toParentAccount?.currency?.id || "";
  const from =
    (exchange?.fromAccount.type === "Account" && exchange?.fromAccount?.currency?.id) || "";
  const to = (exchange?.toAccount.type === "Account" && exchange?.toAccount?.currency?.id) || "";

  return (
    INCOMPATIBLE_NANO_S_TOKENS_KEYS[parentFrom] ||
    INCOMPATIBLE_NANO_S_TOKENS_KEYS[parentTo] ||
    INCOMPATIBLE_NANO_S_CURRENCY_KEYS[from] ||
    INCOMPATIBLE_NANO_S_CURRENCY_KEYS[to]
  );
};

export const LiveAppDrawer = () => {
  const [dismissDisclaimerChecked, setDismissDisclaimerChecked] = useState<boolean>(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);

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

  const drawerContent = useMemo(() => {
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
                  <CheckBox isChecked={dismissDisclaimerChecked} data-testid="dismiss-disclaimer" />
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

                <Button primary onClick={onContinue} data-testid="drawer-continue-button">
                  {t("platform.disclaimer.CTA")}
                </Button>
              </Box>
            </Box>
          </>
        );
      case "EXCHANGE_START": {
        if (data && isStartExchangeData(data)) {
          if (device?.modelId === "nanoS" && data.exchange && isExchangeSwap(data.exchange)) {
            if (data.provider === "thorswap") {
              return (
                <HardwareUpdate
                  i18nKeyTitle="swap.wrongDevice.title"
                  i18nKeyDescription="swap.wrongDevice.description"
                />
              );
            }
            const keys = getIncompatibleCurrencyKeys(data.exchange);
            if (keys) {
              return (
                <HardwareUpdate i18nKeyTitle={keys.title} i18nKeyDescription={keys.description} />
              );
            }
          }
          return (
            <DeviceAction
              action={action}
              request={data}
              Result={() => renderLoading()}
              onResult={result => {
                if ("startExchangeResult" in result) {
                  data.onResult(result.startExchangeResult);
                }
                if ("startExchangeError" in result) {
                  data.onCancel?.(result.startExchangeError);
                  dispatch(closePlatformAppDrawer());
                }
              }}
            />
          );
        }
        return null;
      }
      case "EXCHANGE_COMPLETE":
        return data && isCompleteExchangeData(data) ? (
          <CompleteExchange
            data={data}
            onClose={() => {
              dispatch(closePlatformAppDrawer());
            }}
          />
        ) : null;
      default:
        return null;
    }
  }, [payload, t, dismissDisclaimerChecked, onContinue, device?.modelId, dispatch]);

  return (
    <SideDrawer
      title={payload ? t(payload.title) : ""}
      isOpen={isOpen}
      onRequestClose={() => {
        payload?.data?.onCancel?.({
          error: new DrawerClosedError("User closed the drawer"),
          name: "DrawerClosedError",
          message: "User closed the drawer",
        });
        dispatch(closePlatformAppDrawer());
      }}
      direction="left"
    >
      <ContentWrapper>{drawerContent}</ContentWrapper>
    </SideDrawer>
  );
};
