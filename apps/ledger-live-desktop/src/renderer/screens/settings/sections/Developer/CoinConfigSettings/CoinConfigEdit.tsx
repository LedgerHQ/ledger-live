import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { setCoinConfigOverride } from "~/renderer/reducers/coinConfigOverrides";
import { Button, TextInput } from "@ledgerhq/lumen-ui-react";
import Alert from "~/renderer/components/Alert";

type Props = {
  configKey: string;
  resolvedValue: unknown;
  overrideValue: unknown;
};

const CoinConfigEdit: React.FC<Props> = ({ configKey, resolvedValue, overrideValue }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [error, setError] = useState<unknown>();
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);

  const stringifiedResolved = useMemo(() => JSON.stringify(resolvedValue), [resolvedValue]);
  const inputValueDefaulted = inputValue ?? stringifiedResolved;

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setInputValue(event.target.value);
  }, []);

  const handleRestore = useCallback(() => {
    setError(undefined);
    setInputValue(undefined);
    dispatch(setCoinConfigOverride({ key: configKey, value: undefined }));
  }, [dispatch, configKey]);

  const handleOverride = useCallback(() => {
    setError(undefined);
    try {
      const parsed: unknown = JSON.parse(inputValue!);
      dispatch(setCoinConfigOverride({ key: configKey, value: parsed }));
      setInputValue(undefined);
    } catch (e) {
      setError(e);
    }
  }, [dispatch, inputValue, configKey]);

  return (
    <div className="flex flex-col gap-12 pl-24">
      {error ? (
        <Alert mb={3} type="warning">
          {(error as Error).toString()}
        </Alert>
      ) : null}
      <div className="flex flex-row items-center gap-8">
        <div className="flex flex-1 flex-col">
          <TextInput
            aria-label={configKey}
            value={inputValueDefaulted}
            onChange={handleInputChange}
          />
        </div>
        <Button
          appearance="transparent"
          onClick={handleRestore}
          disabled={overrideValue === undefined}
        >
          {t("settings.developer.coinConfig.restore")}
        </Button>
        <Button disabled={!inputValue} appearance="base" onClick={handleOverride}>
          {t("settings.developer.coinConfig.override")}
        </Button>
      </div>

      <pre className="body-3 overflow-x-scroll rounded-sm bg-muted p-12 whitespace-pre">
        {JSON.stringify(resolvedValue, null, 2)}
      </pre>
    </div>
  );
};

export default CoinConfigEdit;
