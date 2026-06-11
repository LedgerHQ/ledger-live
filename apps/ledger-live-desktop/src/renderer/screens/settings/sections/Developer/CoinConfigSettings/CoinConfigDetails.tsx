import React, { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { coinConfigOverridesSelector } from "~/renderer/reducers/coinConfigOverrides";
import CoinConfigEdit from "./CoinConfigEdit";

type Props = {
  configKey: string;
  focused?: boolean;
  setFocusedName: (arg0: string | undefined) => void;
};

const CoinConfigDetails: React.FC<Props> = ({ configKey, focused, setFocusedName }) => {
  const { t } = useTranslation();
  const overrides = useSelector(coinConfigOverridesSelector);

  const isOverridden = Object.hasOwn(overrides, configKey);
  const overrideValue = overrides[configKey];

  const resolvedValue = LiveConfig.getValueByKey(configKey);

  const handleClick = useCallback(
    () => (focused ? setFocusedName(undefined) : setFocusedName(configKey)),
    [focused, configKey, setFocusedName],
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full flex-row items-center rounded-sm px-16 py-4 text-left hover:bg-base-transparent-hover"
      >
        <span className="mr-4 body-3">{configKey}</span>
        {isOverridden ? (
          <Tag
            appearance="accent-subtle"
            size="sm"
            label={t("settings.developer.coinConfig.overriddenLocally")}
          />
        ) : null}
      </button>
      {focused ? (
        <CoinConfigEdit
          configKey={configKey}
          resolvedValue={resolvedValue}
          overrideValue={overrideValue}
        />
      ) : null}
    </>
  );
};

export default CoinConfigDetails;
