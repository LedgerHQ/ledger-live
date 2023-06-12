import fs from "fs";
import glob from "glob";
import path from "path";

const rootDir = path.join(__dirname, "../data");

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSvg(a: string, b: string): R;
    }
  }
}

expect.extend({
  toBeValidSvg(received, fileName, errorMessage) {
    if (received) {
      return {
        message: () => `Svg: ${fileName} valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `Svg: ${fileName} invalid
          ${errorMessage}
        `,
        pass: false,
      };
    }
  },
});

test("svg icons valid", async () => {
  glob.sync(`${rootDir}/icons/svg/*.svg`).map(svgFileName => {
    const buffer = fs.readFileSync(svgFileName);
    const fileContent = buffer.toString();

    const tags = fileContent.match(/<[^>]*?>/g) || [];

    expect(tags.length > 1).toBeTruthy();

    tags.forEach((element, i) => {
      if (i === 0) {
        const m = /width="([^"]+)"/.exec(element);
        if (!m) {
          throw new Error("no width found in " + svgFileName);
        }
        const [, size] = m;
        expect(element.includes('height="' + size + '"')).toBeValidSvg(
          svgFileName,
          "Must contain height of same width. " + element,
        );
        expect(element.includes('viewBox="0 0 ' + size + " " + size + '"')).toBeValidSvg(
          svgFileName,
          "Must contain correct viewport",
        );
        expect(!/style=/.test(element)).toBeValidSvg(
          svgFileName,
          "Must not contain style attrs. " + element,
        );
      } else {
        expect(/svg|path|line|rect|ellipse|polyline|polygon|circle|g/.test(element)).toBeValidSvg(
          svgFileName,
          "must only contain svg|path|line|rect|ellipse|polyline|polygon|circle|g",
        );
        expect(
          !/style=|clipPath|mask|id=|class=|url\(|clip-path|data|defs/.test(element),
        ).toBeValidSvg(
          svgFileName,
          "must not contain style=|clipPath|mask|id|class|url|clip-path|data|defs",
        );
      }
    });
  });
});
