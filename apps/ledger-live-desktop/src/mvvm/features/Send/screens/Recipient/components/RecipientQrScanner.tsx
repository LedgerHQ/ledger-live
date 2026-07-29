import React from "react";
import { Spinner, Spot } from "@ledgerhq/lumen-ui-react";
import { QrCodeScanner } from "@ledgerhq/lumen-ui-react/symbols";
import TranslatedError from "~/renderer/components/TranslatedError";
import { useQrCodeScanner } from "../hooks/useQrCodeScanner";

type RecipientQrScannerProps = Readonly<{
  onPick: (code: string) => void;
}>;

const TARGET_SIZE = 176;
const targetStyle = { width: TARGET_SIZE, height: TARGET_SIZE } as const;

/**
 * Blurs the frame in a single layer, then punches the target area out of it. One surface keeps
 * the blur uniform, where several adjacent ones each sample only their own backdrop and seam
 * along the edges they share.
 */
const blurCutoutStyle = {
  maskImage: "linear-gradient(#000, #000), linear-gradient(#000, #000)",
  maskSize: `100% 100%, ${TARGET_SIZE}px ${TARGET_SIZE}px`,
  maskPosition: "center, center",
  maskRepeat: "no-repeat",
  maskComposite: "exclude",
} as const;

export function RecipientQrScanner({ onPick }: RecipientQrScannerProps) {
  const { videoRef, error, isLoading } = useQrCodeScanner({ onPick });

  return (
    <div className="px-16 pb-16" data-testid="send-recipient-qr-scanner">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-muted">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-24">
            <Spot appearance="icon" icon={QrCodeScanner} size={56} />
            <p className="body-2 text-center text-muted">
              <TranslatedError error={error} />
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size={24} />
              </div>
            ) : (
              <>
                <div
                  className="absolute inset-0 bg-black/20 backdrop-blur-md"
                  style={blurCutoutStyle}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={targetStyle}
                >
                  <div className="absolute top-0 left-0 size-24 rounded-tl-xs border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 size-24 rounded-tr-xs border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 size-24 rounded-bl-xs border-b-2 border-l-2 border-white" />
                  <div className="absolute right-0 bottom-0 size-24 rounded-br-xs border-r-2 border-b-2 border-white" />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
