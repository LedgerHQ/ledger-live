import React, { useState } from "react";

import { Switch } from "@ledgerhq/native-ui";
import Track from "../../../analytics/Track";

type Props = {
  name: string;
  valueOn: any;
  valueOff: any;
  checked?: boolean;
  readOnly?: boolean;
  // eslint-disable-next-line no-unused-vars
  onChange: (name: string, val: any) => boolean;
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
