const fs = require("fs");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

/**
 * Custom esbuild plugin that processes local CSS files with PostCSS/Tailwind
 * but lets esbuild handle node_modules CSS with native loader
 */
module.exports = () => ({
  name: "postcss-tailwind",
  setup(build) {
    const postcssProcessor = postcss([tailwindcss, autoprefixer]);

    // Only intercept CSS files from src/ directory (not node_modules)
    build.onLoad({ filter: /\.css$/, namespace: "file" }, async args => {
      if (args.path.includes("node_modules")) {
        return null;
      }

      try {
        const css = await fs.promises.readFile(args.path, "utf8");
        const result = await postcssProcessor.process(css, { from: args.path });

        return {
          contents: result.css,
          loader: "css",
        };
      } catch (error) {
        return {
          errors: [{ text: error.message, location: { file: args.path } }],
        };
      }
    });
  },
});
