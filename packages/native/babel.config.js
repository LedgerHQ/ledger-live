module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
          alias: {
            "~": "./src",
            "@ui": "./src",
            "@components": "./src/components",
            "@assets": "./src/assets",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
