import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { NoAccessToCamera } from "@ledgerhq/live-common/errors";
import logger from "~/renderer/logger";

const DECODE_INTERVAL_MS = 400;
const CAMERA_TIMEOUT_MS = 20000;
// Decoding cost is per pixel, and a QR code needs far less than a camera's native resolution
const DECODE_MAX_WIDTH = 640;
const DECODE_IDEAL_HEIGHT = 480;

type UseQrCodeScannerParams = Readonly<{
  onPick: (code: string) => void;
}>;

type UseQrCodeScannerResult = Readonly<{
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: Error | null;
  isLoading: boolean;
}>;

export function useQrCodeScanner({ onPick }: UseQrCodeScannerParams): UseQrCodeScannerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keeps the decode loop stable while still calling the latest handler
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const requestStream = useCallback(async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices) throw new NoAccessToCamera();

    // getUserMedia never settles when the OS prompt is left unanswered
    return Promise.race([
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: DECODE_MAX_WIDTH },
          height: { ideal: DECODE_IDEAL_HEIGHT },
        },
      }),
      new Promise<MediaStream>((_, reject) => {
        setTimeout(() => reject(new NoAccessToCamera()), CAMERA_TIMEOUT_MS);
      }),
    ]);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const decodeFrame = () => {
      if (!context || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (!video.videoWidth || !video.videoHeight) return;

      const scale = Math.min(1, DECODE_MAX_WIDTH / video.videoWidth);
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.drawImage(video, 0, 0, width, height);

      const { data } = context.getImageData(0, 0, width, height);
      const code = jsQR(data, width, height);
      if (code?.data) onPickRef.current(code.data);
    };

    const start = async () => {
      try {
        stream = await requestStream();
      } catch (e) {
        if (cancelled) return;
        setError(new NoAccessToCamera(e instanceof Error ? e.message : undefined));
        setIsLoading(false);
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      video.srcObject = stream;
      try {
        await video.play();
      } catch (e) {
        if (cancelled) return;
        logger.error(e);
        setError(new NoAccessToCamera(e instanceof Error ? e.message : undefined));
        setIsLoading(false);
        return;
      }

      if (cancelled) return;
      setError(null);
      setIsLoading(false);
      intervalId = setInterval(decodeFrame, DECODE_INTERVAL_MS);
    };

    start();

    return () => {
      cancelled = true;
      if (intervalId !== undefined) clearInterval(intervalId);
      video.pause();
      video.srcObject = null;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [requestStream]);

  return { videoRef, error, isLoading };
}
