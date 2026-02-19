import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Download } from "@ledgerhq/lumen-ui-react/symbols";
import type { UpdaterButtonProps } from "./types";

const UpdaterButtonView = ({ label, appearance, isLoading, onClick }: UpdaterButtonProps) => (
  <Button
    appearance={appearance}
    size="sm"
    icon={Download}
    loading={isLoading}
    onClick={onClick}
    data-testid="updater-top-bar-button"
  >
    {label}
  </Button>
);

export default UpdaterButtonView;
