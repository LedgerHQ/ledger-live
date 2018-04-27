const fs = require("fs");
const glob = require("glob");
const camelcase = require("camelcase");
const path = require("path");
const svgr = require("svgr").default;

const rootDir = path.join(__dirname, "../src/data/icons");
const reactDir = `${rootDir}/react`;
const reactNativeDir = `${rootDir}/reactNative`;

if (!fs.existsSync(reactDir)) {
  fs.mkdirSync(reactDir);
}

if (!fs.existsSync(reactNativeDir)) {
  fs.mkdirSync(reactNativeDir);
}

const reactTemplate = () => (code, state) => `
//@flow
import React from "react";

type Props = {
  size: number,
  color: string
};

export default function ${
  state.componentName
}({ size, color = "currentColor" }: Props) {
  return (
    ${code}
  );
}`;

const reactNativeTemplate = () => {
  const componentsToList = components =>
    [...components].filter(component => component !== "Svg").join(", ");

  const logUnsupportedComponents = components => {
    if (!components.size) return "";
    return `
// SVGR has dropped some elements not supported by react-native-svg: ${componentsToList(
      components
    )}
`;
  };

  return (code, state) => {
    const {
      reactNativeSvgReplacedComponents = new Set(),
      unsupportedComponents = new Set()
    } = state;

    return `
//@flow
import React from "react";
import Svg, { ${componentsToList(
      reactNativeSvgReplacedComponents
    )} } from 'react-native-svg';
${logUnsupportedComponents(unsupportedComponents)}

type Props = {
  size: number,
  color: string
};


export default function ${state.componentName}({ size, color }: Props) {
  return (
    ${code}
  );
}`;
  };
};

const convert = (svg, options, outputFile) => {
  svgr(svg, options).then(result => {
    const component = result
      .replace(/(width|height)=("1em")/g, "$1={size}")
      .replace(/fill=("(?!none)\S*")/g, "fill={color}")
      .replace("xlinkHref=", "href=");

    fs.writeFileSync(outputFile, component, "utf-8");
  });
};

glob(`${rootDir}/svg/*.svg`, (err, icons) => {
  fs.writeFileSync(`${reactDir}/index.js`, "", "utf-8");
  fs.writeFileSync(`${reactNativeDir}/index.js`, "", "utf-8");

  icons.forEach(i => {
    const name = camelcase(path.basename(i, ".svg"));
    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.js`, exportString, "utf-8");
    fs.appendFileSync(`${reactNativeDir}/index.js`, exportString, "utf-8");

    const svg = fs.readFileSync(i, "utf-8");
    const options = {
      icon: true,
      expandProps: false,
      componentName: name
    };

    convert(
      svg,
      { ...options, template: reactTemplate },
      `${reactDir}/${name}.js`
    );

    convert(
      svg,
      {
        ...options,
        native: true,
        template: reactNativeTemplate
      },
      `${reactNativeDir}/${name}.js`
    );
  });
});
