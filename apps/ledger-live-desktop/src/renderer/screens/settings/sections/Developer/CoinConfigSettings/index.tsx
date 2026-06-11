import React, { useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { Flex, SearchInput, Alert } from "@ledgerhq/react-ui";
import { Button } from "@ledgerhq/lumen-ui-react";
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import {
  hasCoinConfigOverridesSelector,
  setAllCoinConfigOverrides,
} from "~/renderer/reducers/coinConfigOverrides";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import CoinConfigDetails from "./CoinConfigDetails";

const COIN_KEY_PREFIX = "config_currency_";

const CoinConfigContent = withV3StyleProvider((props: { expanded?: boolean }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [focusedName, setFocusedName] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const hasOverrides = useSelector(hasCoinConfigOverridesSelector);

  const allKeys = useMemo(
    () => Object.keys(LiveConfig.instance.config).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const filteredKeys = useMemo(() => {
    const trimmed = searchInput.trim();
    const base = trimmed ? allKeys : allKeys.filter(k => k.startsWith(COIN_KEY_PREFIX));
    if (!trimmed) return base;
    return allKeys.filter(name => includes(lowerCase(name), lowerCase(trimmed)));
  }, [allKeys, searchInput]);

  const keysList = useMemo(
    () =>
      filteredKeys.map(key => (
        <CoinConfigDetails
          key={key}
          configKey={key}
          focused={focusedName === key}
          setFocusedName={setFocusedName}
        />
      )),
    [filteredKeys, focusedName],
  );

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <div>{t("settings.developer.coinConfig.desc")}</div>
      {props.expanded ? (
        <>
          <SearchInput
            placeholder={t("settings.developer.coinConfig.search")}
            value={searchInput}
            onChange={setSearchInput}
            clearable
          />
          <Alert type="info" title={t("settings.developer.coinConfig.hint")} showIcon={false} />
          <Button
            style={{ alignSelf: "flex-start", marginTop: 12 }}
            appearance="accent"
            onClick={() => dispatch(setAllCoinConfigOverrides({}))}
            disabled={!hasOverrides}
          >
            {t("settings.developer.coinConfig.restoreAll")}
          </Button>
          <Flex height={15} />
          {keysList}
        </>
      ) : null}
    </Flex>
  );
});

const CoinConfigSettings = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(v => !v), []);

  return (
    <Row
      title={t("settings.developer.coinConfig.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start", flexShrink: 0 }}
      desc={<CoinConfigContent expanded={expanded} />}
    >
      <Button size="sm" appearance="accent" onClick={toggle}>
        {expanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default CoinConfigSettings;
