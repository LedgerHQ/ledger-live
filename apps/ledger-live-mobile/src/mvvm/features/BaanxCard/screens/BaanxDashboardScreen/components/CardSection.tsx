import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, View, StyleSheet, useWindowDimensions, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import Clipboard from "@react-native-clipboard/clipboard";
import { useTranslation } from "~/context/Locale";
import { Text, Box } from "@ledgerhq/lumen-ui-rnative";
import { Copy, Eye, EyeCross, LedgerLogo, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getSelectedFiatSurface } from "../fiatCurrencySelection";
import type { CardData } from "../mockData";
import cardFrontBg from "./card-front-bg.png";

const SCREEN_HORIZONTAL_PADDING = 28;
const CREDIT_CARD_ASPECT = 1.586;
const FLIP_DURATION = 500;
const COPY_FEEDBACK_MS = 1500;

function isLightForeground(hex: string): boolean {
  const n = hex.replace("#", "");
  if (n.length !== 6) return true;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

function lightenHex(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.min(255, parseInt(n.slice(0, 2), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(n.slice(2, 4), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(n.slice(4, 6), 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

type Palette = {
  cardBg: string;
  gradientColors: string[];
  fg: string;
  fgMuted: string;
  fgMutedOpacity: number;
  border: string;
  btnBg: string;
  logoColor: "white" | "black";
};

function usePalette(selectedCurrency: string): Palette {
  const { theme } = useTheme();
  const surface = useMemo(
    () => getSelectedFiatSurface(theme, selectedCurrency),
    [theme, selectedCurrency],
  );
  return useMemo(() => {
    const { backgroundColor: cardBg, foregroundColor: fg } = surface;
    const light = isLightForeground(fg);
    return {
      cardBg,
      gradientColors: [cardBg, lightenHex(cardBg, 0.25)],
      fg,
      fgMuted: fg,
      fgMutedOpacity: 0.5,
      border: light ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)",
      btnBg: light ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
      logoColor: light ? "white" : "black",
    };
  }, [surface]);
}

const MastercardLogo = memo(function MastercardLogo() {
  return (
    <Svg width={48} height={30} viewBox="0 0 48 30">
      <Circle cx={15} cy={15} r={14} fill="#EB001B" opacity={0.8} />
      <Circle cx={33} cy={15} r={14} fill="#F79E1B" opacity={0.8} />
    </Svg>
  );
});

const CardFront = memo(function CardFront() {
  return (
    <View style={styles.face}>
      <Image source={cardFrontBg} style={styles.cardBgImage} resizeMode="cover" />
      <MastercardLogo />
    </View>
  );
});

interface BackProps {
  readonly card: CardData;
  readonly palette: Palette;
  readonly onFlip: () => void;
}

const CardBack = memo(function CardBack({ card, palette, onFlip }: BackProps) {
  const { t } = useTranslation();
  const [copiedPan, setCopiedPan] = useState(false);
  const [copiedCvv, setCopiedCvv] = useState(false);
  const panTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cvvTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleCopyPan = useCallback(() => {
    Clipboard.setString(card.panFull.replace(/\s+/g, ""));
    setCopiedPan(true);
    clearTimeout(panTimerRef.current);
    panTimerRef.current = setTimeout(() => setCopiedPan(false), COPY_FEEDBACK_MS);
  }, [card.panFull]);

  const handleCopyCvv = useCallback(() => {
    Clipboard.setString(card.cvv);
    setCopiedCvv(true);
    clearTimeout(cvvTimerRef.current);
    cvvTimerRef.current = setTimeout(() => setCopiedCvv(false), COPY_FEEDBACK_MS);
  }, [card.cvv]);

  return (
    <View style={styles.backFace}>
      <Pressable
        onPress={onFlip}
        style={[styles.overlayBtn, styles.backFlipBtn, { backgroundColor: palette.btnBg }]}
        hitSlop={12}
      >
        <EyeCross size={20} color={palette.logoColor} />
      </Pressable>
      <View style={styles.backDetailsGroup}>
        <Pressable onPress={handleCopyPan} style={styles.backFieldCol}>
          <Text
            typography="body3"
            style={{ color: palette.fgMuted, opacity: palette.fgMutedOpacity }}
          >
            {t("baanxCard.dashboard.card.cardNumber")}
          </Text>
          <View style={styles.backValueRow}>
            <Text typography="body2" style={{ color: palette.fg }}>
              {card.panFull}
            </Text>
            <Copy size={16} color={copiedPan ? "white" : palette.logoColor} />
          </View>
        </Pressable>

        <View style={styles.backBottomRow}>
          <View style={styles.backFieldCol}>
            <Text
              typography="body3"
              style={{ color: palette.fgMuted, opacity: palette.fgMutedOpacity }}
            >
              {t("baanxCard.dashboard.card.expiry")}
            </Text>
            <Text typography="body2" style={{ color: palette.fg }}>
              {card.expiryDate}
            </Text>
          </View>
          <Pressable onPress={handleCopyCvv} style={styles.backFieldCol}>
            <Text
              typography="body3"
              style={{ color: palette.fgMuted, opacity: palette.fgMutedOpacity }}
            >
              {t("baanxCard.dashboard.card.cvv")}
            </Text>
            <View style={styles.backValueRow}>
              <Text typography="body2" style={{ color: palette.fg }}>
                {card.cvv}
              </Text>
              <Copy size={16} color={copiedCvv ? "white" : palette.logoColor} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

interface Props {
  readonly card: CardData;
  readonly selectedCurrency: string;
}

const CardSection = memo(function CardSection({ card, selectedCurrency }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const palette = usePalette(selectedCurrency);

  const flipProgress = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    const next = isFlipped ? 0 : 1;
    flipProgress.value = withTiming(next, {
      duration: FLIP_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipProgress]);

  const cardWidth = Math.max(0, windowWidth - SCREEN_HORIZONTAL_PADDING * 2);
  const minHeight = cardWidth > 0 ? cardWidth / CREDIT_CARD_ASPECT : 200;

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipProgress.value, [0, 0.15, 0.35, 1], [1, 1, 0, 0]);
    const scale = interpolate(flipProgress.value, [0, 0.15, 0.35, 1], [1, 0.92, 0.8, 0.8]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale }],
      opacity,
    };
  });

  const cardShellStyle = useMemo(
    () => [styles.card, { minHeight, borderColor: palette.border }],
    [minHeight, palette.border],
  );

  const btnStyle = useMemo(
    () => [styles.overlayBtn, { backgroundColor: palette.btnBg }],
    [palette.btnBg],
  );

  return (
    <View style={styles.sectionOnTop} pointerEvents="box-none">
      <Box lx={{ gap: "s12", paddingVertical: "s8" }}>
        <View style={{ minHeight }}>
          <Pressable onPress={handleFlip} style={StyleSheet.absoluteFill}>
            <Animated.View style={[cardShellStyle, styles.faceAbsolute, frontAnimatedStyle]}>
              <LinearGradient
                colors={palette.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientFill}
              >
                <CardFront />
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[cardShellStyle, styles.faceAbsolute, backAnimatedStyle]}>
              <LinearGradient
                colors={palette.gradientColors}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradientFill}
              >
                <CardBack card={card} palette={palette} onFlip={handleFlip} />
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <Animated.View
            style={[styles.overlayContainer, overlayAnimatedStyle]}
            pointerEvents="box-none"
          >
            <View style={styles.overlayColumn} pointerEvents="box-none">
              <LedgerLogo size={24} color={palette.logoColor} />

              <View style={styles.buttonsGroup}>
                <Pressable onPress={() => {}} style={btnStyle} hitSlop={12}>
                  <Settings size={20} color={palette.logoColor} />
                </Pressable>
                <Pressable onPress={handleFlip} style={btnStyle} hitSlop={12}>
                  <Eye size={20} color={palette.logoColor} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionOnTop: {
    zIndex: 2,
    elevation: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
    overflow: "hidden",
  },
  faceAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientFill: {
    flex: 1,
  },
  face: {
    flex: 1,
    padding: 22,
    justifyContent: "space-between",
  },
  cardBgImage: {
    position: "absolute",
    top: "-25%",
    left: "-25%",
    width: "150%",
    height: "150%",
    opacity: 0.6,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 12,
  },
  overlayColumn: {
    position: "absolute",
    top: 18,
    right: 18,
    bottom: 18,
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonsGroup: {
    gap: 10,
    alignItems: "center",
  },
  overlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backFace: {
    flex: 1,
    padding: 12,
    justifyContent: "flex-end",
  },
  backFlipBtn: {
    position: "absolute",
    bottom: 18,
    right: 18,
    zIndex: 1,
  },
  backDetailsGroup: {
    gap: 12,
  },
  backFieldCol: {
    gap: 2,
  },
  backValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBottomRow: {
    flexDirection: "row",
    gap: 22,
  },
});

export default CardSection;
