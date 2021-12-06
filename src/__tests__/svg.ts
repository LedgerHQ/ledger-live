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
  glob.sync(`${rootDir}/icons/svg/*.svg`).map((svgFileName) => {
    const buffer = fs.readFileSync(svgFileName);
    const fileContent = buffer.toString();

    const tags = fileContent.match(/<[^>]*?>/g) || [];

    expect(tags.length > 1).toBeTruthy();

    tags.forEach((element, i) => {
      if (i === 0) {
        expect(/width="24"|width="24px"/.test(element)).toBeValidSvg(
          svgFileName,
          "Must contain width 24px"
        );
        expect(/height="24"|height="24px"/.test(element)).toBeValidSvg(
          svgFileName,
          "Must contain height 24px"
        );
        expect(
          /viewBox="0 0 24 24"|viewBox="0 0 24px 24px"/.test(element)
        ).toBeValidSvg(svgFileName, "Must contain correct viewport");
        expect(!/style=/.test(element)).toBeValidSvg(
          svgFileName,
          "Must not contain style attrs"
        );
      } else {
        expect(
          /svg|path|line|rect|ellipse|polyline|polygon|circle|g/.test(element)
        ).toBeValidSvg(
          svgFileName,
          "must only contain svg|path|line|rect|ellipse|polyline|polygon|circle|g"
        );
        expect(
          !/style=|clipPath|mask|id=|class=|url\(|clip-path|data|defs/.test(
            element
          )
        ).toBeValidSvg(
          svgFileName,
          "must not contain style=|clipPath|mask|id|class|url|clip-path|data|defs"
        );
      }
    });
  });
});
