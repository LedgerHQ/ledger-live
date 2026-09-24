const fs = require("fs");
const path = require("path");
const glob = require("glob");
const camelcase = require("camelcase");
const { transform } = require("@svgr/core");
const { loadSvgrPlugin } = require("./loadSvgrPlugin");

const jsxPlugin = loadSvgrPlugin("@svgr/plugin-jsx");
const svgoPlugin = loadSvgrPlugin("@svgr/plugin-svgo");

const rootDir = path.join(__dirname, "..", "src");
const reactDir = path.join(rootDir, "reactLegacy");
const nativeDir = path.join(rootDir, "nativeLegacy");

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
    fill: {
      property: "fill",
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
  fill: {
    property: "fill",
    scale: "colors",
  },
});

const StyledSvg = styled(Svg).attrs<SvgProps &  { xmlns?: string }>((props) => ({
  ...fillSystem(props),
  xmlns: props.xmlns || "http://www.w3.org/2000/svg",
}))\`\`;

export default StyledSvg;
`;

function reactTemplate({ imports, interfaces, componentName, jsx, exports }, { tpl }) {
  return tpl`
    ${imports}
    import Svg from "./StyledSvg"
    type Props = { size?: number | string; color?: string; style?: object };
    ${interfaces}
    function ${componentName} ({ size = 16, color = "currentColor", style }: Props): React.JSX.Element {
      return ${jsx};
    }
    ${exports}
  `;
}

function reactNativeTemplate({ imports, interfaces, componentName, jsx, exports }, { tpl }) {
  return tpl`
    ${imports}
    import Svg from "./StyledSvg";

    import { StyleProp, ViewStyle } from "react-native"

    type Props = { size?: number | string; color?: string; style?: StyleProp<ViewStyle> };

    ${interfaces}
    function ${componentName} ({ size = 16, color = "neutral.c100", style }: Props): React.JSX.Element {
      return ${jsx};
    }
    ${exports}
  `;
}

function reactNativeRTLTemplate({ imports, interfaces, componentName, jsx, exports }, { tpl }) {
  return tpl`
    ${imports}
    import Svg from "./StyledSvg";
    import styled from "styled-components";
    import { I18nManager, StyleProp, ViewStyle } from "react-native";
    type Props = { size?: number | string; color?: string; style?: StyleProp<ViewStyle> };
    ${interfaces}
    const rtlStyle = I18nManager.isRTL ? {transform: [{scaleX: -1}]} : {};
    function ${componentName} ({ size = 16, color = "neutral.c100", style = rtlStyle }: Props): React.JSX.Element {
      return ${jsx};
    }
    ${exports}
  `;
}

const convert = (svg, options, componentName, outputFile, removeFills) => {
  transform(svg, options, componentName)
    .then(result => {
      let component = result.replace("xlinkHref=", "href=").replace("import Svg,", "import ");

      if (!removeFills) component = component.replace(/fill=("(?!none)\S*")/g, "");
      if (!options.native) {
        component = component.replace(/(<\s*\/?\s*)svg(\s*([^>]*)?\s*>)/gi, "$1Svg$2");
      }

      fs.writeFileSync(outputFile, component, "utf-8");
    })
    .catch(e => console.error(e));
};

glob(`${rootDir}/svg-legacy/**/*.svg`, (err, icons) => {
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

  icons.forEach(icon => {
    let RTLShouldMirror = icon.endsWith("-rtl.svg");
    let iconPathCleaned = icon;

    if (RTLShouldMirror) {
      iconPathCleaned = icon.slice(0, -8) + icon.substring(icon.length - 4, icon.length);
    }

    const parts = icon.split("/");
    const weight = parts[parts.length - 2];

    let name = camelcase([path.basename(iconPathCleaned, ".svg"), weight], {
      pascalCase: true,
    });

    if (/^\d/.test(name)) name = `_${name}`;

    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.ts`, exportString, "utf-8");
    fs.appendFileSync(`${nativeDir}/index.ts`, exportString, "utf-8");

    const svg = fs.readFileSync(icon, "utf-8");
    const options = {
      plugins: [svgoPlugin, jsxPlugin],
      expandProps: false,
      componentName: name,
      prettier: false,
      typescript: true,
      jsxRuntime: "classic",
      runtimeConfig: false,
      svgProps: {
        height: "{size}",
        width: "{size}",
        fill: "{color}",
        style: "{style}",
      },
      svgoConfig: {
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          "removeXMLNS",
        ],
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
