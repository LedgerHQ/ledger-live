const fs = require("fs");
const path = require("path");
const glob = require("glob");
const camelcase = require("camelcase");
const { transform } = require("@svgr/core");
const { loadSvgrPlugin } = require("./loadSvgrPlugin");

const jsxPlugin = loadSvgrPlugin("@svgr/plugin-jsx");

const rootDir = path.join(__dirname, "..", "src");
const reactDir = path.join(rootDir, "react");
const nativeDir = path.join(rootDir, "native");

if (!fs.existsSync(reactDir)) {
  fs.mkdirSync(reactDir);
}
if (!fs.existsSync(nativeDir)) {
  fs.mkdirSync(nativeDir);
}

const reactSvgStyledComponent = `
import styled from "styled-components";
import { system } from "styled-system";

export default styled.svg.withConfig({
  shouldForwardProp: (prop) => true,
})\`
  \${system({
    color: {
      property: "color",
      scale: "colors",
    }
  })}
\`;
`;

const reactNativeSvgStyledComponent = `
import styled from "styled-components/native";
import { system } from "styled-system";
import Svg, { SvgProps } from "react-native-svg";

const fillSystem = system({
  color: {
    property: "color",
    scale: "colors",
  },
});

const StyledSvg = styled(Svg).attrs<SvgProps & { xmlns?: string }>((props) => ({
  ...fillSystem(props),
  xmlns: props.xmlns || "http://www.w3.org/2000/svg",
}))\`\`;

export default StyledSvg;
`;

const availableSizesSource = `export type SizeKey = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface SizeData {
  size: number;
  stroke: number;
}

export interface AvailableSizes {
  XS: SizeData;
  S: SizeData;
  M: SizeData;
  L: SizeData;
  XL: SizeData;
  XXL: SizeData;
}

export const availableSizes: AvailableSizes = {
  XS: { size: 16, stroke: 1.3 },
  S: { size: 20, stroke: 1.5 },
  M: { size: 24, stroke: 1.8 },
  L: { size: 40, stroke: 2.2 },
  XL: { size: 48, stroke: 2.5 },
  XXL: { size: 70, stroke: 2.8 },
};
`;

function reactTemplate({ imports, interfaces, componentName, jsx, exports }, { tpl }) {
  return tpl`
    ${imports}
    import Svg from "./StyledSvg"
    import { availableSizes, type SizeKey } from "./availableSizes"
    type Props = { size?: SizeKey; color?: string; style?: object };

    ${interfaces}

    function ${componentName} ({ size = "M", color = "currentColor", style }: Props): React.JSX.Element {
      const strokeWidth = availableSizes[size]?.stroke
      const appliedSize = availableSizes[size]?.size

      return ${jsx};
    }
    ${exports}
  `;
}

function reactNativeTemplate({ imports, interfaces, componentName, jsx, exports }, { tpl }) {
  return tpl`
    ${imports}
    import Svg from "./StyledSvg";
    import { availableSizes, type SizeKey } from "./availableSizes"

    import { StyleProp, ViewStyle } from "react-native"

    type Props = { size?: SizeKey; color?: string; style?: StyleProp<ViewStyle> };

    ${interfaces}

    function ${componentName} ({ size = "M", color = "neutral.c100", style }: Props): React.JSX.Element {
        const strokeWidth = availableSizes[size]?.stroke
        const appliedSize = availableSizes[size]?.size

        return ${jsx};
    }
    ${exports}
  `;
}

function reactNativeRTLTemplate({ imports, interfaces, componentName, jsx, exports }, { tpl }) {
  return tpl`
    ${imports}
    import Svg from "./StyledSvg";
    import { availableSizes, type SizeKey } from "./availableSizes"
    import styled from "styled-components";
    import { I18nManager, StyleProp, ViewStyle } from "react-native";
    type Props = { size?: SizeKey; color?: string; style?: StyleProp<ViewStyle> };
    ${interfaces}

    const rtlStyle = I18nManager.isRTL ? {transform: [{scaleX: -1}]} : {};
    function ${componentName} ({size = "M", color = "neutral.c100", style = rtlStyle }: Props): React.JSX.Element {
      const strokeWidth = availableSizes[size]?.stroke
      const appliedSize = availableSizes[size]?.size

      return ${jsx};
    }
    ${exports}
  `;
}

const convert = (svg, options, componentName, outputFile) => {
  transform(svg, options, componentName)
    .then(result => {
      let component = result
        .replace("xlinkHref=", "href=")
        .replace("import Svg,", "import ")
        .replace(/fill="white"/g, 'fill="currentColor"')
        .replace(/stroke="white"/g, 'stroke="currentColor"')
        .replace(/<path/g, '<path vectorEffect="non-scaling-stroke"')
        .replace(/<Path/g, '<Path vectorEffect="non-scaling-stroke"')
        .replace(/id={(\d+)}/g, 'id={"$1"}');

      if (!options.native) {
        component = component.replace(/(<\s*\/?\s*)svg(\s*([^>]*)?\s*>)/gi, "$1Svg$2");
        component = component.replace(/strokeWidth={(\d+(\.\d+)?)}/g, "strokeWidth={strokeWidth}");
      }
      component = component.replace(/strokeWidth={(\d+(\.\d+)?)}/g, "strokeWidth={strokeWidth}");
      fs.writeFileSync(outputFile, component, "utf-8");
    })
    .catch(e => console.error(e));
};

glob(`${rootDir}/svg/**/*.svg`, (err, icons) => {
  fs.writeFileSync(`${reactDir}/index.ts`, "", {
    flag: "w",
    encoding: "utf-8",
  });
  fs.writeFileSync(`${nativeDir}/index.ts`, "", {
    flag: "w",
    encoding: "utf-8",
  });

  fs.writeFileSync(`${reactDir}/StyledSvg.ts`, reactSvgStyledComponent, "utf-8");
  fs.writeFileSync(`${nativeDir}/StyledSvg.ts`, reactNativeSvgStyledComponent, "utf-8");
  fs.writeFileSync(`${reactDir}/availableSizes.ts`, availableSizesSource, "utf-8");
  fs.writeFileSync(`${nativeDir}/availableSizes.ts`, availableSizesSource, "utf-8");

  icons.forEach(icon => {
    let RTLShouldMirror = icon.endsWith("-rtl.svg");
    let iconPathCleaned = icon;

    if (RTLShouldMirror) {
      iconPathCleaned = icon.slice(0, -8) + icon.substring(icon.length - 4, icon.length);
    }

    let name = camelcase([path.basename(iconPathCleaned, ".svg")], {
      pascalCase: true,
    });

    if (/^\d/.test(name)) name = `_${name}`;

    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.ts`, exportString, "utf-8");
    fs.appendFileSync(`${nativeDir}/index.ts`, exportString, "utf-8");

    const svg = fs.readFileSync(icon, "utf-8");

    const options = {
      plugins: [jsxPlugin],
      expandProps: false,
      componentName: name,
      prettier: false,
      typescript: true,
      jsxRuntime: "classic",
      runtimeConfig: false,
      svgo: false,
      svgProps: {
        height: "{appliedSize}",
        width: "{appliedSize}",
        color: "{color}",
        style: "{style}",
      },
    };

    convert(
      svg,
      { ...options, template: reactTemplate },
      { componentName: name },
      `${reactDir}/${name}.tsx`,
    );

    if (!RTLShouldMirror) {
      convert(
        svg,
        { ...options, native: true, template: reactNativeTemplate },
        { componentName: name },
        `${nativeDir}/${name}.tsx`,
      );
    } else {
      convert(
        svg,
        { ...options, native: true, template: reactNativeRTLTemplate },
        { componentName: name },
        `${nativeDir}/${name}.tsx`,
      );
    }
  });
});
