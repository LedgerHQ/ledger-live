import React, { createContext, useContext, useState, useEffect } from "react";
import styled, { useTheme } from "styled-components/native";

import Text from "../Text/index";
import Flex from "../Layout/Flex";
import { Image } from "react-native";

type CryptoIcons = Record<string, string | null>;

interface CryptoIconsContextProps {
  cryptoIcons: CryptoIcons;
  isReady: boolean;
}

const CryptoIconsContext = createContext<CryptoIconsContextProps | undefined>(undefined);

export const useCryptoIconsContext = () => {
  const context = useContext(CryptoIconsContext);
  if (!context) {
    throw new Error("useCryptoIconsContext must be used within a CryptoIconsProvider");
  }
  return context;
};

interface CryptoIconsProviderProps {
  children: React.ReactNode;
}

export const CryptoIconsProvider: React.FC<CryptoIconsProviderProps> = ({ children }) => {
  const [cryptoIcons, setCryptoIcons] = useState<CryptoIcons>({});

  useEffect(() => {
    const url = `https://mapping-service.api.ledger.com/v1/coingecko/mapped-assets`;
    try {
      fetch(url)
        .then((response: Response) => response.json())
        .then((data) => {
          setCryptoIcons(
            data.reduce(
              (acc: any, coin: any) => ({ ...acc, [coin.ledgerId]: coin?.data?.img }),
              {},
            ),
          );
        });
    } catch (error) {
      console.log(error);
    }
  }, []);
  return (
    <CryptoIconsContext.Provider
      value={{ cryptoIcons, isReady: Object.keys(cryptoIcons).length > 1 }}
    >
      {children}
    </CryptoIconsContext.Provider>
  );
};

interface UseCryptoIcons {
  getCryptoIcon: (icon: string) => string | null;
}

export const useCryptoIcons = (): UseCryptoIcons => {
  const { cryptoIcons, isReady } = useCryptoIconsContext();
  const getCryptoIcon = (icon: string) => (isReady ? cryptoIcons?.[icon] : null);
  return { getCryptoIcon };
};

export type Props = {
  iconURL?: string;
  size?: number;
  backgroundColor?: string; // overrides background color to ensure contrast with icon color
  circleIcon?: boolean;
  tokenIconURL?: string;
  fallbackCoinName?: string;
};

type IconBoxProps = {
  children: JSX.Element;
} & Props;

type FallbackProps = {
  name?: string;
};

const Container = styled(Flex).attrs((p: { size: number }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
}))<{ size: number }>``;

const Circle = styled(Flex).attrs((p: { size: number; backgroundColor: string }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  borderRadius: "50%",
  backgroundColor: p.backgroundColor,
}))<{ size: number }>``;

const TokenContainer = styled(Flex).attrs(
  (p: { size: number; borderColor: string; backgroundColor: string }) => ({
    position: "absolute",
    bottom: "-2px",
    right: "-5px",
    alignItems: "center",
    justifyContent: "center",
    heigth: p.size,
    width: p.size,
    borderRadius: "50%",
    border: `2px solid ${p.borderColor}`,
    backgroundColor: p.backgroundColor,
    zIndex: 0,
  }),
)<{ size: number }>``;

function Fallback({ name }: FallbackProps) {
  return (
    <Text uppercase color="neutral.c70">
      {name?.slice(0, 1)}
    </Text>
  );
}

const IconBox = ({ children, backgroundColor, size = 16, tokenIconURL = "" }: IconBoxProps) => {
  const { colors } = useTheme();
  // const defaultColor = Component.DefaultColor;
  // const iconColor = disabled ? colors.neutral.c70 : color || defaultColor;
  // const contrastedColor = ensureContrast(iconColor, backgroundColor || colors.background.main);
  return (
    <Container size={size}>
      {children}
      {tokenIconURL && (
        <TokenContainer
          size={size / 2}
          borderColor={colors.background.main}
          backgroundColor={backgroundColor || colors.background.main}
        >
          <Image
            source={{ uri: tokenIconURL }}
            style={{ width: "100%", height: "100%", borderRadius: size }}
          />
        </TokenContainer>
      )}
    </Container>
  );
};

const CryptoIcon = ({
  iconURL,
  size = 16,
  backgroundColor,
  circleIcon,
  tokenIconURL,
  fallbackCoinName,
}: Props): JSX.Element => {
  const { colors } = useTheme();
  // const defaultColor = Component.DefaultColor;
  // const iconColor = disabled ? colors.neutral.c70 : color || defaultColor;
  // const contrastedColor = ensureContrast(iconColor, backgroundColor || colors.background.main);
  if (iconURL) {
    return (
      <IconBox size={size} tokenIconURL={tokenIconURL}>
        {tokenIconURL || circleIcon ? (
          <Circle backgroundColor={backgroundColor || colors.background.main} size={size}>
            <Image source={{ uri: iconURL }} style={{ width: "100%", height: "100%" }} />
          </Circle>
        ) : (
          <Image source={{ uri: iconURL }} style={{ width: "100%", height: "100%" }} />
        )}
      </IconBox>
    );
  } else {
    return <Fallback name={fallbackCoinName} />;
  }
};

export default CryptoIcon;
