import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { useHistory } from "react-router-dom";

export function MarketPerformanceWidgetFooter() {
  const { t } = useTranslation();
  const history = useHistory();

  const onClickButton = (target: "swap" | "exchange") => {
    history.push(target);
  };

  return (
    <Flex mt={5} justifyContent="space-between">
      <ButtonV3
        variant="main"
        big
        width={"48%"}
        onClick={() => onClickButton("swap")}
        event="button_clicked"
        eventProperties={{ button: "swap", page: "portfolio" }}
      >
        {t("dashboard.marketPerformanceWidget.swap")}
      </ButtonV3>

      <ButtonV3
        variant="shade"
        big
        width={"48%"}
        onClick={() => onClickButton("exchange")}
        event="button_clicked"
        eventProperties={{ button: "buy", page: "portfolio" }}
      >
        {t("dashboard.marketPerformanceWidget.buy")}
      </ButtonV3>
    </Flex>
  );
}
