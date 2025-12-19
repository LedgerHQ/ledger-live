import { sanitizeSvg, isSvgUrl } from "./ValidatorImage";

describe("ValidatorImage utilities", () => {
  describe("isSvgUrl", () => {
    it("returns true for .svg URLs", () => {
      expect(isSvgUrl("https://example.com/logo.svg")).toBe(true);
      expect(isSvgUrl("https://example.com/path/to/image.SVG")).toBe(true);
    });

    it("returns true for .svg URLs with query params", () => {
      expect(isSvgUrl("https://example.com/logo.svg?v=123")).toBe(true);
    });

    it("returns false for non-SVG URLs", () => {
      expect(isSvgUrl("https://example.com/logo.png")).toBe(false);
      expect(isSvgUrl("https://example.com/logo.jpg")).toBe(false);
      expect(isSvgUrl("https://example.com/svg/logo.png")).toBe(false);
    });

    it("handles malformed URLs gracefully", () => {
      expect(isSvgUrl("not-a-url.svg")).toBe(true);
      expect(isSvgUrl("not-a-url.png")).toBe(false);
    });
  });

  describe("sanitizeSvg", () => {
    it("removes XML declaration", () => {
      const input = '<?xml version="1.0" encoding="utf-8"?><svg></svg>';
      expect(sanitizeSvg(input)).toBe("<svg></svg>");
    });

    it("removes DOCTYPE", () => {
      const input =
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg></svg>';
      expect(sanitizeSvg(input)).toBe("<svg></svg>");
    });

    it("removes comments", () => {
      const input = "<svg><!-- Generator: Adobe Illustrator --><path/></svg>";
      expect(sanitizeSvg(input)).toBe("<svg><path/></svg>");
    });

    it("removes enable-background attribute", () => {
      const input = '<svg enable-background="new 0 0 400 400"><path/></svg>';
      expect(sanitizeSvg(input)).toBe("<svg ><path/></svg>");
    });

    it("removes xml:space attribute", () => {
      const input = '<svg xml:space="preserve"><path/></svg>';
      expect(sanitizeSvg(input)).toBe("<svg ><path/></svg>");
    });

    it("handles real-world Adobe Illustrator SVG", () => {
      const input = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 16.0.0 -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 400 400" xml:space="preserve">
<path fill="#EA2531" d="M100,100"/>
</svg>`;

      const result = sanitizeSvg(input);

      expect(result).not.toContain("<?xml");
      expect(result).not.toContain("<!DOCTYPE");
      expect(result).not.toContain("<!--");
      expect(result).not.toContain("enable-background");
      expect(result).not.toContain("xml:space");
      expect(result).toContain('<path fill="#EA2531"');
    });

    it("trims whitespace", () => {
      const input = "  <svg></svg>  ";
      expect(sanitizeSvg(input)).toBe("<svg></svg>");
    });
  });
});
