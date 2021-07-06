const fs = require("fs");
const glob = require("glob");
const camelcase = require("camelcase");
const path = require("path");
const svgr = require("@svgr/core").default;

const rootDir = path.join(__dirname, "../src/data/flags");
const reactDir = `${rootDir}/react`;
const reactNativeDir = `${rootDir}/reactNative`;

if (!fs.existsSync(reactDir)) {
  fs.mkdirSync(reactDir);
}

if (!fs.existsSync(reactNativeDir)) {
  fs.mkdirSync(reactNativeDir);
}

function reactTemplate(
  { template },
  opts,
  { imports, interfaces, componentName, _, jsx, exports }
) {
  // @TODO update this once TS is the norm here
  const plugins = ["js", "flow"];

  //  if (opts.typescript) {
  //    plugins.push("typescript");
  //  }

  const tpl = template.smart({ plugins });
  return tpl.ast`
    ${imports};

    type Props = {
      size: number, 
    }

    ${interfaces}
    function ${componentName}({ size }: Props) {
      return ${jsx};
    }
    
    ${exports}
  `;
}

const convert = (svg, options, componentName, outputFile) => {
  svgr(svg, options, componentName)
    .then((result) => {
      // @TODO remove this flow comment once TS is the norm here
      // can't do it is babel ast for now sorry about it
      const component = `//@flow
      ${result.replace("xlinkHref=", "href=")}`;

      fs.writeFileSync(outputFile, component, "utf-8");
    })
    .catch((e) => console.error(e));
};

glob(`${rootDir}/svg/*.svg`, (err, icons) => {
  fs.writeFileSync(`${reactDir}/index.js`, "", "utf-8");
  fs.writeFileSync(`${reactNativeDir}/index.js`, "", "utf-8");

  icons.forEach((i) => {
    let name = `${camelcase(path.basename(i, ".svg"))}Flag`;
    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.js`, exportString, "utf-8");
    fs.appendFileSync(`${reactNativeDir}/index.js`, exportString, "utf-8");

    const svg = fs.readFileSync(i, "utf-8");
    const options = {
      expandProps: false,
      componentName: name,
      svgProps: {
        viewBox: "0 0 38 30",
        height: "{size}",
        width: "{size/30*38}",
      },
    };

    convert(
      svg,
      { ...options, template: reactTemplate },
      { componentName: name },
      `${reactDir}/${name}.js`
    );

    convert(
      svg,
      {
        ...options,
        native: true,
        template: reactTemplate,
      },
      { componentName: name },
      `${reactNativeDir}/${name}.js`
    );
  });
});
