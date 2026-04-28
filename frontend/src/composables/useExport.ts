import type Konva from 'konva'

interface ExportOptions {
  format?: 'png' | 'jpeg'
  pixelRatio?: number
  quality?: number
}

export function useExport() {
  function safePixelRatio(value: number | undefined): number {
    if (!Number.isFinite(value)) return 2
    return Math.max(0.1, Math.min(5, value as number))
  }

  function downloadFromDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function exportStage(
    stage: Konva.Stage,
    templateName: string,
    options: ExportOptions = {},
  ): void {
    const { format = 'png', pixelRatio = 2, quality = 0.92 } = options
    const normalizedPixelRatio = safePixelRatio(pixelRatio)

    const dataUrl = stage.toDataURL({
      pixelRatio: normalizedPixelRatio,
      mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality,
    })

    const safeName = templateName.toLowerCase().replace(/\s+/g, '-')
    const timestamp = Date.now()
    const filename = `${safeName}-${timestamp}.${format}`

    downloadFromDataUrl(dataUrl, filename)
  }

  function exportStageAsBlob(
    stage: Konva.Stage,
    options: ExportOptions = {},
  ): Promise<Blob> {
    const { format = 'png', pixelRatio = 2, quality = 0.92 } = options
    const normalizedPixelRatio = safePixelRatio(pixelRatio)

    return new Promise((resolve, reject) => {
      stage.toBlob({
        pixelRatio: normalizedPixelRatio,
        mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality,
        callback: (blob: Blob | null) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to export canvas as blob'))
        },
      })
    })
  }

  return { exportStage, exportStageAsBlob }
}
