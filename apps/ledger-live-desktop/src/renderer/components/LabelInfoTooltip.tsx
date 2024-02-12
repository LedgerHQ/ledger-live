import React from "react";
import Box from "~/renderer/components/Box";
import Tooltip from "~/renderer/components/Tooltip";
import IconInfoCircle from "~/renderer/icons/InfoCircle";
type Props = {
  text: React.ReactNode;
  children?: React.ReactNode;
};
function LabelInfoTooltip(props: Props) {
  const { text, children } = props;
  return (
    <Box horizontal alignItems="center" flow={1}>
      {children}
      <Tooltip content={text}>
        <IconInfoCircle size={12} />
      </Tooltip>
    </Box>
  );
}
export default React.memo<Props>(LabelInfoTooltip);
