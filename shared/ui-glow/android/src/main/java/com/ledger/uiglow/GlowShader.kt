package com.ledger.uiglow

import android.content.Context
import android.opengl.GLES20

/** The glow shader cannot run on this phone. The message goes to JS (onShaderError). */
internal class GlowShaderError(message: String) : Exception(message)

/** Loads and compiles assets/uiglow/glow.glsl. GL thread only. */
internal object GlowShader {
  /** The vertex attribute that gets the corners of the triangle. */
  const val POSITION_ATTRIBUTE = 0
  private const val ASSET = "uiglow/glow.glsl"
  @Volatile private var cachedSource: String? = null

  /** Returns a linked program (the GPU program), ready to use. Throws GlowShaderError. */
  fun build(context: Context): Int {
    val source = readSource(context)
    requireHighPrecision()
    // One file for both stages: the #define picks the stage.
    val vertex = compile(GLES20.GL_VERTEX_SHADER, "#define VERTEX\n$source")
    val fragment = compile(GLES20.GL_FRAGMENT_SHADER, "#define FRAGMENT\n$source")
    return link(vertex, fragment)
  }

  /** The shader text, read once per app run. */
  private fun readSource(context: Context): String =
      cachedSource
          ?: runCatching { context.assets.open(ASSET).bufferedReader().use { it.readText() } }
              .getOrNull()
              ?.also { cachedSource = it }
          ?: throw GlowShaderError("Shader asset not found: $ASSET")

  /** Both stages share uniforms, so the fragment stage needs high precision too. */
  private fun requireHighPrecision() {
    val range = IntArray(2)
    val precision = IntArray(1)
    GLES20.glGetShaderPrecisionFormat(GLES20.GL_FRAGMENT_SHADER, GLES20.GL_HIGH_FLOAT, range, 0, precision, 0)
    if (precision[0] == 0) throw GlowShaderError("No highp float in fragment shaders on this GPU")
  }

  private fun compile(type: Int, source: String): Int {
    val shader = GLES20.glCreateShader(type)
    GLES20.glShaderSource(shader, source)
    GLES20.glCompileShader(shader)
    val status = IntArray(1)
    GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0)
    if (status[0] == 0) throw GlowShaderError("GLSL compile error: ${GLES20.glGetShaderInfoLog(shader)}")
    return shader
  }

  private fun link(vertex: Int, fragment: Int): Int {
    val program = GLES20.glCreateProgram()
    GLES20.glAttachShader(program, vertex)
    GLES20.glAttachShader(program, fragment)
    GLES20.glBindAttribLocation(program, POSITION_ATTRIBUTE, "aPos")
    GLES20.glLinkProgram(program)
    // The program keeps what it needs: the stages can go.
    GLES20.glDeleteShader(vertex)
    GLES20.glDeleteShader(fragment)
    val status = IntArray(1)
    GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, status, 0)
    if (status[0] == 0) throw GlowShaderError("GLSL link error: ${GLES20.glGetProgramInfoLog(program)}")
    return program
  }
}
