import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import fs from "fs";

test.use({
  userdata: "1AccountBTC1AccountETH",
  theme: "dark",
});

test("background is green and screenshot home page", async ({ page, electronApp }) => {
  // Assert the computed background color of #react-root is green
  const bg = await page.evaluate(() =>
    getComputedStyle(document.querySelector("#react-root")!).backgroundColor
  );
  console.log("Background color:", bg);
  expect(bg).toBe("rgb(0, 255, 0)");

  // Wait a bit for the compositor to settle
  await page.waitForTimeout(2000);

  // Try capturePage with a delay 
  const imageInfo = await electronApp.evaluate(async ({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    // Force repaint
    win.webContents.invalidate();
    await new Promise(r => setTimeout(r, 500));
    const img = await win.webContents.capturePage();
    const size = img.getSize();
    const png = img.toPNG();
    // Sample some pixels from the raw RGBA buffer
    const bitmap = img.toBitmap(); // raw BGRA
    const samples: Array<{x: number, y: number, r: number, g: number, b: number}> = [];
    for (const [x, y] of [[10,10],[100,100],[300,50],[500,300],[600,400]] as [number,number][]) {
      if (x < size.width && y < size.height) {
        const offset = (y * size.width + x) * 4;
        // Electron bitmap is BGRA
        samples.push({ x, y, r: bitmap[offset+2], g: bitmap[offset+1], b: bitmap[offset] });
      }
    }
    return { width: size.width, height: size.height, pngSize: png.length, samples, png: png as unknown as number[] };
  });

  console.log("capturePage size:", imageInfo.width + "x" + imageInfo.height, "png bytes:", imageInfo.pngSize);
  console.log("Pixel samples from bitmap:", JSON.stringify(imageInfo.samples));

  // Save the PNG from capturePage
  const pngBuf = Buffer.from(imageInfo.png as unknown as Uint8Array);
  fs.writeFileSync("/tmp/lld-green-screenshot.png", pngBuf);
  console.log("Screenshot saved, size:", pngBuf.length);
});
