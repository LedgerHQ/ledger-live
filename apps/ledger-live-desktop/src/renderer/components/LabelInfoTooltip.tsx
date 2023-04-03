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
    <Tooltip disableWrapper content={text}>
      <Box horizontal alignItems="center" flow={1}>
        {children}
        <IconInfoCircle size={12} />
      </Box>
    </Tooltip>
  );
}
export default React.memo<Props>(LabelInfoTooltip);
