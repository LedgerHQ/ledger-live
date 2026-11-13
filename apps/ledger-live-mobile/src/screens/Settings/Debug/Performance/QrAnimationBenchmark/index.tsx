import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { copyToClipboard } from "@shared/clipboard";
import {
  NativeAnimatedQrCode,
  ReanimatedAnimatedQrCode,
  type QrAnimation,
} from "@shared/ui-animated-qr-code";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { ScreenName } from "~/const";
import { FpsPanel } from "./FpsPanel";

const SCREEN_PADDING = 16;
const GRID_GAP = 12;
// Each code sits in a white card with 8 px of padding on every side.
const CARD_PADDING = 8;
const LABEL_HEIGHT = 22;
const COPIED_FEEDBACK_MS = 1500;

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const PAYMENT_URI = `ethereum:${ADDRESS}@1/transfer?address=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&uint256=2.5e6&label=Ledger%20Wallet%20payment&message=Invoice%2042`;
const MEMO = "Ledger-Wallet-benchmark-".repeat(40);

// Module and dot counts are for error correction H, as the package encodes.
const CONTENTS = {
  address: { label: "Address", value: ADDRESS }, // 37×37 modules, ~650 dots
  uri: { label: "URI", value: PAYMENT_URI }, // 73×73, ~2,600 dots
  long: { label: "Long", value: `${PAYMENT_URI}&memo=${MEMO}`.slice(0, 420) }, // 105×105, ~5,300 dots
  huge: { label: "Huge", value: `${PAYMENT_URI}&memo=${MEMO}`.slice(0, 1000) }, // 161×161, ~12,500 dots
} as const;

// The center badge takes about a quarter of the code; CryptoIcon only takes these sizes.
const CENTER_ICON_RATIO = 0.24;
const CRYPTO_ICON_SIZES = [16, 20, 24, 32, 40, 48, 56] as const;

type Content = keyof typeof CONTENTS;
type Mode = "all" | "single";
type Implementation = "native" | "reanimated";
type Copies = "1" | "4" | "9";

const IMPLEMENTATIONS = {
  native: NativeAnimatedQrCode,
  reanimated: ReanimatedAnimatedQrCode,
} as const;

const IMPLEMENTATION_LABELS: Record<Implementation, string> = {
  native: "Native",
  reanimated: "Reanimated",
};

const ANIMATION_LABELS: Record<QrAnimation, string> = {
  shimmer: "Shimmer",
  copy: "Copy (press)",
  hover: "Hover (hold)",
};

const ANIMATIONS: readonly QrAnimation[] = ["shimmer", "copy", "hover"];

// Native and Reanimated side by side, one row per animation.
const ALL_VARIANTS = ANIMATIONS.flatMap(animation =>
  (["native", "reanimated"] as const).map(implementation => ({ implementation, animation })),
);

function getCryptoIconSize(qrSize: number) {
  const target = qrSize * CENTER_ICON_RATIO;
  return [...CRYPTO_ICON_SIZES].reverse().find(size => size <= target) ?? CRYPTO_ICON_SIZES[0];
}

type QrCellProps = Readonly<{
  implementation: Implementation;
  animation: QrAnimation;
  value: string;
  autoPlay: boolean;
  size: number;
  onPress: () => void;
  label?: string;
}>;

const QrCell = memo(function QrCell({
  implementation,
  animation,
  value,
  autoPlay,
  size,
  onPress,
  label,
}: QrCellProps) {
  const AnimatedQrCode = IMPLEMENTATIONS[implementation];
  return (
    <Box lx={{ gap: "s4" }}>
      {label ? (
        <Text typography="body3SemiBold" lx={{ color: "muted" }} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
      <View style={styles.card}>
        <AnimatedQrCode
          value={value}
          size={size}
          animation={animation}
          autoPlay={autoPlay}
          onPress={onPress}
          centerContent={
            <CryptoIcon
              ledgerId="ethereum/erc20/usd__coin"
              ticker="USDC"
              size={getCryptoIconSize(size)}
              shape="circle"
            />
          }
          testID={`qr-benchmark-${implementation}-${animation}`}
        />
      </View>
    </Box>
  );
});

function getQrSize(
  area: Readonly<{ width: number; height: number }>,
  columns: number,
  rows: number,
  withLabels: boolean,
): number {
  const cellWidth = (area.width - GRID_GAP * (columns - 1)) / columns;
  const cellHeight = (area.height - GRID_GAP * (rows - 1)) / rows - (withLabels ? LABEL_HEIGHT : 0);
  return Math.max(0, Math.floor(Math.min(cellWidth, cellHeight) - CARD_PADDING * 2));
}

type Setup = Readonly<{
  mode: Mode;
  content: Content;
  implementation: Implementation;
  animation: QrAnimation;
  copies: Copies;
  autoPlay: boolean;
}>;

type SetupParams = SettingsNavigatorStackParamList[ScreenName.DebugQrAnimationBenchmark];

function pick<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  return options.find(option => option === value) ?? fallback;
}

// Deep link query values, e.g. ledgerlive://settings/debug/qr-animation-benchmark?mode=single&content=huge
function parseSetup(params: SetupParams): Setup {
  return {
    mode: pick(params?.mode, ["all", "single"], "all"),
    content: pick(params?.content, ["address", "uri", "long", "huge"], "address"),
    implementation: pick(params?.implementation, ["native", "reanimated"], "native"),
    animation: pick(params?.animation, ANIMATIONS, "shimmer"),
    copies: pick(params?.copies, ["1", "4", "9"], "1"),
    autoPlay: params?.autoPlay === "true" || params?.autoPlay === "1",
  };
}

/** Times the mount of its children: from its first render to its first layout. */
function MeasuredGrid({
  onMounted,
  children,
}: Readonly<{ onMounted: (durationMs: number) => void; children: React.ReactNode }>) {
  const [startedAt] = useState(() => performance.now());
  const reported = useRef(false);
  const onLayout = () => {
    if (reported.current) return;
    reported.current = true;
    onMounted(Math.round(performance.now() - startedAt));
  };
  return (
    <View style={styles.grid} onLayout={onLayout}>
      {children}
    </View>
  );
}

export default function QrAnimationBenchmark({
  route,
}: StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugQrAnimationBenchmark>) {
  // A new deep link while the screen is open starts from its setup again.
  return (
    <BenchmarkScreen
      key={JSON.stringify(route.params ?? {})}
      initialSetup={parseSetup(route.params)}
    />
  );
}

// Not scrollable on purpose: a scroll view would cancel a press held on the hover animation.
function BenchmarkScreen({ initialSetup }: Readonly<{ initialSetup: Setup }>) {
  const { bottom } = useSafeAreaInsets();
  const [gridArea, setGridArea] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState(initialSetup.mode);
  const [content, setContent] = useState(initialSetup.content);
  const [implementation, setImplementation] = useState(initialSetup.implementation);
  const [animation, setAnimation] = useState(initialSetup.animation);
  const [copies, setCopies] = useState(initialSetup.copies);
  const [autoPlay, setAutoPlay] = useState(initialSetup.autoPlay);
  const [copied, setCopied] = useState(false);
  const [mount, setMount] = useState<Readonly<{ setupKey: string; durationMs: number }>>();

  const columns = mode === "all" ? 2 : Math.sqrt(Number(copies));
  const rows = mode === "all" ? ANIMATIONS.length : columns;
  const qrSize = getQrSize(gridArea, columns, rows, mode === "all");
  const { value } = CONTENTS[content];
  // A new key remounts the codes and resets the FPS readings whenever the setup changes.
  const setupKey = [mode, content, implementation, animation, copies, autoPlay].join("-");

  const onMounted = useCallback(
    (durationMs: number) => setMount({ setupKey, durationMs }),
    [setupKey],
  );

  const onGridLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setGridArea({ width: nativeEvent.layout.width, height: nativeEvent.layout.height });

  const onCopy = useCallback(async () => {
    if (await copyToClipboard(value)) setCopied(true);
  }, [value]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <View style={[styles.root, { paddingBottom: SCREEN_PADDING + bottom }]}>
      <Box lx={{ gap: "s8" }}>
        <FpsPanel
          key={setupKey}
          mountMs={mount?.setupKey === setupKey ? mount.durationMs : undefined}
        />

        <SegmentedControl
          selectedValue={content}
          onSelectedChange={next => setContent(next as Content)}
          tabLayout="fit"
          accessibilityLabel="QR content"
        >
          {Object.entries(CONTENTS).map(([key, { label }]) => (
            <SegmentedControlButton key={key} value={key}>
              {label}
            </SegmentedControlButton>
          ))}
        </SegmentedControl>

        <SegmentedControl
          selectedValue={mode}
          onSelectedChange={next => setMode(next as Mode)}
          tabLayout="fit"
          accessibilityLabel="Benchmark mode"
        >
          <SegmentedControlButton value="all">All 6</SegmentedControlButton>
          <SegmentedControlButton value="single">One variant</SegmentedControlButton>
        </SegmentedControl>

        {mode === "single" ? (
          <>
            <SegmentedControl
              selectedValue={implementation}
              onSelectedChange={next => setImplementation(next as Implementation)}
              tabLayout="fit"
              accessibilityLabel="Implementation"
            >
              <SegmentedControlButton value="native">Native</SegmentedControlButton>
              <SegmentedControlButton value="reanimated">Reanimated</SegmentedControlButton>
            </SegmentedControl>
            <SegmentedControl
              selectedValue={animation}
              onSelectedChange={next => setAnimation(next as QrAnimation)}
              tabLayout="fit"
              accessibilityLabel="Animation"
            >
              {ANIMATIONS.map(option => (
                <SegmentedControlButton key={option} value={option}>
                  {ANIMATION_LABELS[option]}
                </SegmentedControlButton>
              ))}
            </SegmentedControl>
            <SegmentedControl
              selectedValue={copies}
              onSelectedChange={next => setCopies(next as Copies)}
              tabLayout="fit"
              accessibilityLabel="Copies"
            >
              <SegmentedControlButton value="1">1 code</SegmentedControlButton>
              <SegmentedControlButton value="4">4 codes</SegmentedControlButton>
              <SegmentedControlButton value="9">9 codes</SegmentedControlButton>
            </SegmentedControl>
          </>
        ) : null}

        <Box lx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text typography="body3" lx={{ color: "base", flex: 1 }}>
            {copied ? "Copied to the clipboard" : "Auto play: a press every 1.6 s"}
          </Text>
          <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
        </Box>
      </Box>

      <View style={styles.gridArea} onLayout={onGridLayout}>
        {qrSize > 0 ? (
          <MeasuredGrid key={setupKey} onMounted={onMounted}>
            {mode === "all"
              ? ALL_VARIANTS.map(variant => (
                  <QrCell
                    key={`${variant.implementation}-${variant.animation}`}
                    {...variant}
                    value={value}
                    autoPlay={autoPlay}
                    size={qrSize}
                    onPress={onCopy}
                    label={`${IMPLEMENTATION_LABELS[variant.implementation]} · ${ANIMATION_LABELS[variant.animation]}`}
                  />
                ))
              : Array.from({ length: Number(copies) }, (_, index) => (
                  <QrCell
                    key={index}
                    implementation={implementation}
                    animation={animation}
                    value={value}
                    autoPlay={autoPlay}
                    size={qrSize}
                    onPress={onCopy}
                  />
                ))}
          </MeasuredGrid>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: SCREEN_PADDING,
    gap: GRID_GAP,
  },
  gridArea: {
    flex: 1,
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: GRID_GAP,
  },
  card: {
    padding: CARD_PADDING,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
});
