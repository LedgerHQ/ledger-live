import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import type { LiveAppModalSize } from "@ledgerhq/live-common/wallet-api/LiveAppModal/types";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import type { LiveAppModalParams } from "~/renderer/reducers/liveAppModal";
import useLiveAppModalContentViewModel, {
  type ExtraInputs,
} from "./useLiveAppModalContentViewModel";
import useEarnLiveAppModalContentViewModel from "./useEarnLiveAppModalContentViewModel";
import type { LiveAppModalViewProps } from "./useLiveAppModalViewModel";

const DIALOG_SIZE_CLASSES: Record<LiveAppModalSize, string> = {
  medium: "w-[500px] max-w-[calc(100%-2rem)] h-[60vh] max-h-[60vh]",
  full: "w-[720px] max-w-[calc(100%-2rem)] h-[75vh] max-h-[75vh]",
};

const LiveAppModalContent = ({
  params,
  onClose,
  extraInputs,
}: {
  params: LiveAppModalParams;
  onClose: () => void;
  extraInputs: ExtraInputs;
}) => {
  const { title, description } = params;
  const { manifest, inputs, customHandlers, refreshManifests } = useLiveAppModalContentViewModel(
    params,
    onClose,
    extraInputs,
  );

  return (
    <>
      <DialogHeader
        density={description ? "expanded" : "compact"}
        title={title}
        description={description}
        onClose={onClose}
      />
      <DialogBody className="flex min-h-0 grow flex-col p-0">
        {manifest ? (
          <Web3AppWebview
            manifest={manifest}
            customHandlers={customHandlers}
            hideLoader
            inputs={inputs}
          />
        ) : (
          <NetworkErrorScreen refresh={refreshManifests} type="warning" />
        )}
      </DialogBody>
    </>
  );
};

const EarnLiveAppModalContent = ({
  params,
  onClose,
}: {
  params: LiveAppModalParams;
  onClose: () => void;
}) => {
  const { extraInputs } = useEarnLiveAppModalContentViewModel();
  return <LiveAppModalContent params={params} onClose={onClose} extraInputs={extraInputs} />;
};

const LiveAppModalView = ({ isOpen, params, onOpenChange, onClose }: LiveAppModalViewProps) => {
  if (!isOpen || !params) return null;
  const size = params.size ?? "full";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SIZE_CLASSES[size]}>
        {params.useCase === "earn" ? (
          <EarnLiveAppModalContent params={params} onClose={onClose} />
        ) : (
          <LiveAppModalContent params={params} onClose={onClose} extraInputs={null} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LiveAppModalView;
