const fs = require("fs");
const path = require("path");
const glob = require("glob");
const camelcase = require("camelcase");
const svgr = require("@svgr/core").default;

const rootDir = path.join(__dirname, "..", "src/additionalIcons");
const targetDir = path.join(__dirname, "..", "src");
const reactDir = path.join(targetDir, "react");
const nativeDir = path.join(targetDir, "native");

const directories = ["Flags", 'Payment', 'Providers']

// Component template
function reactTemplate({ template }, _, { imports, interfaces, componentName, __, jsx, exports }) {
    const plugins = ["typescript"];
    const tpl = template.smart({ plugins });
  
    return tpl.ast`
      ${imports}
      import Svg from "../StyledSvg"
  
      type Props = { size?: number | string; };
  
      ${interfaces}
  
      function ${componentName} ({ size = 16 }: Props): JSX.Element {
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
          .replace("import Svg,", "import ");
  
        if (!options.native)
          component = component.replace(/(<\s*\/?\s*)svg(\s*([^>]*)?\s*>)/gi, "$1Svg$2");
  
        fs.writeFileSync(outputFile, component, "utf-8");
      })
      .catch(e => console.error(e));
};

//get subfolders
const folders = fs.readdirSync(rootDir);

folders.forEach(folder => {
    //create target folders
    // Create folders if needed
    const folderName = `_${folder}`
    if (!fs.existsSync(`${reactDir}/${folderName}`)) {
        fs.mkdirSync(`${reactDir}/${folderName}`);
    }

    fs.writeFileSync(`${reactDir}/${folderName}/index.ts`, "", {
        flag: "w",
        encoding: "utf-8",
    });
    
    glob(`${rootDir}/${folder}/*.svg`, (err, icons) => {
        icons.forEach(icon => {
            let name = camelcase(path.basename(icon, ".svg"), {pascalCase: true})
            if (!isNaN(name.charAt(0))) name = `_${name}`; // fix variable name leading with a numerical value
           
            const exportString = `export { default as ${name} } from "./${name}";\n`;
            fs.appendFileSync(`${reactDir}/${folderName}/index.ts`, exportString, "utf-8");

            const svg = fs.readFileSync(icon, "utf-8");

            const options = {
                plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
                expandProps: false,
                componentName: name,
                svgProps: {
                  height: "{size}",
                  width: "{size}",
                },
                svgoConfig: {
                  plugins: [{ removeXMLNS: true, removeViewBox: false }],
                },
            };
            convert(
                svg,
                {...options, template: reactTemplate},
                {componentName: name},
                `${reactDir}/${folderName}/${name}.tsx`
            )
        })
    });
 })