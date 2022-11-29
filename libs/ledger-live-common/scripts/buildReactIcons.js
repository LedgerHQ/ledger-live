const fs = require("fs");
const glob = require("glob");
const camelcase = require("camelcase");
const path = require("path");
const svgr = require("@svgr/core").default;

const rootDir = path.join(__dirname, "../src/data/icons");
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
  const plugins = ["typescript"];

  const tpl = template.smart({ plugins });
  return tpl.ast`
    ${imports};

    ${
      opts.native
        ? `interface Props {
              size: number;
              color: string;
            }`
        : `interface Props {
            size: number;
            color?: string;
          }`
    }

    ${interfaces}
    function ${componentName}(${
    opts.native
      ? `{ size, color }: Props`
      : `{size, color = "currentColor"}: Props`
  }) {
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
      const component = `
      // @ts-nocheck

      ${result
        .replace("xlinkHref=", "href=")
        .replace(/fill=("(?!none)\S*")/g, "fill={color}")}`;

      fs.writeFileSync(outputFile, component, "utf-8");
    })
    .catch((e) => console.error(e));
};

glob(`${rootDir}/svg/*.svg`, (err, icons) => {
  fs.writeFileSync(`${reactDir}/index.tsx`, "", "utf-8");
  fs.writeFileSync(`${reactNativeDir}/index.tsx`, "", "utf-8");

  icons.forEach((i) => {
    let name = camelcase(path.basename(i, ".svg"));

    if (!isNaN(name.charAt(0))) name = `_${name}`; // fix variable name leading with a numerical value

    const exportString = `export { default as ${name} } from "./${name}";\n`;

    fs.appendFileSync(`${reactDir}/index.tsx`, exportString, "utf-8");
    fs.appendFileSync(`${reactNativeDir}/index.tsx`, exportString, "utf-8");

    const svg = fs.readFileSync(i, "utf-8");
    const options = {
      expandProps: false,
      componentName: name,
      svgProps: {
        height: "{size}",
        width: "{size}",
      },
    };

    convert(
      svg,
      { ...options, template: reactTemplate },
      { componentName: name },
      `${reactDir}/${name}.tsx`
    );

    convert(
      svg,
      {
        ...options,
        native: true,
        template: reactTemplate,
      },
      { componentName: name },
      `${reactNativeDir}/${name}.tsx`
    );
  });
});
