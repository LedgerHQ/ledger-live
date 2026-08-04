import type { MessageMap } from "@devtools/transport";
import type { TransportPanelProps } from "./types";
import { Box, useBottomSheetRef, Button } from "@ledgerhq/lumen-ui-rnative";
import { TransportStateIndicator } from "./components/TransportStateIndicator";
import { TransportPanelContent } from "./components/TransportPanelContent";
import { useTransportState } from "./hooks";

export function TransportPanel<M extends MessageMap>(props: TransportPanelProps<M>) {
  const bottomSheetRef = useBottomSheetRef();
  const state = useTransportState(props.transport);
  return (
    <Box>
      <Button appearance="gray" onPress={() => bottomSheetRef.current?.present()} isFull>
        <TransportStateIndicator transportState={state} role={props.role} />
      </Button>
      <TransportPanelContent bottomSheetRef={bottomSheetRef} transport={props} />
    </Box>
  );
}
