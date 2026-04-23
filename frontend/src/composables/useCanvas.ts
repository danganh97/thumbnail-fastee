import { ref, watch, type Ref } from 'vue'
import Konva from 'konva'
import type {
  TemplateElement,
  TextElement,
  ImageElement,
  RectElement,
  IconElement,
  PaintStyle,
} from '@/types'

const SNAP_THRESHOLD = 8

const ICON_FONT_MAP: Record<IconElement['library'], string> = {
  bootstrap: 'bootstrap-icons',
  // Keep FA option stable by rendering equivalent glyphs via bootstrap-icons.
  fontawesome: 'bootstrap-icons',
}

const ICON_GLYPH_MAP: Record<string, string> = {
  'bootstrap:heart-fill': '\uF415',
  'bootstrap:star-fill': '\uF586',
  'bootstrap:lightning-fill': '\uF46E',
  'bootstrap:camera-fill': '\uF219',
  'bootstrap:megaphone-fill': '\uF483',
  'bootstrap:hand-thumbs-up-fill': '\uF406',
  'bootstrap:share-fill': '\uF52D',
  'fontawesome:fa-heart': '\uF415',
  'fontawesome:fa-star': '\uF586',
  'fontawesome:fa-bolt': '\uF46E',
  'fontawesome:fa-camera': '\uF219',
  'fontawesome:fa-bell': '\uF189',
  'fontawesome:fa-comment': '\uF24B',
  'fontawesome:fa-envelope': '\uF32C',
  'fontawesome:fa-phone': '\uF5B4',
  'fontawesome:fa-house': '\uF424',
  'fontawesome:fa-gear': '\uF3E2',
  'fontawesome:fa-fire': '\uF7F6',
  'fontawesome:fa-music': '\uF49E',
  'fontawesome:fa-image': '\uF429',
  'fontawesome:fa-video': '\uF21C',
  'fontawesome:fa-trophy': '\uF5E6',
  'fontawesome:fa-bookmark': '\uF199',
  'fontawesome:fa-circle-check': '\uF26A',
  'fontawesome:fa-circle-xmark': '\uF622',
  'fontawesome:fa-user': '\uF4DA',
  'fontawesome:fa-play': '\uF4F4',
  'fontawesome:fa-pause': '\uF4C3',
}

interface UseCanvasOptions {
  onElementDragEnd?:      (id: string, x: number, y: number) => void
  onElementTransformEnd?: (id: string, attrs: Partial<TemplateElement>) => void
  onElementClick?:        (id: string) => void
  onElementContextMenu?:  (id: string, x: number, y: number) => void
  onStageClick?:          () => void
  onTextDblClick?:        (id: string) => void
}

export function useCanvas(
  containerRef:    Ref<HTMLDivElement | null>,
  elements:        Ref<TemplateElement[]>,
  selectedId:      Ref<string | null>,
  canvasWidth:     Ref<number>,
  canvasHeight:    Ref<number>,
  backgroundColor: Ref<string>,
  readOnly:        Ref<boolean>,
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
      rotateEnabled:      !readOnly.value,
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
  function clearGradientAttrs(node: Konva.Shape): void {
    node.setAttrs({
      fillLinearGradientStartPoint: undefined,
      fillLinearGradientEndPoint: undefined,
      fillLinearGradientColorStops: undefined,
      fillRadialGradientStartPoint: undefined,
      fillRadialGradientEndPoint: undefined,
      fillRadialGradientStartRadius: undefined,
      fillRadialGradientEndRadius: undefined,
      fillRadialGradientColorStops: undefined,
      strokeLinearGradientStartPoint: undefined,
      strokeLinearGradientEndPoint: undefined,
      strokeLinearGradientColorStops: undefined,
      strokeRadialGradientStartPoint: undefined,
      strokeRadialGradientEndPoint: undefined,
      strokeRadialGradientStartRadius: undefined,
      strokeRadialGradientEndRadius: undefined,
      strokeRadialGradientColorStops: undefined,
    })
  }

  function applyPaint(
    node: Konva.Shape,
    kind: 'fill' | 'stroke',
    paint: string | PaintStyle | undefined,
    enabled = true,
  ): void {
    if (!enabled || !paint) {
      node.setAttr(kind, undefined)
      return
    }

    const style: PaintStyle = typeof paint === 'string'
      ? { kind: 'solid', color: paint }
      : paint

    if (style.kind === 'solid') {
      node.setAttr(kind, style.color)
      return
    }

    node.setAttr(kind, undefined)
    if (style.kind === 'linear') {
      const stops = style.colorStops.flatMap(([offset, color]) => [offset, color])
      if (kind === 'fill') {
        node.setAttrs({
          fillLinearGradientStartPoint: { x: style.startX, y: style.startY },
          fillLinearGradientEndPoint:   { x: style.endX, y: style.endY },
          fillLinearGradientColorStops: stops,
        })
      } else {
        node.setAttrs({
          strokeLinearGradientStartPoint: { x: style.startX, y: style.startY },
          strokeLinearGradientEndPoint:   { x: style.endX, y: style.endY },
          strokeLinearGradientColorStops: stops,
        })
      }
      return
    }

    const stops = style.colorStops.flatMap(([offset, color]) => [offset, color])
    if (kind === 'fill') {
      node.setAttrs({
        fillRadialGradientStartPoint:  { x: style.startX, y: style.startY },
        fillRadialGradientEndPoint:    { x: style.endX, y: style.endY },
        fillRadialGradientStartRadius: style.startRadius,
        fillRadialGradientEndRadius:   style.endRadius,
        fillRadialGradientColorStops:  stops,
      })
    } else {
      node.setAttrs({
        strokeRadialGradientStartPoint:  { x: style.startX, y: style.startY },
        strokeRadialGradientEndPoint:    { x: style.endX, y: style.endY },
        strokeRadialGradientStartRadius: style.startRadius,
        strokeRadialGradientEndRadius:   style.endRadius,
        strokeRadialGradientColorStops:  stops,
      })
    }
  }

  function resolveIconGlyph(el: IconElement): string {
    return ICON_GLYPH_MAP[`${el.library}:${el.icon}`] ?? '\u2753'
  }

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
      textDecoration: el.textDecoration === 'underline' ? 'underline' : '',
      align:       el.align,
      width:       el.width,
      draggable:   el.draggable && !readOnly.value,
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
      draggable: el.draggable && !readOnly.value,
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
    const node = new Konva.Rect({
      id:           el.id,
      x:            el.x + hw,
      y:            el.y + hh,
      width:        el.width,
      height:       el.height,
      cornerRadius: el.cornerRadius,
      draggable:    el.draggable && !readOnly.value,
      visible:      el.visible,
      opacity:      el.opacity,
      rotation:     el.rotation ?? 0,
      offsetX:      hw,
      offsetY:      hh,
    })
    clearGradientAttrs(node)
    applyPaint(node, 'fill', el.fill, el.fillEnabled ?? true)
    applyPaint(node, 'stroke', el.stroke, (el.strokeWidth ?? 0) > 0)
    node.strokeWidth(el.strokeWidth ?? 0)
    return node
  }

  function buildIconNode(el: IconElement): Konva.Text {
    const node = new Konva.Text({
      id:         el.id,
      x:          el.x,
      y:          el.y,
      text:       resolveIconGlyph(el),
      fontSize:   el.size,
      fontFamily: ICON_FONT_MAP[el.library] ?? 'bootstrap-icons',
      fontStyle:  'normal',
      width:      el.width,
      align:      'center',
      draggable:  el.draggable && !readOnly.value,
      visible:    el.visible,
      opacity:    el.opacity,
      rotation:   el.rotation ?? 0,
    })
    clearGradientAttrs(node)
    applyPaint(node, 'fill', el.fill, el.fillEnabled ?? true)
    applyPaint(node, 'stroke', el.stroke, (el.strokeWidth ?? 0) > 0)
    node.strokeWidth(el.strokeWidth ?? 0)
    return node
  }

  function buildNode(el: TemplateElement): Konva.Shape {
    switch (el.type) {
      case 'text':  return buildTextNode(el)
      case 'image': return buildImageNode(el)
      case 'rect':  return buildRectNode(el)
      case 'icon':  return buildIconNode(el)
    }
  }

  function attachEvents(node: Konva.Shape, el: TemplateElement): void {
    if (!readOnly.value && el.draggable) {
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

        if (el.type === 'text') {
          // Keep left/baseline-like anchor stable for text size changes.
          const scaledFontSize = Math.max(8, Math.round(el.fontSize * Math.abs(effectiveScaleY)))
          attrs.fontSize = scaledFontSize
          if (el.width !== undefined) {
            attrs.width = Math.max(20, Math.round(el.width * Math.abs(effectiveScaleX)))
          }
          node.scaleX(1)
          node.scaleY(1)
          attrs.x = node.x()
          attrs.y = node.y()
          options.onElementTransformEnd?.(el.id, attrs)
          return
        }

        if (el.type === 'icon') {
          // Icons are rendered as glyph text; keep their anchor at top-left.
          const scaledSize = Math.max(8, Math.round(el.size * Math.abs(effectiveScaleY)))
          attrs.size = scaledSize
          if (el.width !== undefined) {
            attrs.width = Math.max(8, Math.round(el.width * Math.abs(effectiveScaleX)))
          }
          if (el.height !== undefined) {
            attrs.height = Math.max(8, Math.round(el.height * Math.abs(effectiveScaleY)))
          }
          node.scaleX(1)
          node.scaleY(1)
          attrs.x = node.x()
          attrs.y = node.y()
          options.onElementTransformEnd?.(el.id, attrs)
          return
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
    }

    node.on('click tap', (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true
      selectNode(node)
      options.onElementClick?.(el.id)
    })

    node.on('contextmenu', (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly.value) return
      e.evt.preventDefault()
      e.cancelBubble = true
      selectNode(node)
      options.onElementContextMenu?.(el.id, e.evt.clientX, e.evt.clientY)
    })

    // Double-click to edit text inline
    if (el.type === 'text') {
      node.on('dblclick dbltap', (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (readOnly.value) return
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
  watch(backgroundColor, () => { syncBackground() })
  watch(readOnly, () => {
    if (transformer.value) {
      transformer.value.rotateEnabled(!readOnly.value)
      if (readOnly.value) transformer.value.nodes([])
    }
    syncElements()
  })

  return { stage, layer, transformer, init, syncElements, syncBackground, syncSelection, resizeStage }
}
