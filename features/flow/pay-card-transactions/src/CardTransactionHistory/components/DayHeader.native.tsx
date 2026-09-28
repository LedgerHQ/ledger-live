import React, { useMemo } from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { formatHistoryDayLabel } from "../../CardTransactions/components/ListItem/formatCardTransactionItem";

type DayHeaderProps = Readonly<{
  day?: Date;
  formatDay?: (date: Date) => string;
}>;

export function DayHeader({ day, formatDay }: DayHeaderProps) {
  const { t } = useTranslation();
  const label = useMemo(
    () => formatHistoryDayLabel(day, key => t(`payTab.cardTransactions.history.${key}`), formatDay),
    [day, formatDay, t],
  );

  return (
    <Box lx={{ backgroundColor: "canvas" }} testID="card-history-day-header">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{label}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
    </Box>
  );
}
