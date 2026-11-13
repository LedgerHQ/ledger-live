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
 * <GlowView> on Android: a GLSurfaceView (OpenGL ES 2.0) that owns the render thread, so no JS
 * runs per frame. The `source` prop is GLSL ES 1.00 for both stages (src/shaders/glow.glsl.ts).
 * Two glows (top, bottom) fade in or out after `delayMs`; the whole glow fades in once the
 * shader is ready. Reduce motion stops the clock and makes fades instant. Pixel ratio capped at 2.
 */
class GlowView(context: Context) : GLSurfaceView(context) {

  // Written on the UI thread, read on the render thread.
  // A still glow (reduce motion) draws only on request, so each change asks for a frame.
  @Volatile var source = ""
    set(value) {
      field = value
      requestRender()
    }
  @Volatile var params = FloatArray(PARAM_COUNT)
    set(value) {
      field = value
      requestRender()
    }
  var delayMs = 0.0
  var onShaderError: ((message: String) -> Unit)? = null

  private val topFade = GlowFade()
  private val bottomFade = GlowFade()
  @Volatile private var isReduceMotion = false
  private val mainHandler = Handler(Looper.getMainLooper())
  private val animationScaleUri = Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE)
  private val animationScaleObserver =
      object : ContentObserver(mainHandler) {
        override fun onChange(selfChange: Boolean) {
          updateRenderMode()
          // Only one frame comes next: finish running fades now so it shows their end state.
          if (isReduceMotion) listOf(topFade, bottomFade).forEach { it.finish() }
          requestRender()
        }
      }

  init {
    setEGLContextClientVersion(2)
    preserveEGLContextOnPause = true
    setRenderer(GlowRenderer())
    updateRenderMode()
  }

  // Prop setters only store values: setter order is not fixed, so the delays may come after.
  private var isTopShown = true
  private var isBottomShown = false

  fun setShowTop(show: Boolean) {
    isTopShown = show
  }

  fun setShowBottom(show: Boolean) {
    isBottomShown = show
  }

  /** Called once all props of an update are set. */
  fun applyProps() {
    animateTo(topFade, if (isTopShown) 1f else 0f)
    animateTo(bottomFade, if (isBottomShown) 1f else 0f)
  }

  /** The first value applies at once; later changes wait `delayMs`, then fade. */
  private fun animateTo(fade: GlowFade, target: Float) {
    updateRenderMode()
    val isInstant = !fade.hasRequest || isReduceMotion
    if (!isInstant && target == fade.target) return
    val start = System.nanoTime() + (delayMs * 1e6).toLong()
    fade.request(target, if (isInstant) 0L else start)
    requestRender()
  }

  /** A still glow (reduce motion) only draws when something changes. */
  private fun updateRenderMode() {
    isReduceMotion =
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    renderMode = if (isReduceMotion) RENDERMODE_WHEN_DIRTY else RENDERMODE_CONTINUOUSLY
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    context.contentResolver.registerContentObserver(animationScaleUri, false, animationScaleObserver)
    updateRenderMode()
  }

  override fun onDetachedFromWindow() {
    context.contentResolver.unregisterContentObserver(animationScaleObserver)
    super.onDetachedFromWindow()
  }

  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    val scale = min(1f, MAX_PIXEL_RATIO / resources.displayMetrics.density)
    holder.setFixedSize((width * scale).roundToInt().coerceAtLeast(1), (height * scale).roundToInt().coerceAtLeast(1))
  }

  /** Everything in GlowRenderer runs on the GL thread. */
  private inner class GlowRenderer : Renderer {
    private val dpr = min(resources.displayMetrics.density, MAX_PIXEL_RATIO)
    private var width = 1
    private var height = 1
    private var program = 0
    private var programSource: String? = null
    private var hasFailed = false
    private var uniforms = IntArray(0)
    private var elapsed = 0.0
    private var lastNanos = 0L
    private var entryStartNanos = 0L

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
      program = 0 // a new context: GL objects are gone
      programSource = null
      lastNanos = 0L // hidden time does not move the clock
    }

    override fun onSurfaceChanged(gl: GL10?, newWidth: Int, newHeight: Int) {
      width = newWidth
      height = newHeight
      GLES20.glViewport(0, 0, width, height)
    }

    override fun onDrawFrame(gl: GL10?) {
      val now = System.nanoTime()
      if (lastNanos != 0L && !isReduceMotion) elapsed += (now - lastNanos) / 1e9
      lastNanos = if (isReduceMotion) 0L else now // frozen time does not move the clock
      topFade.step(now)
      bottomFade.step(now)
      val currentSource = source
      if (currentSource != programSource) buildProgram(currentSource)
      if (program == 0) {
        GLES20.glClearColor(0f, 0f, 0f, 1f)
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
        return
      }
      val entry = if (isReduceMotion) 1f else min(1f, ((now - entryStartNanos) / 1e9 / ENTRY_FADE).toFloat())
      GLES20.glUniform2f(uniforms[0], width.toFloat(), height.toFloat())
      GLES20.glUniform1f(uniforms[1], elapsed.toFloat())
      GLES20.glUniform1f(uniforms[2], dpr)
      GLES20.glUniform1f(uniforms[3], entry)
      GLES20.glUniform1f(uniforms[4], topFade.value)
      GLES20.glUniform1f(uniforms[5], bottomFade.value)
      GLES20.glUniform4fv(uniforms[6], PARAM_COUNT / 4, params, 0) // uniform vec4 uP[4]
      GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, 3)
    }

    private fun buildProgram(newSource: String) {
      if (program != 0) GLES20.glDeleteProgram(program)
      program = 0
      programSource = newSource
      if (newSource.isEmpty() || hasFailed) return
      // Both stages share uniforms, so the fragment stage needs highp too.
      val range = IntArray(2)
      val precision = IntArray(1)
      GLES20.glGetShaderPrecisionFormat(GLES20.GL_FRAGMENT_SHADER, GLES20.GL_HIGH_FLOAT, range, 0, precision, 0)
      if (precision[0] == 0) return fail("No highp float in fragment shaders on this GPU")
      val vertex = compile(GLES20.GL_VERTEX_SHADER, "#define VERTEX\n$newSource") ?: return
      val fragment = compile(GLES20.GL_FRAGMENT_SHADER, "#define FRAGMENT\n$newSource") ?: return
      val newProgram = GLES20.glCreateProgram()
      GLES20.glAttachShader(newProgram, vertex)
      GLES20.glAttachShader(newProgram, fragment)
      GLES20.glBindAttribLocation(newProgram, 0, "aPos")
      GLES20.glLinkProgram(newProgram)
      GLES20.glDeleteShader(vertex)
      GLES20.glDeleteShader(fragment)
      val status = IntArray(1)
      GLES20.glGetProgramiv(newProgram, GLES20.GL_LINK_STATUS, status, 0)
      if (status[0] == 0) return fail("GLSL link error: ${GLES20.glGetProgramInfoLog(newProgram)}")
      program = newProgram
      entryStartNanos = System.nanoTime()
      uniforms = UNIFORM_NAMES.map { GLES20.glGetUniformLocation(newProgram, it) }.toIntArray()
      GLES20.glUseProgram(newProgram)
      GLES20.glEnableVertexAttribArray(0)
      GLES20.glVertexAttribPointer(0, 2, GLES20.GL_FLOAT, false, 0, TRIANGLE)
    }

    private fun compile(type: Int, shaderSource: String): Int? {
      val shader = GLES20.glCreateShader(type)
      GLES20.glShaderSource(shader, shaderSource)
      GLES20.glCompileShader(shader)
      val status = IntArray(1)
      GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0)
      if (status[0] != 0) return shader
      fail("GLSL compile error: ${GLES20.glGetShaderInfoLog(shader)}")
      return null
    }

    private fun fail(message: String) {
      hasFailed = true
      Log.e(TAG, message)
      mainHandler.post { onShaderError?.invoke(message) }
    }
  }

  /** The opacity of one glow. The UI thread requests a target; the GL thread steps it. */
  private class GlowFade {
    @Volatile var target = 0f
      private set
    @Volatile private var startNanos = 0L // 0 = instant
    @Volatile private var version = 0
    var hasRequest = false
      private set

    // GL thread only.
    var value = 0f
      private set
    private var from = 0f
    private var seenVersion = -1
    private var isRunning = false

    /** Jump to the current target (UI thread). */
    fun finish() {
      if (hasRequest) request(target, 0L)
    }

    fun request(newTarget: Float, start: Long) {
      target = newTarget
      startNanos = start
      hasRequest = true
      version++
    }

    fun step(now: Long) {
      if (version != seenVersion) {
        seenVersion = version
        if (startNanos == 0L) {
          value = target
          isRunning = false
          return
        }
        from = value
        isRunning = true
      }
      if (!isRunning || now < startNanos) return
      val progress = min(1.0, (now - startNanos) / 1e9 / FADE)
      value = from + (target - from) * progress.toFloat()
      if (progress >= 1.0) isRunning = false
    }
  }

  companion object {
    private const val TAG = "GlowView"
    private const val MAX_PIXEL_RATIO = 2f
    const val PARAM_COUNT = 16 // room to grow: unused slots are 0
    private const val FADE = 1.0 // seconds, one glow coming or going (GLOW_FADE_MS in JS)
    private const val ENTRY_FADE = 0.6 // the first display, once the shader is ready
    private val UNIFORM_NAMES = listOf("uRes", "uTime", "uDpr", "uFade", "uFadeTop", "uFadeBottom", "uP")
    private val TRIANGLE = ByteBuffer.allocateDirect(6 * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().apply {
      put(floatArrayOf(-1f, -1f, 3f, -1f, -1f, 3f))
      position(0)
    }
  }
}
