import React, { useState, useCallback } from "react";
import Switch from "~/renderer/components/Switch";
import { toggleSimulate500Error } from "~/mocks/browser";

const Simulate500ErrorToggle = () => {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = useCallback(() => {
    const newValue = !enabled;
    setEnabled(newValue);
    toggleSimulate500Error(newValue);
  }, [enabled]);

  return (
    <Switch isChecked={enabled} onChange={handleToggle} data-testid="simulate-500-error-toggle" />
  );
};

export default Simulate500ErrorToggle;
