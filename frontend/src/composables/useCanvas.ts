import { ref, watch, type Ref } from 'vue'
import Konva from 'konva'
import type { TemplateElement, TextElement, ImageElement, RectElement } from '@/types'

const SNAP_THRESHOLD = 8

interface UseCanvasOptions {
  onElementDragEnd?:      (id: string, x: number, y: number) => void
  onElementTransformEnd?: (id: string, attrs: Partial<TemplateElement>) => void
  onElementClick?:        (id: string) => void
  onStageClick?:          () => void
  onTextDblClick?:        (id: string) => void
}

export function useCanvas(
  containerRef:    Ref<HTMLDivElement | null>,
  elements:        Ref<TemplateElement[]>,
  selectedId:      Ref<string | null>,
  canvasWidth:     Ref<number>,
  canvasHeight:    Ref<number>,
  backgroundImage: Ref<string | null>,
  backgroundColor: Ref<string>,
  options:         UseCanvasOptions = {},
) {
  const stage       = ref<Konva.Stage | null>(null)
  const layer       = ref<Konva.Layer | null>(null)
  const transformer = ref<Konva.Transformer | null>(null)
  const bgLayer     = ref<Konva.Layer | null>(null)
  const guideLayer  = ref<Konva.Layer | null>(null)

  // ── Init ──────────────────────────────────────────────────────────────────
  function init(): void {
    if (!containerRef.value) return

    stage.value = new Konva.Stage({
      container: containerRef.value,
      width:     canvasWidth.value,
      height:    canvasHeight.value,
    })

    bgLayer.value = new Konva.Layer({ listening: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stage.value.add(bgLayer.value as any)

    layer.value = new Konva.Layer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stage.value.add(layer.value as any)

    transformer.value = new Konva.Transformer({
      rotateEnabled:      true,
      rotationSnaps:      [0, 45, 90, 135, 180, 225, 270, 315],
      borderStroke:       '#6366f1',
      borderStrokeWidth:  2,
      anchorFill:         '#6366f1',
      anchorStroke:       '#fff',
      anchorSize:         10,
      anchorCornerRadius: 3,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layer.value.add(transformer.value as any)

    // Guide layer sits on top of everything (added last)
    guideLayer.value = new Konva.Layer({ listening: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stage.value.add(guideLayer.value as any)

    stage.value.on('click tap', (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === stage.value) {
        transformer.value!.nodes([])
        layer.value!.batchDraw()
        options.onStageClick?.()
      }
    })
  }

  // ── Background layer — solid color only ───────────────────────────────────
  function syncBackground(): void {
    if (!bgLayer.value) return
    bgLayer.value.destroyChildren()
    bgLayer.value.add(new Konva.Rect({
      x:      0,
      y:      0,
      width:  canvasWidth.value,
      height: canvasHeight.value,
      fill:   backgroundColor.value || '#000000',
    }))
    bgLayer.value.batchDraw()
  }

  // ── Snap & guide helpers ──────────────────────────────────────────────────
  function clearGuides(): void {
    guideLayer.value?.destroyChildren()
    guideLayer.value?.batchDraw()
  }

  function snapAndGuide(movingNode: Konva.Shape): void {
    if (!stage.value || !layer.value || !guideLayer.value) return
    guideLayer.value.destroyChildren()

    const stageW = canvasWidth.value
    const stageH = canvasHeight.value
    const tr     = transformer.value

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const box = movingNode.getClientRect({ relativeTo: stage.value as any })

      // Candidate guide x-positions (vertical lines)
      const vGuides: number[] = [0, stageW / 2, stageW]
      // Candidate guide y-positions (horizontal lines)
      const hGuides: number[] = [0, stageH / 2, stageH]

      // Add other visible nodes' snap positions
      layer.value.getChildren(n => n !== movingNode && n !== (tr as unknown as Konva.Node)).forEach(n => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b = n.getClientRect({ relativeTo: stage.value as any })
          vGuides.push(b.x, b.x + b.width / 2, b.x + b.width)
          hGuides.push(b.y, b.y + b.height / 2, b.y + b.height)
        } catch { /* skip nodes that can't compute rect */ }
      })

      const nodeSnapX = [box.x, box.x + box.width / 2, box.x + box.width]
      const nodeSnapY = [box.y, box.y + box.height / 2, box.y + box.height]

      let deltaX: number | null = null
      let guideX: number | null = null
      for (const gx of vGuides) {
        const match = nodeSnapX.findIndex(nx => Math.abs(nx - gx) < SNAP_THRESHOLD)
        if (match !== -1) {
          deltaX = gx - nodeSnapX[match]
          guideX = gx
          break
        }
      }

      let deltaY: number | null = null
      let guideY: number | null = null
      for (const gy of hGuides) {
        const match = nodeSnapY.findIndex(ny => Math.abs(ny - gy) < SNAP_THRESHOLD)
        if (match !== -1) {
          deltaY = gy - nodeSnapY[match]
          guideY = gy
          break
        }
      }

      if (deltaX !== null) movingNode.x(movingNode.x() + deltaX)
      if (deltaY !== null) movingNode.y(movingNode.y() + deltaY)

      if (guideX !== null) {
        guideLayer.value.add(new Konva.Line({
          points:      [guideX, 0, guideX, stageH],
          stroke:      '#6366f1',
          strokeWidth: 1,
          dash:        [6, 3],
        }))
      }
      if (guideY !== null) {
        guideLayer.value.add(new Konva.Line({
          points:      [0, guideY, stageW, guideY],
          stroke:      '#6366f1',
          strokeWidth: 1,
          dash:        [6, 3],
        }))
      }

      guideLayer.value.batchDraw()
    } catch { /* silently ignore snap errors */ }
  }

  // ── Node builders ─────────────────────────────────────────────────────────
  function buildTextNode(el: TextElement): Konva.Text {
    return new Konva.Text({
      id:          el.id,
      x:           el.x,
      y:           el.y,
      text:        el.text,
      fontSize:    el.fontSize,
      fontFamily:  el.fontFamily,
      fill:        el.color,
      stroke:      el.stroke || undefined,
      strokeWidth: el.strokeWidth || 0,
      fontStyle:   el.fontStyle,
      align:       el.align,
      width:       el.width,
      draggable:   el.draggable,
      visible:     el.visible,
      opacity:     el.opacity,
      rotation:    el.rotation ?? 0,
    })
  }

  function buildImageNode(el: ImageElement): Konva.Image {
    const htmlImg = new window.Image()
    const scaleX  = el.flipX ? -1 : 1
    const scaleY  = el.flipY ? -1 : 1
    const hw      = el.width  / 2
    const hh      = el.height / 2

    const node = new Konva.Image({
      id:        el.id,
      x:         el.x + hw,
      y:         el.y + hh,
      width:     el.width,
      height:    el.height,
      draggable: el.draggable,
      visible:   el.visible,
      opacity:   el.opacity,
      rotation:  el.rotation ?? 0,
      scaleX,
      scaleY,
      offsetX:   hw,
      offsetY:   hh,
      image:     htmlImg,
    })

    const onLoaded = () => {
      node.image(htmlImg)
      layer.value?.batchDraw()
    }
    htmlImg.addEventListener('load', onLoaded, { once: true })
    htmlImg.src = el.src
    if (htmlImg.complete && htmlImg.naturalWidth > 0) {
      Promise.resolve().then(onLoaded)
    }

    return node
  }

  function buildRectNode(el: RectElement): Konva.Rect {
    const hw = el.width  / 2
    const hh = el.height / 2
    return new Konva.Rect({
      id:           el.id,
      x:            el.x + hw,
      y:            el.y + hh,
      width:        el.width,
      height:       el.height,
      fill:         el.fill || undefined,
      cornerRadius: el.cornerRadius,
      draggable:    el.draggable,
      visible:      el.visible,
      opacity:      el.opacity,
      rotation:     el.rotation ?? 0,
      offsetX:      hw,
      offsetY:      hh,
    })
  }

  function buildNode(el: TemplateElement): Konva.Shape {
    switch (el.type) {
      case 'text':  return buildTextNode(el)
      case 'image': return buildImageNode(el)
      case 'rect':  return buildRectNode(el)
    }
  }

  function attachEvents(node: Konva.Shape, el: TemplateElement): void {
    if (!el.draggable) return

    node.on('dragmove', () => {
      snapAndGuide(node)
    })

    node.on('dragend', () => {
      clearGuides()
      options.onElementDragEnd?.(el.id, node.x() - node.offsetX(), node.y() - node.offsetY())
    })

    node.on('transformend', () => {
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()

      const imgEl      = el.type === 'image' ? (el as ImageElement) : null
      const baseScaleX = imgEl?.flipX ? -1 : 1
      const baseScaleY = imgEl?.flipY ? -1 : 1

      const effectiveScaleX = scaleX / baseScaleX
      const effectiveScaleY = scaleY / baseScaleY

      let newOffsetX = node.offsetX()
      let newOffsetY = node.offsetY()

      const attrs: Partial<TemplateElement> & Record<string, unknown> = {
        rotation: node.rotation(),
      }

      if (effectiveScaleX !== 1 || effectiveScaleY !== 1) {
        const w = (node as Konva.Rect).width?.()
        const h = (node as Konva.Rect).height?.()
        if (w !== undefined) {
          const newW = Math.round(Math.abs(w * effectiveScaleX))
          attrs.width  = newW
          newOffsetX   = newW / 2
          node.offsetX(newOffsetX)
        }
        if (h !== undefined) {
          const newH = Math.round(Math.abs(h * effectiveScaleY))
          attrs.height = newH
          newOffsetY   = newH / 2
          node.offsetY(newOffsetY)
        }
        node.scaleX(baseScaleX)
        node.scaleY(baseScaleY)
      }

      attrs.x = node.x() - newOffsetX
      attrs.y = node.y() - newOffsetY

      options.onElementTransformEnd?.(el.id, attrs)
    })

    node.on('click tap', (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true
      selectNode(node)
      options.onElementClick?.(el.id)
    })

    // Double-click to edit text inline
    if (el.type === 'text') {
      node.on('dblclick dbltap', (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true
        options.onTextDblClick?.(el.id)
      })
    }
  }

  // ── Sync elements to canvas ───────────────────────────────────────────────
  function syncElements(): void {
    if (!layer.value) return
    const tr = transformer.value!
    tr.nodes([])
    layer.value.getChildren(node => node !== tr).forEach(n => n.destroy())

    for (const el of elements.value) {
      const node = buildNode(el)
      layer.value.add(node)
      attachEvents(node, el)
    }

    transformer.value!.moveToTop()
    layer.value.batchDraw()
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function selectNode(node: Konva.Shape): void {
    if (!transformer.value || !layer.value) return
    transformer.value.nodes([node])
    layer.value.batchDraw()
  }

  function syncSelection(): void {
    if (!layer.value || !transformer.value) return
    if (!selectedId.value) {
      transformer.value.nodes([])
      layer.value.batchDraw()
      return
    }
    const node = layer.value.findOne<Konva.Shape>(`#${selectedId.value}`)
    if (node) selectNode(node)
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function resizeStage(): void {
    if (!stage.value) return
    stage.value.width(canvasWidth.value)
    stage.value.height(canvasHeight.value)
    stage.value.batchDraw()
    syncBackground()
  }

  // ── Watchers ──────────────────────────────────────────────────────────────
  watch(elements,                           () => { syncElements()  }, { deep: true })
  watch(selectedId,                         () => { syncSelection() })
  watch([canvasWidth, canvasHeight],        () => { resizeStage()   })
  watch([backgroundImage, backgroundColor], () => { syncBackground() })

  return { stage, layer, transformer, init, syncElements, syncBackground, syncSelection, resizeStage }
}
