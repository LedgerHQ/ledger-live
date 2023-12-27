import React, { useState } from "react";

import { Switch } from "@ledgerhq/native-ui";
import { EnvName } from "@ledgerhq/live-env";
import Track from "~/analytics/Track";

type Props = {
  name: EnvName;
  valueOn?: unknown;
  valueOff?: unknown;
  checked?: boolean;
  readOnly?: boolean;
  onChange: (name: EnvName, val: unknown) => boolean;
};

export default function FeatureSwitch({
  name,
  readOnly,
  onChange,
  valueOn = true,
  valueOff = false,
  ...props
}: Props) {
  const [checked, setChecked] = useState(props.checked || false);

  const onChanceCallback = (evt: boolean) => {
    onChange(name, evt ? valueOn : valueOff);
    setChecked(evt);
  };

  return (
    <>
      <Track onUpdate event={checked ? `${name}Enabled` : `${name}Disabled`} />
      <Switch
        disabled={readOnly}
        onChange={readOnly ? undefined : onChanceCallback}
        checked={checked}
      />
    </>
  );
}
