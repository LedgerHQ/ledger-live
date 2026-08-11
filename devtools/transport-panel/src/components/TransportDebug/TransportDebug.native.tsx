import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetHeader,
  Box,
  Text,
  TextInput,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import type { TransportPanelProps } from "../..";
import type { MessageMap } from "@devtools/transport";
import { HistoryLine } from "../HistoryLine/HistoryLine.native";
import { useTransportSend } from "../../hooks";
import { RefObject } from "react";

export interface TransportDebugProps<M extends MessageMap> {
  readonly bottomSheetRef: RefObject<any>;
  readonly transport: TransportPanelProps<M>;
}

export function TransportDebug<M extends MessageMap>({
  bottomSheetRef,
  transport,
}: TransportDebugProps<M>) {
  const { kind, setKind, sendMessage, setSendMessage, sendError, handleSend } = useTransportSend(
    transport.transport,
  );
  const state = transport.transport.getState();

  return (
    <BottomSheet ref={bottomSheetRef} snapPoints="full">
      <BottomSheetHeader title="Transport Debug" description="Debug transport connection" />
      <BottomSheetScrollView style={{ flex: 1 }}>
        <Box lx={{ gap: "s8", padding: "s16", backgroundColor: "muted", borderRadius: "md" }}>
          {state.history.map(entry => (
            <HistoryLine key={entry.id} envelope={entry} localOrigin={state.origin} />
          ))}
        </Box>
      </BottomSheetScrollView>
      <Box lx={{ flexDirection: "column", gap: "s16", padding: "s16" }}>
        <TextInput label="Kind" value={kind} onChangeText={setKind} />
        <TextInput label="Message" value={sendMessage} onChangeText={setSendMessage} />
        <Button appearance="base" isFull onPress={handleSend}>
          Send
        </Button>
        {sendError && (
          <Text typography="body4" lx={{ color: "error" }}>
            {sendError}
          </Text>
        )}
      </Box>
    </BottomSheet>
  );
}
