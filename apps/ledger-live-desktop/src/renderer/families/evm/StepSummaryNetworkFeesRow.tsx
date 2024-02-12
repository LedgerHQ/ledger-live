import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import Box from "~/renderer/components/Box";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import TranslatedError from "~/renderer/components/TranslatedError";
import { SummaryNetworkFeesRowProps } from "../types";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";

const StepSummaryNetworkFeesRow = ({
  feeTooHigh,
  feesUnit,
  estimatedFees,
  feesCurrency,
}: SummaryNetworkFeesRowProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      <Box horizontal justifyContent="space-between">
        <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
          <Trans i18nKey="send.steps.details.maxFees" />{" "}
          <ToolTip content={t("send.steps.details.maxFeesInfo")}>
            <InfoCircle size={12} />
          </ToolTip>
        </Text>
        <Box>
          <FormattedVal
            color={feeTooHigh ? "warning" : colors.palette.text.shade80}
            disableRounding
            unit={feesUnit}
            alwaysShowValue
            val={estimatedFees}
            fontSize={4}
            inline
            showCode
          />
          <Box textAlign="right">
            <CounterValue
              color={feeTooHigh ? "warning" : colors.palette.text.shade60}
              fontSize={3}
              currency={feesCurrency}
              value={estimatedFees}
              alwaysShowSign={false}
              alwaysShowValue
            />
          </Box>
        </Box>
      </Box>
      {feeTooHigh ? (
        <Box horizontal justifyContent="flex-end" alignItems="center" color="warning">
          <IconExclamationCircle size={10} />
          <Text
            ff="Inter|Medium"
            fontSize={2}
            style={{
              marginLeft: "5px",
            }}
          >
            <TranslatedError error={feeTooHigh} />
          </Text>
        </Box>
      ) : null}
    </>
  );
};

export default StepSummaryNetworkFeesRow;
