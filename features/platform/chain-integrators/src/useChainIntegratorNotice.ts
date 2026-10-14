import { useTranslation } from "@shared/i18n";
import { getChainIntegrator } from "./chainIntegrators";

export function useChainIntegratorNotice(family: string): string | null {
  const { t } = useTranslation();
  const integrator = getChainIntegrator(family);
  return integrator ? t("chainIntegrators.integratedBy", { team: integrator }) : null;
}
