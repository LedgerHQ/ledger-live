// Utility for Xorshift-based PRNG
class XorshiftPRNG {
  private state: number[] = [0, 0, 0, 0];

  seed(seedStr: string): void {
    this.state.fill(0);
    for (let i = 0; i < seedStr.length; i++) {
      this.state[i % 4] = (this.state[i % 4] << 5) - this.state[i % 4] + seedStr.charCodeAt(i);
    }
  }

  random(): number {
    const t = this.state[0] ^ (this.state[0] << 11);
    this.state[0] = this.state[1];
    this.state[1] = this.state[2];
    this.state[2] = this.state[3];
    this.state[3] = this.state[3] ^ (this.state[3] >> 19) ^ t ^ (t >> 8);
    return (this.state[3] >>> 0) / ((1 << 31) >>> 0);
  }
}

type RGB = [number, number, number];

export class IconGenerator {
  private rng: XorshiftPRNG;

  constructor(seed: string) {
    this.rng = new XorshiftPRNG();
    this.rng.seed(seed);
  }

  private random = () => this.rng.random();

  private createColor(): RGB {
    let h = Math.floor(this.random() * 360);
    let s = this.random() * 60 + 40;
    let l = (this.random() + this.random() + this.random() + this.random()) * 25;

    h = ((h % 360) + 360) % 360;
    s /= 100;
    l /= 100;

    const hueToRgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    if (s === 0) return [l, l, l].map(v => Math.round(v * 255)) as RGB;

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hueToRgb(p, q, h / 360 + 1 / 3);
    const g = hueToRgb(p, q, h / 360);
    const b = hueToRgb(p, q, h / 360 - 1 / 3);

    return [r, g, b].map(v => Math.round(v * 255)) as RGB;
  }

  private createImageData(size: number): number[] {
    const width = size;
    const dataWidth = Math.ceil(width / 2);
    const mirrorWidth = width - dataWidth;
    const data: number[] = [];

    for (let y = 0; y < size; y++) {
      const row: number[] = Array.from({ length: dataWidth }, () =>
        Math.floor(this.random() * 2.3),
      );

      const mirrored = row.slice(0, mirrorWidth).reverse();
      row.push(...mirrored);

      data.push(...row);
    }

    return data;
  }

  private toPixels(
    size: number,
    cellData: number[],
    scale: number,
    color: RGB,
    spotColor: RGB,
    bgColor: RGB,
  ): number[] {
    const rowSize = size * scale;
    const rowDataSize = rowSize * 3;
    const data = new Array<number>(rowSize * rowDataSize);

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = cellData[(size - x - 1) * size + y];
        const c = value === 0 ? bgColor : value === 1 ? color : spotColor;

        for (let dx = 0; dx < scale; dx++) {
          for (let dy = 0; dy < scale; dy++) {
            const pixelIndex = (x * scale + dx) * rowDataSize + (y * scale + dy) * 3;
            [2, 1, 0].forEach((offset, idx) => {
              data[pixelIndex + offset] = c[idx];
            });
          }
        }
      }
    }

    return data;
  }

  private static toLEHex(n: number): string {
    return (n + 2 ** 32).toString(16).match(/\B../g)?.reverse().join("") ?? "";
  }

  private static generateBMP(width: number, pixels: number[]): string {
    const height = Math.floor(pixels.length / (width * 3));
    const size = this.toLEHex(26 + pixels.length);
    const wh = this.toLEHex(width).slice(0, 4) + this.toLEHex(height).slice(0, 4);
    const headerHex = `424d${size}000000001b0000000C000000${wh}0100180000`;

    const headerBytes = headerHex.match(/../g)?.map(h => parseInt(h, 16)) ?? [];
    const pixelChars = pixels.map(p => String.fromCharCode(p));

    const base64Header = btoa(String.fromCharCode(...headerBytes));
    const base64Pixels = btoa(pixelChars.join(""));

    return `data:image/bmp;base64,${base64Header}${base64Pixels}`;
  }

  generate(size = 8, scale = 4): string {
    const mainColor = this.createColor();
    const backgroundColor = this.createColor();
    const spotColor = this.createColor();

    const cellData = this.createImageData(size);
    const pixelData = this.toPixels(size, cellData, scale, mainColor, spotColor, backgroundColor);

    return IconGenerator.generateBMP(size * scale, pixelData);
  }
}
