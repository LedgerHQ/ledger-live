import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Box, Button, Flex, Text } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type PhotoFile,
} from "react-native-vision-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import SafeAreaView from "~/components/SafeAreaView";
import { parseMrz, parseMrzLenient, type MrzData } from "../../utils/mrzParser";

type Props = {
  onMrzDetected: (data: MrzData) => void;
  onMockData: () => void;
  onClose: () => void;
};

const SCAN_INTERVAL_MS = 2000;
const MRZ_LINE_LENGTH = 44;

/**
 * Only keep OCR blocks whose vertical center is in the bottom portion
 * of the image — matching the dotted target box position.
 * The box covers ~57%-86% of the camera height.
 */
const ROI_TOP_RATIO = 0.45;

function normalizeMrzLine(raw: string): string {
  return raw
    .replace(/[«»‹›]/g, "<")
    .replace(/\s+/g, "")
    .replace(/[kK]{2,}/g, m => "<".repeat(m.length))
    .replace(/4{2,}/g, m => "<".repeat(m.length))
    .toUpperCase();
}

function mrzScore(line: string): number {
  if (line.length < 30) return 0;
  let valid = 0;
  for (const ch of line) {
    if ((ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9") || ch === "<") valid++;
  }
  return valid / line.length;
}

function extractMrzFromLines(rawLines: string[]): string | null {
  const candidates: { normalized: string; score: number; isLine1: boolean }[] = [];

  for (const raw of rawLines) {
    const norm = normalizeMrzLine(raw);
    if (norm.length < 30) continue;
    const score = mrzScore(norm);
    if (score < 0.7) continue;

    const isLine1 = norm.startsWith("P<") || norm.startsWith("P");
    candidates.push({ normalized: norm, score, isLine1 });
  }

  const line1Candidates = candidates.filter(c => c.isLine1).sort((a, b) => b.score - a.score);
  const line2Candidates = candidates.filter(c => !c.isLine1).sort((a, b) => b.score - a.score);

  if (line1Candidates.length === 0 || line2Candidates.length === 0) return null;

  let l1 = line1Candidates[0].normalized;
  let l2 = line2Candidates[0].normalized;

  l1 = l1.length > MRZ_LINE_LENGTH ? l1.slice(0, MRZ_LINE_LENGTH) : l1.padEnd(MRZ_LINE_LENGTH, "<");
  l2 = l2.length > MRZ_LINE_LENGTH ? l2.slice(0, MRZ_LINE_LENGTH) : l2.padEnd(MRZ_LINE_LENGTH, "<");

  return l1 + l2;
}

export default function CameraScannerScreen({ onMrzDetected, onMockData, onClose }: Props) {
  const { colors } = useTheme();
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [scanning, setScanning] = useState(true);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const scanLock = useRef(false);
  const cameraRef = useRef<Camera>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hasPermission && !permissionRequested) {
      setPermissionRequested(true);
      requestPermission();
    }
  }, [hasPermission, permissionRequested, requestPermission]);

  const addLog = useCallback((msg: string) => {
    setDebugLog(prev => [...prev.slice(-29), msg]);
  }, []);

  const handleCopyLog = useCallback(() => {
    Clipboard.setString(debugLog.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [debugLog]);

  const processFrame = useCallback(async () => {
    if (scanLock.current || !cameraRef.current) return;

    const n = scanCount + 1;
    setScanCount(n);

    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto();
      const imgH = photo.height;
      const minY = imgH * ROI_TOP_RATIO;
      addLog(`#${n} photo (${photo.width}x${imgH}) ROI y>${Math.round(minY)}`);

      const result = await TextRecognition.recognize(`file://${photo.path}`);

      // Filter: only keep lines whose bounding box is in the bottom region
      const roiLines: string[] = [];
      const allLines: string[] = [];

      for (const block of result.blocks) {
        const lines = block.lines || [block];
        for (const line of lines) {
          allLines.push(line.text);
          const rawBox =
            line.frame ||
            (line as unknown as { boundingBox?: { y?: number; top?: number } }).boundingBox;
          if (rawBox) {
            const box = rawBox as unknown as { y?: number; top?: number };
            const lineY = box.y ?? box.top ?? 0;
            if (lineY >= minY) {
              roiLines.push(line.text);
            }
          } else {
            roiLines.push(line.text);
          }
        }
      }

      addLog(`#${n} OCR: ${allLines.length} total lines, ${roiLines.length} in ROI`);

      if (roiLines.length === 0) {
        addLog(`#${n} no text in target zone`);
        return;
      }

      addLog(`#${n} ROI: ${roiLines.join(" | ").slice(0, 120)}`);

      const mrz88 = extractMrzFromLines(roiLines);
      if (!mrz88) {
        // Fallback: try all lines if ROI filtering was too aggressive
        const mrz88All = extractMrzFromLines(allLines);
        if (mrz88All) {
          addLog(`#${n} found MRZ in full scan (outside ROI)`);
          addLog(`#${n} L1: ${mrz88All.slice(0, 44)}`);
          addLog(`#${n} L2: ${mrz88All.slice(44, 88)}`);
          const parsed = parseMrz(mrz88All) || parseMrzLenient(mrz88All);
          if (parsed) {
            addLog(`#${n} MRZ OK: ${parsed.documentNumber} DOB=${parsed.dateOfBirth}`);
            scanLock.current = true;
            setScanning(false);
            onMrzDetected(parsed);
          } else {
            addLog(`#${n} parseMrz failed`);
          }
        } else {
          addLog(`#${n} no MRZ candidates`);
        }
        return;
      }

      addLog(`#${n} L1: ${mrz88.slice(0, 44)}`);
      addLog(`#${n} L2: ${mrz88.slice(44, 88)}`);

      const parsed = parseMrz(mrz88) || parseMrzLenient(mrz88);
      if (parsed) {
        addLog(`#${n} MRZ OK: ${parsed.documentNumber} DOB=${parsed.dateOfBirth}`);
        scanLock.current = true;
        setScanning(false);
        onMrzDetected(parsed);
      } else {
        addLog(`#${n} parseMrz failed`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`#${n} ERROR: ${msg.slice(0, 100)}`);
    }
  }, [onMrzDetected, scanCount, addLog]);

  useEffect(() => {
    if (!scanning || !hasPermission) return;
    intervalRef.current = setInterval(processFrame, SCAN_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scanning, hasPermission, processFrame]);

  if (!hasPermission) {
    return (
      <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
        <Flex flex={1} alignItems="center" justifyContent="center" px={6} rowGap={16}>
          <ActivityIndicator size="large" color={colors.primary.c80} />
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            Requesting camera access...
          </Text>
          <Button type="default" outline onPress={onClose}>
            Enter Manually Instead
          </Button>
          <Button type="default" outline onPress={onMockData} testID="passport-mock-button">
            Continue with mock data
          </Button>
        </Flex>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
        <Flex flex={1} alignItems="center" justifyContent="center" px={6} rowGap={16}>
          <Text variant="body" color="neutral.c70" textAlign="center">
            No camera available on this device
          </Text>
          <Button type="default" outline onPress={onClose}>
            Enter Manually Instead
          </Button>
          <Button type="default" outline onPress={onMockData} testID="passport-mock-button">
            Continue with mock data
          </Button>
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <Flex flex={1} flexDirection="column" alignItems="center" px={6} pt={6}>
        <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold" mb={8}>
          Scan Passport MRZ
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" mb={12}>
          Align the two bottom lines of your passport inside the dotted box
        </Text>

        <CameraContainer borderRadius={16} overflow="hidden">
          <Camera
            ref={cameraRef}
            device={device}
            isActive={scanning}
            photo
            style={{ width: "100%", height: "100%" }}
            enableBufferCompression
          />
          <Overlay>
            <TargetBox />
          </Overlay>
        </CameraContainer>

        <DebugContainer mt={8} mb={8}>
          <ScrollView nestedScrollEnabled>
            {debugLog.length === 0 ? (
              <Text variant="tiny" color="neutral.c50">
                Scans: {scanCount} — waiting for first capture...
              </Text>
            ) : (
              debugLog.map((line, i) => (
                <Text key={i} variant="tiny" color="neutral.c50">
                  {line}
                </Text>
              ))
            )}
          </ScrollView>
          <Flex mt={4}>
            <Button size="small" type="default" outline onPress={handleCopyLog}>
              {copied ? "Copied!" : "Copy log"}
            </Button>
          </Flex>
        </DebugContainer>

        <Flex flexDirection="column" rowGap={10} width="100%">
          <Button type="main" onPress={onMockData} testID="passport-mock-button">
            Continue with mock data
          </Button>
          <Button type="default" outline onPress={onClose}>
            Enter Manually Instead
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
}

const DebugContainer = styled(Flex)`
  width: 100%;
  max-height: 160px;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 8px;
  padding: 8px;
`;

const CameraContainer = styled(Box)`
  width: 100%;
  height: 280px;
  position: relative;
`;

const Overlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 40px;
`;

const TargetBox = styled(Box)`
  width: 92%;
  height: 80px;
  border: 2px dashed rgba(255, 255, 255, 0.7);
  border-radius: 8px;
`;
