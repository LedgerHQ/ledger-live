import { useTranslation } from "@shared/i18n";
import { useCallback } from "react";
import {
  formatContactDisplayName,
  type ContactDisplayNameInput,
} from "../utils/formatContactDisplayName";

export function useContactDisplayName(): (contact: ContactDisplayNameInput) => string {
  const { t } = useTranslation();

  return useCallback(contact => formatContactDisplayName(contact, t), [t]);
}
