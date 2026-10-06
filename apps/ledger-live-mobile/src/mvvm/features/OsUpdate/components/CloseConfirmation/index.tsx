import React from "react";
import type { CloseConfirmationComponent } from "@ledgerhq/live-common/os-update/types";
import { CloseConfirmationContent } from "../../sheets/CloseConfirmationContent";
import { OsUpdateStateSheet } from "../../sheets/OsUpdateStateSheet";

export const CloseConfirmation: CloseConfirmationComponent = ({ isOpen, onContinue, onCancel }) => (
  <OsUpdateStateSheet isOpen={isOpen} onClose={onContinue} hideHeader>
    <CloseConfirmationContent onContinue={onContinue} onCancel={onCancel} />
  </OsUpdateStateSheet>
);
