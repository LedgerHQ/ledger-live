import React from "react";
import { CardButton } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export const AddAccountButton = ({ label, onClick, disabled }: Props) => (
  <CardButton
    appearance="outline"
    icon={Plus}
    title={label}
    hideChevron
    onPress={onClick}
    disabled={disabled}
    lx={{ marginTop: "s16" }}
    testID="add-new-account-button"
  />
);
