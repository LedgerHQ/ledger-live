package com.ledger.animatedqrcode

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View

// Every element drawn with Canvas in onDraw, redrawn on each Choreographer frame.
// The center badge is a React node drawn over this view, not here.
class AnimatedQrCodeView(context: Context) : View(context), Choreographer.FrameCallback {
    private companion object {
        const val FINDER_MODULES = 7
        const val DOT_RADIUS_RATIO = 0.42f
        const val FINDER_RING_RADIUS_MODULES = 2.5f
    }

    private class Element(
        val rect: RectF,
        val cornerRadius: Float,
        val element: QrElement,
        val ring: Boolean,
    )

    var animation: String = "shimmer"
    var autoPlay: Boolean = false
    var moduleCount: Int = 0
        set(value) { field = value; needsRebuild = true }
    var dots: IntArray = IntArray(0)
        set(value) { field = value; needsRebuild = true }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val drawRect = RectF()
    private var elements: List<Element> = emptyList()
    private var needsRebuild = true
    private var builtWidth = 0
    private var startNanos = 0L
    private var frameNanos = 0L
    private var running = false
    private var touch = QrTouch.NONE

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startNanos = 0L
        running = true
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun onDetachedFromWindow() {
        running = false
        Choreographer.getInstance().removeFrameCallback(this)
        super.onDetachedFromWindow()
    }

    override fun doFrame(frameTimeNanos: Long) {
        if (!running) return
        if (startNanos == 0L) startNanos = frameTimeNanos
        frameNanos = frameTimeNanos
        invalidate()
        Choreographer.getInstance().postFrameCallback(this)
    }

    // React Native's root view sees touches before this view, so the tap still reaches Pressable.
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (width == 0) return false
        val x = event.x / width
        val y = event.y / height
        touch = when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> QrTouch(x, y, currentTime(), -1f)
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> touch.copy(releasedAt = currentTime())
            else -> touch
        }
        return true
    }

    private fun currentTime(): Float = (frameNanos - startNanos).coerceAtLeast(0L) / 1_000_000_000f

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (needsRebuild || builtWidth != width) rebuildElements()
        val time = currentTime()
        if (autoPlay) touch = QrAnimationTimeline.autoTouch(animation, time, touch)
        val animatesColor = animation == "shimmer"

        for (element in elements) {
            val frame = QrAnimationTimeline.frame(animation, time, element.element, touch)
            // Each animation only animates what it changes, like the Reanimated version.
            val scale = if (animatesColor) 1f else frame.scale
            val halfWidth = element.rect.width() * scale / 2
            val halfHeight = element.rect.height() * scale / 2
            drawRect.set(
                element.rect.centerX() - halfWidth,
                element.rect.centerY() - halfHeight,
                element.rect.centerX() + halfWidth,
                element.rect.centerY() + halfHeight,
            )
            val paint = if (element.ring) ringPaint else fillPaint
            paint.color = if (animatesColor) frame.color else QrAnimationTimeline.INK
            val radius = element.cornerRadius * scale
            canvas.drawRoundRect(drawRect, radius, radius, paint)
        }
    }

    private fun rebuildElements() {
        needsRebuild = false
        builtWidth = width
        if (moduleCount <= 1 || width == 0) {
            elements = emptyList()
            return
        }

        val count = moduleCount.toFloat()
        val moduleSize = width / count
        val dotDiameter = moduleSize * DOT_RADIUS_RATIO * 2
        val dotInset = (moduleSize - dotDiameter) / 2
        fun center(index: Float) = (index + 0.5f) / count
        val built = ArrayList<Element>(dots.size / 2 + 6)

        for (dotIndex in 0 until dots.size / 2) {
            val row = dots[dotIndex * 2].toFloat()
            val col = dots[dotIndex * 2 + 1].toFloat()
            val left = col * moduleSize + dotInset
            val top = row * moduleSize + dotInset
            built.add(
                Element(
                    RectF(left, top, left + dotDiameter, top + dotDiameter),
                    dotDiameter / 2,
                    QrElement(center(col), center(row), QrElementKind.DOT),
                    ring = false,
                ),
            )
        }

        val finderEdge = (moduleCount - FINDER_MODULES).toFloat()
        ringPaint.strokeWidth = moduleSize
        for ((row, col) in listOf(0f to 0f, 0f to finderEdge, finderEdge to 0f)) {
            val finderOffset = (FINDER_MODULES - 1) / 2f
            val finder = QrElement(center(col + finderOffset), center(row + finderOffset), QrElementKind.FINDER)
            // A stroke is centered on its path: inset by half a module so the ring stays 7 modules wide.
            val half = moduleSize / 2
            built.add(
                Element(
                    RectF(
                        col * moduleSize + half,
                        row * moduleSize + half,
                        (col + FINDER_MODULES) * moduleSize - half,
                        (row + FINDER_MODULES) * moduleSize - half,
                    ),
                    moduleSize * (FINDER_RING_RADIUS_MODULES - 0.5f),
                    finder,
                    ring = true,
                ),
            )
            built.add(
                Element(
                    RectF((col + 2) * moduleSize, (row + 2) * moduleSize, (col + 5) * moduleSize, (row + 5) * moduleSize),
                    moduleSize,
                    finder,
                    ring = false,
                ),
            )
        }
        elements = built
    }
}
