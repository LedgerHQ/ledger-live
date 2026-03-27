import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useOperationsSectionHeaderViewModel } from "./useOperationsSectionHeaderViewModel";

type Props = {
  day: Date;
};

function OperationsSectionHeader({ day }: Readonly<Props>) {
  const { formattedDay } = useOperationsSectionHeaderViewModel(day);

  return (
    <Box lx={containerStyle} testID="operations-section-header">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{formattedDay}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  backgroundColor: "canvas",
  flex: 1,
};

export default React.memo(OperationsSectionHeader);
