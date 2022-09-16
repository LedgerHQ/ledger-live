const fs = require("fs");
const path = require("path");
const glob = require("glob");
const camelcase = require("camelcase");
const svgr = require("@svgr/core").default;

const rootDir = path.join(__dirname, "..", "src");
const reactDir = path.join(rootDir, "react");
const nativeDir = path.join(rootDir, "native");

// Create folders if needed
if (!fs.existsSync(reactDir)) {
  fs.mkdirSync(reactDir);
}
if (!fs.existsSync(nativeDir)) {
  fs.mkdirSync(nativeDir);
}

const reactSvgStyledComponent = `
import styled from "styled-components";
import { system } from "styled-system";

export default styled.svg\`
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

export default styled(Svg).attrs((props:  SvgProps) => ({
  ...fillSystem(props),
}))\`\`;
`;

// Component template
function reactTemplate({ template }, _, { imports, interfaces, componentName, __, jsx, exports }) {
  const plugins = ["typescript"];
  const tpl = template.smart({ plugins });

  return tpl.ast`
    ${imports}
    import Svg from "./StyledSvg"

    type Props = { size?: number | string; color?: string; style?: object };

    ${interfaces}

    function ${componentName} ({ size = 16, color = "currentColor", style }: Props): JSX.Element {
      return ${jsx};
    }

    ${exports}
  `;
}

// Component template
function reactNativeTemplate(
  { template },
  _,
  { imports, interfaces, componentName, __, jsx, exports },
) {
  const plugins = ["typescript"];
  const tpl = template.smart({ plugins });

  return tpl.ast`
    ${imports}
    import Svg from "./StyledSvg";
    import { StyleProp, ViewStyle } from "react-native"

    type Props = { size?: number | string; color?: string; style?: StyleProp<ViewStyle> };

    ${interfaces}

    function ${componentName} ({ size = 16, color = "neutral.c100", style }: Props): JSX.Element {
      return ${jsx};
    }

    ${exports}
  `;
}

function reactNativeRTLTemplate(
  { template },
  _,
  { imports, interfaces, componentName, __, jsx, exports },
) {
  const plugins = ["typescript"];
  const tpl = template.smart({ plugins });

  return tpl.ast`
    ${imports}
    import Svg from "./StyledSvg";
    import styled from "styled-components";
    import { I18nManager, StyleProp, ViewStyle } from "react-native";

    type Props = { size?: number | string; color?: string; style?: StyleProp<ViewStyle> };

    ${interfaces}

    const rtlStyle = I18nManager.isRTL ? {transform: [{scaleX: -1}]} : {};

    function ${componentName} ({ size = 16, color = "neutral.c100", style = rtlStyle }: Props): JSX.Element {
      return ${jsx};
    }

    ${exports}
  `;
}

const convert = (svg, options, componentName, outputFile) => {
  svgr(svg, options, componentName)
    .then(result => {
      let component = result
        .replace("xlinkHref=", "href=")
        .replace(/fill=("(?!none)\S*")/g, "")
        .replace("import Svg,", "import ");

      if (!options.native)
        component = component.replace(/(<\s*\/?\s*)svg(\s*([^>]*)?\s*>)/gi, "$1Svg$2");

      fs.writeFileSync(outputFile, component, "utf-8");
    })
    .catch(e => console.error(e));
};

glob(`${rootDir}/svg/**/*.svg`, (err, icons) => {
  // Create file stubs
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

  // Extract the icon weight
  icons.forEach(icon => {
    let RTLShouldMirror = icon.endsWith('-rtl.svg')
    let iconPathCleaned = icon
    
    if(RTLShouldMirror) {
      iconPathCleaned = icon.slice(0, -8) + icon.substring(icon.length - 4, icon.length)
    }

    const parts = icon.split("/");
    const weight = parts[parts.length - 2];

    let name = camelcase([path.basename(iconPathCleaned, ".svg"), weight], {
      pascalCase: true,
    });
 
    if (!isNaN(name.charAt(0))) name = `_${name}`; // fix variable name leading with a numerical value

    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.ts`, exportString, "utf-8");
    fs.appendFileSync(`${nativeDir}/index.ts`, exportString, "utf-8");

    const svg = fs.readFileSync(icon, "utf-8");
    const options = {
      plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
      expandProps: false,
      componentName: name,
      svgProps: {
        height: "{size}",
        width: "{size}",
        fill: "{color}",
        style: "{style}",
      },
      svgoConfig: {
        plugins: [{ removeXMLNS: true, removeViewBox: false }],
      },
    };

    convert(
      svg,
      { ...options, template: reactTemplate },
      { componentName: name },
      `${reactDir}/${name}.tsx`,
    );
  
    if(!RTLShouldMirror) {
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
