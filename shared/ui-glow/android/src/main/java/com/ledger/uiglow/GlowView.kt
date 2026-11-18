package com.ledger.uiglow

import android.content.Context
import android.database.ContentObserver
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * <GlowView> on Android: draws assets/uiglow/glow.glsl with OpenGL ES 2.0 (a GLSurfaceView).
 *
 * Two threads:
 * - UI thread: GlowViewManager sets the props, then calls applyProps().
 * - GL thread: GlowRenderer draws each frame from the latest props. No JS runs per frame.
 *
 * The top and bottom glows fade in or out after `delayMs` (GlowFade). The whole glow fades in
 * once the shader is ready. Reduce motion (animations off in the OS) stops the clock and makes
 * fades instant. Pixel ratio capped at 2.
 */
class GlowView(context: Context) : GLSurfaceView(context) {

  // Props, set on the UI thread by GlowViewManager.

  /** The design params. The GL thread reads them on each frame. */
  @Volatile var params = GlowParams()
  /** Wait before a show change starts. */
  var delayMs = 0.0
  var onShaderError: ((message: String) -> Unit)? = null
  // Only stored: React sets props in no fixed order, so applyProps() uses them once all are set.
  private var isTopShown = true
  private var isBottomShown = false

  // Shared with the GL thread.

  private val topFade = GlowFade()
  private val bottomFade = GlowFade()
  /** Animations are off in the OS settings. */
  @Volatile private var isReduceMotion = false

  private val mainHandler = Handler(Looper.getMainLooper())
  private val animationScaleUri = Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE)
  /** Runs when the user turns animations on or off in the OS settings. */
  private val animationScaleObserver =
      object : ContentObserver(mainHandler) {
        override fun onChange(selfChange: Boolean) {
          checkReduceMotion()
          // Only one frame comes next: finish running fades now so it shows their end state.
          if (isReduceMotion) {
            topFade.finish()
            bottomFade.finish()
          }
          requestRender()
        }
      }

  // After all fields: a Kotlin init block runs in file order.
  init {
    setEGLContextClientVersion(2)
    preserveEGLContextOnPause = true
    setRenderer(GlowRenderer())
    checkReduceMotion()
  }

  fun setShowTop(show: Boolean) {
    isTopShown = show
  }

  fun setShowBottom(show: Boolean) {
    isBottomShown = show
  }

  /** Called by GlowViewManager once all props of an update are set. */
  fun applyProps() {
    checkReduceMotion()
    fadeTo(topFade, isTopShown)
    fadeTo(bottomFade, isBottomShown)
    requestRender() // a still glow (reduce motion) only draws when asked
  }

  /** The first value shows at once. A later change waits `delayMs`, then fades. */
  private fun fadeTo(fade: GlowFade, isShown: Boolean) {
    val target = if (isShown) 1f else 0f
    val isInstant = !fade.hasRequest || isReduceMotion
    if (!isInstant && target == fade.target) return
    val start = if (isInstant) 0L else System.nanoTime() + (delayMs * 1e6).toLong()
    fade.request(target, start)
  }

  /** Reads the OS setting. A still glow (reduce motion) draws only when asked, not 60 times a second. */
  private fun checkReduceMotion() {
    isReduceMotion =
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    renderMode = if (isReduceMotion) RENDERMODE_WHEN_DIRTY else RENDERMODE_CONTINUOUSLY
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    context.contentResolver.registerContentObserver(animationScaleUri, false, animationScaleObserver)
    checkReduceMotion()
  }

  override fun onDetachedFromWindow() {
    context.contentResolver.unregisterContentObserver(animationScaleObserver)
    super.onDetachedFromWindow()
  }

  /** Draws fewer pixels on dense screens: at most 2 per point. */
  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    val scale = min(1f, MAX_PIXEL_RATIO / resources.displayMetrics.density)
    holder.setFixedSize((width * scale).roundToInt().coerceAtLeast(1), (height * scale).roundToInt().coerceAtLeast(1))
  }

  /** Draws the frames. Everything in it runs on the GL thread. */
  private inner class GlowRenderer : Renderer {
    private val dpr = min(resources.displayMetrics.density, MAX_PIXEL_RATIO)
    private var width = 1
    private var height = 1
    private var program = 0 // the GPU program; 0 = not built yet
    private var uniforms: GlowUniforms? = null
    private var hasFailed = false
    private var elapsedSeconds = 0.0 // the shader clock
    private var lastFrameNanos = 0L // 0 = no frame yet: the next one does not move the clock
    private var readyNanos = 0L // when the shader was ready, for the entry fade

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
      program = 0 // a new GL context: the old program is gone
      lastFrameNanos = 0L
    }

    override fun onSurfaceChanged(gl: GL10?, newWidth: Int, newHeight: Int) {
      width = newWidth
      height = newHeight
      lastFrameNanos = 0L // back from the background: hidden time does not move the clock
      GLES20.glViewport(0, 0, width, height)
    }

    override fun onDrawFrame(gl: GL10?) {
      val now = System.nanoTime()
      moveClock(now)
      topFade.step(now)
      bottomFade.step(now)
      if (program == 0 && !hasFailed) buildProgram()
      val u = uniforms
      if (program == 0 || u == null) return clearToBlack()
      setUniforms(u, now)
      GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, 3) // one big triangle covers the view
    }

    /** Reduce motion stops the clock: the glow stays still. */
    private fun moveClock(now: Long) {
      if (lastFrameNanos != 0L && !isReduceMotion) elapsedSeconds += (now - lastFrameNanos) / 1e9
      lastFrameNanos = if (isReduceMotion) 0L else now
    }

    private fun clearToBlack() {
      GLES20.glClearColor(0f, 0f, 0f, 1f)
      GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
    }

    /** Sends this frame's values to the shader. */
    private fun setUniforms(u: GlowUniforms, now: Long) {
      val entryFade = if (isReduceMotion) 1f else min(1f, ((now - readyNanos) / 1e9 / ENTRY_FADE_SECONDS).toFloat())
      GLES20.glUniform2f(u.uRes, width.toFloat(), height.toFloat())
      GLES20.glUniform1f(u.uTime, elapsedSeconds.toFloat())
      GLES20.glUniform1f(u.uDpr, dpr)
      GLES20.glUniform1f(u.uFade, entryFade)
      GLES20.glUniform1f(u.uFadeTop, topFade.value)
      GLES20.glUniform1f(u.uFadeBottom, bottomFade.value)
      val p = params
      GLES20.glUniform4f(u.uLook, p.intensity, p.opacity, p.grain, p.grainSize)
      GLES20.glUniform4f(u.uShape, p.chroma, p.softness, p.width, p.reach)
      GLES20.glUniform4f(u.uTone, p.dark, p.spreadX, p.balance, p.contrast)
      GLES20.glUniform1f(u.uTopReach, p.topReach)
    }

    private fun buildProgram() {
      try {
        program = GlowShader.build(context)
      } catch (error: GlowShaderError) {
        hasFailed = true
        val message = error.message ?: "Unknown shader error"
        Log.e(TAG, message)
        mainHandler.post { onShaderError?.invoke(message) }
        return
      }
      uniforms = GlowUniforms(program)
      readyNanos = System.nanoTime()
      GLES20.glUseProgram(program)
      GLES20.glEnableVertexAttribArray(GlowShader.POSITION_ATTRIBUTE)
      GLES20.glVertexAttribPointer(GlowShader.POSITION_ATTRIBUTE, 2, GLES20.GL_FLOAT, false, 0, TRIANGLE)
    }
  }

  /** Where each uniform of glow.glsl is in the program. Same names as in the shader. */
  private class GlowUniforms(private val program: Int) {
    val uRes = find("uRes")
    val uTime = find("uTime")
    val uDpr = find("uDpr")
    val uFade = find("uFade")
    val uFadeTop = find("uFadeTop")
    val uFadeBottom = find("uFadeBottom")
    val uLook = find("uLook")
    val uShape = find("uShape")
    val uTone = find("uTone")
    val uTopReach = find("uTopReach")

    private fun find(name: String) = GLES20.glGetUniformLocation(program, name)
  }

  private companion object {
    const val TAG = "GlowView"
    const val MAX_PIXEL_RATIO = 2f
    const val ENTRY_FADE_SECONDS = 0.6 // the first display, once the shader is ready
    /** A triangle bigger than the view, so it covers every pixel (cheaper than 2 triangles). */
    val TRIANGLE = ByteBuffer.allocateDirect(6 * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().apply {
      put(floatArrayOf(-1f, -1f, 3f, -1f, -1f, 3f))
      position(0)
    }
  }
}
