import { EnvName } from "@ledgerhq/live-env";
import React, { useCallback } from "react";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
type Props = {
  name: EnvName;
  valueOn?: string | boolean;
  valueOff?: string | boolean;
  isDefault: boolean;
  readOnly: boolean;
  onChange: (name: EnvName, val: unknown) => void;
};
const ExperimentalSwitch = ({
  onChange,
  valueOn = true,
  valueOff = false,
  name,
  isDefault,
  readOnly,
}: Props) => {
  const checked = !isDefault;
  const handleOnChange = useCallback(
    (evt: boolean) => {
      onChange(name, evt ? valueOn : valueOff);
    },
    [onChange, valueOn, valueOff, name],
  );
  return (
    <>
      <Track onUpdate event={checked ? `${name}Enabled` : `${name}Disabled`} />
      <Switch
        disabled={readOnly}
        isChecked={checked}
        onChange={readOnly ? undefined : handleOnChange}
        data-test-id={`${name}-button`}
      />
    </>
  );
};
export default ExperimentalSwitch;
