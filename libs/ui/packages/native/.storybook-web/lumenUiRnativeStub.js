'use strict';
// Stub for @ledgerhq/lumen-ui-rnative in the web Storybook context.
// The full package pulls in @gorhom/bottom-sheet, @sbaiahmed1/react-native-blur,
// expo-haptics, etc. — none of which are web-compatible.
// Only the symbols consumed by @ledgerhq/crypto-icons/native need to render.
const React = require('react');

const noop = () => null;
const passthrough = ({ children } = {}) => children ?? null;

const Box = ({ children, style }) => React.createElement('div', { style }, children);
const Text = ({ children, style }) => React.createElement('span', { style }, children);
const Skeleton = ({ style }) => React.createElement('div', { style: { backgroundColor: '#e0e0e0', ...style } });
const MediaImage = ({ src, size, shape, alt, testID }) =>
  src
    ? React.createElement('img', {
        src,
        alt,
        'data-testid': testID,
        style: { width: size, height: size, borderRadius: shape === 'circle' ? '50%' : 4, display: 'block' },
      })
    : null;
const DotSymbol = ({ children }) =>
  React.createElement('div', { style: { position: 'relative', display: 'inline-flex' } }, children);

const mediaImageDotSizeMap = { 12: 4, 16: 4, 20: 4, 24: 4, 32: 6, 40: 8, 48: 8, 56: 8, 64: 8 };
const mediaImageDotIconSizeMap = mediaImageDotSizeMap;

module.exports = {
  Box,
  Text,
  Skeleton,
  MediaImage,
  DotSymbol,
  mediaImageDotSizeMap,
  mediaImageDotIconSizeMap,
  ThemeProvider: passthrough,
  DotIcon: passthrough,
  BottomSheetModalProvider: passthrough,
  BottomSheetVirtualizedList: noop,
  BottomSheetHeader: noop,
  Banner: noop,
};
