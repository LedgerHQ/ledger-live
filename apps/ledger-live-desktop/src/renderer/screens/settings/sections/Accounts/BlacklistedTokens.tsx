import { SettingsSection as Section, SettingsSectionRow as Row } from "../../SettingsSection";
import Text from "~/renderer/components/Text";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadBlacklistedTokenSections } from "@ledgerhq/live-common/account/index";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Box from "~/renderer/components/Box";
import styled from "styled-components";
import IconCross from "~/renderer/icons/Cross";
import { useDispatch, useSelector } from "react-redux";
import { showToken } from "~/renderer/actions/settings";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import IconAngleDown from "~/renderer/icons/AngleDown";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type BlacklistedTokenSection = {
  parentCurrency: CryptoCurrency;
  tokens: TokenCurrency[];
};

export default function BlacklistedTokens() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const sync = useBridgeSync();
  const [sectionVisible, setSectionVisible] = useState(false);

  // Trigger a sync on unmounting the block
  useEffect(
    () => () =>
      sync({
        type: "SYNC_ALL_ACCOUNTS",
        priority: 5,
        reason: "tokens-ignore-list-change",
      }),
    [sync],
  );
  const onShowToken = useCallback(
    (tokenId: string) => {
      dispatch(showToken(tokenId));
    },
    [dispatch],
  );
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const [sections, setSections] = useState<BlacklistedTokenSection[]>([]);

  useEffect(() => {
    let mounted = true;
    loadBlacklistedTokenSections(blacklistedTokenIds)
      .then(loadedSections => {
        if (mounted) {
          setSections(loadedSections);
        }
      })
      .catch(error => {
        console.error("Failed to load blacklisted tokens:", error);
        if (mounted) {
          setSections([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, [blacklistedTokenIds]);

  const toggleCurrencySection = useCallback(() => {
    setSectionVisible(prevState => !prevState);
  }, [setSectionVisible]);
  return (
    <Section
      style={{
        flowDirection: "column",
      }}
    >
      <Track onUpdate event="BlacklistedTokens dropdown" opened={sectionVisible} />
      <Row
        title={t("settings.accounts.tokenBlacklist.title")}
        desc={t("settings.accounts.tokenBlacklist.desc")}
        onClick={toggleCurrencySection}
        contentContainerStyle={
          blacklistedTokenIds.length
            ? {
                cursor: "pointer",
              }
            : undefined
        }
      >
        {blacklistedTokenIds.length ? (
          <Box horizontal alignItems="center">
            <Box ff="Inter" fontSize={3} mr={2}>
              {t("settings.accounts.tokenBlacklist.count", {
                count: blacklistedTokenIds.length,
              })}
            </Box>
            <Show visible={sectionVisible}>
              <IconAngleDown size={24} />
            </Show>
          </Box>
        ) : null}
      </Row>

      {sectionVisible && (
        <div>
          {sections.map(({ parentCurrency, tokens }) => (
            <Box key={parentCurrency.id}>
              <BlacklistedTokensSectionHeader>
                <Text ff="Inter|Bold" fontSize={2} color="palette.text.shade40">
                  {parentCurrency.name}
                </Text>
              </BlacklistedTokensSectionHeader>
              <Body>
                {tokens.map((token: TokenCurrency) => (
                  <BlacklistedTokenRow key={token.id}>
                    <CryptoCurrencyIcon currency={token} size={28} />
                    <Text
                      style={{
                        marginLeft: 10,
                        flex: 1,
                      }}
                      ff="Inter|Medium"
                      color="palette.text.shade100"
                      fontSize={3}
                    >
                      {token.name}
                    </Text>
                    <IconContainer onClick={() => onShowToken(token.id)}>
                      <IconCross size={16} />
                    </IconContainer>
                  </BlacklistedTokenRow>
                ))}
              </Body>
            </Box>
          ))}
        </div>
      )}
    </Section>
  );
}
const IconContainer = styled.div`
  color: ${p => p.theme.colors.palette.text.shade60};
  text-align: center;
  &:hover {
    cursor: pointer;
    color: ${p => p.theme.colors.palette.text.shade40};
  }
`;
const BlacklistedTokenRow = styled(Box).attrs({
  alignItems: "center",
  horizontal: true,
  flow: 1,
  py: 1,
})`
  margin: 0px;
  &:not(:last-child) {
    border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
  }
  padding: 14px 6px;
`;
const Body = styled(Box)`
  &:not(:empty) {
    padding: 0 20px;
  }
`;
const BlacklistedTokensSectionHeader = styled.div`
  background: ${p => p.theme.colors.palette.background.default};
  margin: 0 20px;
  padding: 2px 12px;
  border-radius: 4px;
  text-transform: uppercase;
  & > * {
    letter-spacing: 0.1em;
  }
`;
const Show = styled(Box).attrs<{ visible?: boolean }>(() => ({}))<{ visible?: boolean }>`
  transform: rotate(${p => (p.visible ? 0 : 270)}deg);
`;
