// Existing image-map plans were authored on a 1358 × 843 canvas.
// Preserve that coordinate frame rather than stretching saved percentages to
// each viewer's viewport; the photo and every overlay share this fitted frame.
export const IMAGE_MAP_FRAME = { width: 1358, height: 843 } as const;

export function fitImageMapFrame(width: number, height: number) {
  if (width <= 0 || height <= 0) return { left: 0, top: 0, width: 0, height: 0 };
  const scale = Math.min(width / IMAGE_MAP_FRAME.width, height / IMAGE_MAP_FRAME.height);
  const frameWidth = IMAGE_MAP_FRAME.width * scale;
  const frameHeight = IMAGE_MAP_FRAME.height * scale;
  return {
    left: (width - frameWidth) / 2,
    top: (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  };
}