const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8

export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const canvas = new OffscreenCanvas(Math.round(width * scale), Math.round(height * scale))
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}
