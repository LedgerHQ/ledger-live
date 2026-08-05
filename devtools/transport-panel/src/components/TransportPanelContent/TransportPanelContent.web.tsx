import { IconButton, TextInput } from "@ledgerhq/lumen-ui-react";
import { Refresh, Repair } from "@ledgerhq/lumen-ui-react/symbols";
import { useState } from "react";
import { TransportDebug } from "../TransportDebug";
import type { MessageMap } from "@devtools/transport";
import type { TransportPanelProps } from "../../types";

interface TransportPanelContentProps<M extends MessageMap> {
  readonly transportConfig: TransportPanelProps<M>;
}

export function TransportPanelContent<M extends MessageMap>({
  transportConfig,
}: Readonly<TransportPanelContentProps<M>>) {
  const { transport, target, setTarget, hubUrl, setHubUrl, role } = transportConfig;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <div className="p-10 flex flex-col gap-8">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-8 items-center">
        {role === "tool" && (
          <>
            <label htmlFor="target" className="body-3 text-muted">
              Target
            </label>
            <TextInput
              id="target"
              value={target ?? ""}
              onChange={e => setTarget?.(e.target.value)}
              containerClassName="!h-32 !px-8 !rounded-xs"
              hideClearButton
              style={{ fontSize: "12px" }}
            />
          </>
        )}
        <label htmlFor="hubUrl" className="body-3 text-muted">
          Hub URL
        </label>
        <TextInput
          id="hubUrl"
          value={hubUrl}
          onChange={e => setHubUrl(e.target.value)}
          containerClassName="!h-32 !px-8 !rounded-xs"
          hideClearButton
          style={{ fontSize: "12px" }}
        />
      </div>
      <div className="flex items-center justify-evenly gap-16">
        <IconButton
          aria-label="Refresh"
          icon={Refresh}
          onClick={() => {
            transport.setUrl(transport.getState().url);
          }}
          size="xs"
        />
        <IconButton
          aria-label="Repair"
          icon={Repair}
          onClick={() => setIsDialogOpen(true)}
          size="xs"
        />
      </div>
      <TransportDebug
        transportConfig={transportConfig}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
