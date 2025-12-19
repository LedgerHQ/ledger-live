import { Image, StyleSheet, View } from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { SvgXml } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";

type Props = {
  size?: number;
  name: string;
  url?: string;
};

/**
 * Sanitizes SVG content by removing elements unsupported by react-native-svg.
 * Common issues: XML declarations, DOCTYPE, comments, and Adobe Illustrator artifacts.
 */
const sanitizeSvg = (svg: string): string =>
  svg
    .replace(/<\?xml[^?]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/enable-background="[^"]*"/g, "")
    .replace(/xml:space="[^"]*"/g, "")
    .trim();

const isSvgUrl = (url: string): boolean => {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".svg");
  } catch {
    return url.toLowerCase().endsWith(".svg");
  }
};

const fetchSvg = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const content = await res.text();
  return sanitizeSvg(content);
};

/**
 * Fetches and sanitizes remote SVG content with caching via react-query.
 */
const useSanitizedSvg = (url: string | undefined) => {
  return useQuery({
    queryKey: ["svg-content", url],
    queryFn: () => fetchSvg(url!),
    enabled: !!url,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 1,
  });
};

const ValidatorImage = ({ size = 64, url, name }: Props) => {
  const [rasterError, setRasterError] = useState(false);
  const [rasterLoaded, setRasterLoaded] = useState(false);

  const isSvg = url ? isSvgUrl(url) : false;
  const svg = useSanitizedSvg(isSvg ? url : undefined);

  useEffect(() => {
    setRasterError(false);
    setRasterLoaded(false);
  }, [url]);

  const onRasterLoad = useCallback(() => setRasterLoaded(true), []);
  const onRasterError = useCallback(() => setRasterError(true), []);

  const isLoaded = isSvg ? !!svg.data : rasterLoaded;
  const hasError = isSvg ? svg.isError : rasterError;
  const showFallback = !url || hasError || !isLoaded;

  return (
    <Circle crop size={size}>
      {showFallback && <FirstLetterIcon label={name || "-"} round size={size} fontSize={24} />}

      {url && !hasError && (
        <>
          {isSvg && svg.data && (
            <View style={styles.imageContainer}>
              <SvgXml xml={svg.data} width={size} height={size} />
            </View>
          )}

          {!isSvg && (
            <View style={rasterLoaded ? styles.imageContainer : styles.hidden}>
              <Image
                source={{ uri: url }}
                style={{ width: size, height: size }}
                onLoad={onRasterLoad}
                onError={onRasterError}
              />
            </View>
          )}
        </>
      )}
    </Circle>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    position: "absolute",
  },
  hidden: {
    position: "absolute",
    opacity: 0,
  },
});

export default ValidatorImage;
