import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

const DeviceActionButton = ({ label, onClick, disabled, loading }: Props) => (
  <Button
    appearance="base"
    size="sm"
    icon={LedgerLogo}
    isFull
    disabled={disabled}
    loading={loading}
    onClick={onClick}
  >
    {label}
  </Button>
);

export default DeviceActionButton;
