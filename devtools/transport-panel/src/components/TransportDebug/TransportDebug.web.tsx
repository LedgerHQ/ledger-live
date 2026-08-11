import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  TextInput,
  Button,
} from "@ledgerhq/lumen-ui-react";
import { HistoryLine } from "../HistoryLine";
import type { MessageMap } from "@devtools/transport";
import type { TransportPanelProps } from "../../types";
import { useTransportSend } from "../../hooks";

export interface TransportDebugProps<M extends MessageMap> {
  readonly transportConfig: TransportPanelProps<M>;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function TransportDebug<M extends MessageMap>({
  transportConfig,
  open,
  onOpenChange,
}: TransportDebugProps<M>) {
  const { kind, setKind, sendMessage, setSendMessage, sendError, handleSend } = useTransportSend(
    transportConfig.transport,
  );
  const state = transportConfig.transport.getState();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fixed">
      <DialogContent>
        <DialogHeader title="Transport Debug" description="Debug transport connection" />
        <DialogBody className="flex flex-col gap-16">
          <div className="flex flex-col gap-8 bg-canvas-muted p-16 rounded-md">
            {state.history.map(entry => (
              <HistoryLine key={entry.id} envelope={entry} localOrigin={state.origin} />
            ))}
          </div>
        </DialogBody>
        <DialogFooter className="flex flex-col gap-8 pt-32">
          <div className="flex gap-16">
            <TextInput label="Kind" value={kind} onChange={e => setKind(e.target.value)} />
            <TextInput
              label="Debug Input"
              value={sendMessage}
              onChange={e => setSendMessage(e.target.value)}
            />
            <Button onClick={handleSend}>Send</Button>
          </div>
          {sendError && <span className="body-4 text-error">{sendError}</span>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
