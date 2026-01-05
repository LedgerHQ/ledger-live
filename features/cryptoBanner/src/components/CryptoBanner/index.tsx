// Entry point - exports platform-specific implementation
// Desktop/Web bundlers will use index.web.tsx
// React Native bundlers will use index.native.tsx (via package.json "react-native" field)

export * from "./index.web";
