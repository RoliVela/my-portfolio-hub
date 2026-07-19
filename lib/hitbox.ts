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

export function isPixelVisible(
  alphaMap: AlphaMap,
  clickX: number,
  clickY: number,
  renderedWidth: number,
  renderedHeight: number
): boolean {
  const x = Math.floor((clickX / renderedWidth) * alphaMap.width);
  const y = Math.floor((clickY / renderedHeight) * alphaMap.height);
  if (x < 0 || x >= alphaMap.width || y < 0 || y >= alphaMap.height) return false;
  const index = (y * alphaMap.width + x) * 4 + 3;
  return alphaMap.data[index] > 0;
}
