import React from "react";
import { useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import { SettingsSectionRow as Row } from "~/renderer/screens/settings/SettingsSection";
import { useFilterTokenOperationsZeroAmount } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
import FilterTokenOperationsThreshold from "./FilterTokenOperationsThreshold";

export default function FilterTokenOperationsZeroAmount() {
  const [filterTokenOperationsZeroAmount, setFilterTokenOperationsZeroAmount] =
    useFilterTokenOperationsZeroAmount();
  const { t } = useTranslation();

  return (
    <Row
      title={t("settings.accounts.filterTokenOperationsZeroAmount.title")}
      desc={t("settings.accounts.filterTokenOperationsZeroAmount.desc")}
      childrenContainerStyle={{ alignSelf: "center" }}
    >
      <Track
        onUpdate
        event={
          filterTokenOperationsZeroAmount
            ? "filterTokenOperationsZeroAmountEnabled"
            : "filterTokenOperationsZeroAmountDisabled"
        }
      />
      <Box horizontal alignItems="center" style={{ userSelect: "none", gap: 10 }}>
        <FilterTokenOperationsThreshold />
        <Switch
          isChecked={filterTokenOperationsZeroAmount}
          onChange={setFilterTokenOperationsZeroAmount}
          data-e2e="filterTokenOperationsZeroAmount_button"
          data-testid="switch-filter-token-operations-zero-amount"
        />
      </Box>
    </Row>
  );
}
