const fs = require("fs");
const glob = require("glob");
const camelcase = require("camelcase");
const path = require("path");
const svgr = require("@svgr/core").default;

const rootDir = path.join(__dirname, "../");
const reactDir = `${rootDir}/react`;
const nativeDir = `${rootDir}/native`;

// Create react folder if needed
if (!fs.existsSync(reactDir)) {
  fs.mkdirSync(reactDir);
}

const reactSvgStyledComponent = `
import styled from "styled-components/native";
import { system } from "styled-system";

export default styled("svg")(
  system({
    fontSize: {
      property: "fill",
      scale: "colors",
    }
  })
);

`

const reactNativeSvgStyledComponent = `
import styled from "styled-components/native";
import { system } from "styled-system";
import Svg from "react-native-svg";

export default styled(Svg)(
  system({
    fontSize: {
      property: 'fill',
      scale: 'colors',
    }
  })
);

`;

// Component template
function reactTemplate({ template }, _, { imports, interfaces, componentName, __, jsx, exports }) {
  const plugins = ["typescript"];
  const tpl = template.smart({ plugins });

  return tpl.ast`
    ${imports}
    import Svg from "./StyledSvg"

    type Props = { size?: number | string; color?: string; };

    ${interfaces}

    function ${componentName} ({ size = 16, color = "currentColor" }: Props): JSX.Element {
      return ${jsx};
    }
    
    ${exports}
  `;
}

// Component template
function reactNativeTemplate({ template }, _, { imports, interfaces, componentName, __, jsx, exports }) {
  const plugins = ["typescript"];
  const tpl = template.smart({ plugins });

  return tpl.ast`
    ${imports}
    import Svg from "./StyledSvg";

    type Props = { size?: number | string; color?: string; };

    ${interfaces}

    function ${componentName} ({ size = 16, color = "palette.neutral.c100" }: Props): JSX.Element {
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

      if(!options.native)
        component = component.replace(/(<\s*\/?\s*)svg(\s*([^>]*)?\s*>)/gi ,'$1Svg$2')

      fs.writeFileSync(outputFile, component, "utf-8");
    })
    .catch(e => console.error(e));
};

glob(`${rootDir}/svg/**/*.svg`, (err, icons) => {
  // Create file stubs
  fs.writeFileSync(`${reactDir}/index.ts`, "", "utf-8");
  fs.writeFileSync(`${nativeDir}/index.ts`, "", "utf-8");

  fs.writeFileSync(`${reactDir}/StyledSvg.ts`, reactSvgStyledComponent, "utf-8");
  fs.writeFileSync(`${nativeDir}/StyledSvg.ts`, reactNativeSvgStyledComponent, "utf-8");
  

  // Extract the icon weight
  icons.forEach(icon => {
    const parts = icon.split("/");
    const weight = parts[parts.length - 2];

    let name = camelcase([path.basename(icon, ".svg"), weight], { pascalCase: true });

    if (!isNaN(name.charAt(0))) name = `_${name}`; // fix variable name leading with a numerical value

    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.ts`, exportString, "utf-8");
    fs.appendFileSync(`${nativeDir}/index.ts`, exportString, "utf-8");

    const svg = fs.readFileSync(icon, "utf-8");
    const options = {
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      expandProps: false,
      componentName: name,
      svgProps: {
        height: "{size}",
        width: "{size}",
        fill: "{color}",
      },
      svgoConfig: {
        plugins: [
          { removeXMLNS: true, removeViewBox: false },
        ],
      },
    };

    convert(
      svg,
      { ...options, template: reactTemplate },
      { componentName: name },
      `${reactDir}/${name}.tsx`,
    );

    convert(
      svg,
      { ...options, native: true, template: reactNativeTemplate },
      { componentName: name },
      `${nativeDir}/${name}.tsx`,
    );
  });
});
