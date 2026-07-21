export type AlphaMap = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export function loadImageAlphaMap(src: string): Promise<AlphaMap | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        data: ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const ALPHA_THRESHOLD = 10;
const NEIGHBORHOOD_RADIUS = 7;

export function isPixelVisible(
  alphaMap: AlphaMap,
  clickX: number,
  clickY: number,
  renderedWidth: number,
  renderedHeight: number
): boolean {
  const xCenter = (clickX / renderedWidth) * alphaMap.width;
  const yCenter = (clickY / renderedHeight) * alphaMap.height;

  const xStart = Math.max(0, Math.floor(xCenter - NEIGHBORHOOD_RADIUS));
  const xEnd = Math.min(alphaMap.width - 1, Math.floor(xCenter + NEIGHBORHOOD_RADIUS));
  const yStart = Math.max(0, Math.floor(yCenter - NEIGHBORHOOD_RADIUS));
  const yEnd = Math.min(alphaMap.height - 1, Math.floor(yCenter + NEIGHBORHOOD_RADIUS));

  for (let y = yStart; y <= yEnd; y += 1) {
    const dxMax = NEIGHBORHOOD_RADIUS * NEIGHBORHOOD_RADIUS - (y - yCenter) ** 2;
    if (dxMax < 0) continue;
    const dx = Math.sqrt(dxMax);
    const rowStart = Math.max(xStart, Math.ceil(xCenter - dx));
    const rowEnd = Math.min(xEnd, Math.floor(xCenter + dx));
    for (let x = rowStart; x <= rowEnd; x += 1) {
      const index = (y * alphaMap.width + x) * 4 + 3;
      if (alphaMap.data[index] > ALPHA_THRESHOLD) {
        return true;
      }
    }
  }

  return false;
}
