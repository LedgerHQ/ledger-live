import React, { useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import CheckBox from "~/renderer/components/CheckBox";
import Button from "~/renderer/components/Button";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import { closePlatformAppDrawer } from "~/renderer/actions/UI";
import {
  platformAppDrawerStateSelector,
  PlatformAppDrawers as AppDrawerPayload,
} from "~/renderer/reducers/UI";
import Text from "../Text";
import { AppDetails } from "../Platform/AppDetails";
import ExternalLink from "../ExternalLink/index";
import LiveAppDisclaimer from "./LiveAppDisclaimer";

const Divider = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
`;

export function LiveAppDrawer() {
  const [isChecked, setIsChecked] = useState(false);
  // @ts-expect-error payload can be undefined during initialization
  const { isOpen, payload: { manifest, type, title, next } = {} } = useSelector(
    platformAppDrawerStateSelector,
  ) as {
    isOpen: boolean;
    payload?: AppDrawerPayload;
  };

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onConfirm = useCallback(() => {
    next(manifest, isChecked);
  }, [manifest, next, isChecked]);

  const toggleChecked = useCallback(() => {
    setIsChecked(isChecked => !isChecked);
  }, []);

  const drawerContent = useMemo(() => {
    if (!manifest) {
      return null;
    }
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
                  onClick={toggleChecked}
                  style={{
                    flex: 1,
                    cursor: "pointer",
                  }}
                >
                  <CheckBox isChecked={isChecked} data-test-id="dismiss-disclaimer" />
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

                <Button primary onClick={onConfirm} data-test-id="drawer-continue-button">
                  {t("platform.disclaimer.CTA")}
                </Button>
              </Box>
            </Box>
          </>
        );
      default:
        return null;
    }
  }, [t, isChecked, manifest, onConfirm, toggleChecked, type]);

  return (
    <SideDrawer
      title={title ? t(title) : ""}
      isOpen={isOpen}
      onRequestClose={() => {
        dispatch(closePlatformAppDrawer());
      }}
      direction="left"
    >
      <Box flex="1" justifyContent="space-between">
        {drawerContent}
      </Box>
    </SideDrawer>
  );
}
