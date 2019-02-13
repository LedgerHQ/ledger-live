const fs = require("fs");
const glob = require("glob");
const camelcase = require("camelcase");
const path = require("path");
const svgr = require("svgr").default;

const rootDir = path.join(__dirname, "../src/partners/icons");
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
  width: number
};

const ${state.componentName} = ({ width }: Props) => (
    ${code}
);
export default ${state.componentName};`;

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
  width: number,
};


const ${state.componentName} = ({ width = 150 }: Props) => (
    ${code}
);
export default ${state.componentName};`;
  };
};

const convert = (svg, options, outputFile) => {
  svgr(svg, options).then(result => {
    const viewboxRegex = /(viewBox="0 0 ([0-9]+\.?[0-9]*)+ ([0-9]+\.?[0-9]*)+")/;
    const component = result
      .replace(/width=".+"/g, "")   //Cleanup width/height, use viewbox
      .replace(/height=".+"/g, "")
      .replace(viewboxRegex, "$1 width={width} height={width/$2*$3}")
      .replace("xlinkHref=", "href=");

    fs.writeFileSync(outputFile, component, "utf-8");
  });
};

const indexTemplate = (partners) => `//@flow

${partners.map(partner=>`import ${partner} from "./${partner}";`).join("\n")}

export default {
${partners.map(partner=>`\t${partner}: ${partner},`).join("\n")}
};
`;


glob(`${rootDir}/svg/*.svg`, (err, icons) => {
  const names = [];

  icons.forEach(i => {
    const name = camelcase(path.basename(i, ".svg"));
    names.push(name);

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

  fs.writeFileSync(`${reactDir}/index.js`, indexTemplate(names), "utf-8");
  fs.writeFileSync(`${reactNativeDir}/index.js`, indexTemplate(names), "utf-8");
});
