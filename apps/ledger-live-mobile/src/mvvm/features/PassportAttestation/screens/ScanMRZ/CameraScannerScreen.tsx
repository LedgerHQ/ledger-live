import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
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
};

const SCAN_INTERVAL_MS = 2000;
const MRZ_LINE_LENGTH = 44;
const EXAMPLE_MRZ = "P<<JAMES<<SMITH<<<<<<<34677890DZRFBUT<<<<124FFP0453456<<<<34455";

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

export default function CameraScannerScreen({ onMrzDetected }: Props) {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [scanning, setScanning] = useState(true);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scanLock = useRef(false);
  const captureLock = useRef(false);
  const cameraRef = useRef<Camera>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
        justifyContent: "space-between",
      },
      content: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s8,
      },
      description: {
        marginTop: theme.spacings.s8,
      },
      cameraFrame: {
        marginTop: theme.spacings.s24,
        height: 231,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#F2E2FF",
        backgroundColor: "rgba(255,255,255,0.10)",
      },
      camera: {
        width: "100%",
        height: "100%",
      },
      cameraOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "flex-end",
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: 34,
      },
      targetBox: {
        height: 56,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#FFFFFF",
        borderRadius: 6,
      },
      cameraStatus: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: theme.spacings.s24,
      },
      cameraStatusTitle: {
        marginTop: theme.spacings.s16,
        textAlign: "center",
      },
      cameraStatusDescription: {
        marginTop: theme.spacings.s8,
        textAlign: "center",
      },
      exampleSection: {
        alignItems: "center",
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: theme.spacings.s12,
      },
      passportCard: {
        width: 288,
        height: 175,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.28)",
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 14,
      },
      passportTopRow: {
        flexDirection: "row",
      },
      portraitBox: {
        width: 85,
        height: 77,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.28)",
        alignItems: "center",
        justifyContent: "center",
      },
      portraitHead: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.35)",
      },
      portraitBody: {
        width: 30,
        height: 14,
        marginTop: 8,
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: "rgba(255,255,255,0.35)",
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
      },
      lineGroup: {
        flex: 1,
        marginLeft: 22,
        marginTop: 3,
        gap: 8,
      },
      line: {
        height: 3,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.28)",
      },
      mrzBox: {
        marginTop: 20,
        height: 43,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#FFFFFF",
        borderRadius: 6,
        justifyContent: "center",
        paddingHorizontal: 8,
      },
      mrzText: {
        color: "#FFFFFF",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "600",
        letterSpacing: 1.3,
        fontFamily: Platform.select({
          ios: "Menlo",
          android: "monospace",
          default: "monospace",
        }),
      },
      exampleHint: {
        marginTop: theme.spacings.s8,
        textAlign: "center",
        fontSize: 10,
        lineHeight: 16,
      },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    if (hasPermission) {
      setPermissionDenied(false);
      return () => {
        cancelled = true;
      };
    }

    if (!permissionRequested) {
      setPermissionRequested(true);
      void requestPermission().then(granted => {
        if (!cancelled) {
          setPermissionDenied(!granted);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [hasPermission, permissionRequested, requestPermission]);

  const processFrame = useCallback(async () => {
    if (scanLock.current || captureLock.current || !cameraRef.current) return;

    captureLock.current = true;
    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto();
      const imgH = photo.height;
      const minY = imgH * ROI_TOP_RATIO;
      const result = await TextRecognition.recognize(`file://${photo.path}`);
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

      if (roiLines.length === 0) {
        return;
      }

      const mrz88 = extractMrzFromLines(roiLines) || extractMrzFromLines(allLines);
      if (!mrz88) {
        return;
      }

      const parsed = parseMrz(mrz88) || parseMrzLenient(mrz88);
      if (parsed) {
        scanLock.current = true;
        setScanning(false);
        onMrzDetected(parsed);
      }
    } catch {
      // Keep scanning silently while OCR stabilizes.
    } finally {
      captureLock.current = false;
    }
  }, [onMrzDetected]);

  useEffect(() => {
    if (!scanning || !hasPermission || !device) return;

    intervalRef.current = setInterval(processFrame, SCAN_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [device, hasPermission, processFrame, scanning]);

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <View style={styles.root}>
        <View style={styles.content}>
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            Take a picture of your passport
          </Text>
          <Text typography="body2" lx={{ color: "muted" }} style={styles.description}>
            Scan the bar code of your passport.
          </Text>

          <View style={styles.cameraFrame}>
            {hasPermission && device ? (
              <>
                <Camera
                  ref={cameraRef}
                  device={device}
                  isActive={scanning}
                  photo
                  style={styles.camera}
                  enableBufferCompression
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.targetBox} />
                </View>
              </>
            ) : (
              <View style={styles.cameraStatus}>
                {!permissionDenied && !hasPermission ? (
                  <>
                    <ActivityIndicator size="large" color="white" />
                    <Text
                      typography="body2"
                      lx={{ color: "base" }}
                      style={styles.cameraStatusTitle}
                    >
                      Requesting camera access...
                    </Text>
                  </>
                ) : permissionDenied ? (
                  <>
                    <Text
                      typography="body2SemiBold"
                      lx={{ color: "base" }}
                      style={styles.cameraStatusTitle}
                    >
                      Camera access is required
                    </Text>
                    <Text
                      typography="body2"
                      lx={{ color: "muted" }}
                      style={styles.cameraStatusDescription}
                    >
                      Enable camera access in your device settings to scan the passport MRZ.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      typography="body2SemiBold"
                      lx={{ color: "base" }}
                      style={styles.cameraStatusTitle}
                    >
                      Camera unavailable
                    </Text>
                    <Text
                      typography="body2"
                      lx={{ color: "muted" }}
                      style={styles.cameraStatusDescription}
                    >
                      No camera is available on this device to scan the passport MRZ.
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.exampleSection}>
          <View style={styles.passportCard}>
            <View style={styles.passportTopRow}>
              <View style={styles.portraitBox}>
                <View style={styles.portraitHead} />
                <View style={styles.portraitBody} />
              </View>

              <View style={styles.lineGroup}>
                <View style={[styles.line, { width: 128 }]} />
                <View style={[styles.line, { width: 90 }]} />
                <View style={[styles.line, { width: 60 }]} />
                <View style={[styles.line, { width: 60 }]} />
                <View style={[styles.line, { width: 128 }]} />
              </View>
            </View>

            <View style={styles.mrzBox}>
              <Text
                typography="body3"
                lx={{ color: "base" }}
                style={styles.mrzText}
                numberOfLines={2}
              >
                {EXAMPLE_MRZ}
              </Text>
            </View>
          </View>

          <Text typography="body3" lx={{ color: "muted" }} style={styles.exampleHint}>
            Scan the bottom part of your passport
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
