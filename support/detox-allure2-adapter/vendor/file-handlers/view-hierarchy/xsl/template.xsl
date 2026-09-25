<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <!-- Cached variables for template data -->
  <xsl:variable name="activePtr" select="/ViewHierarchy/@active-ptr"/>
  <xsl:variable name="win" select="/ViewHierarchy/*[1]"/>
  <xsl:variable name="shot" select="/ViewHierarchy/@screenshot"/>
  <xsl:variable name="density">
    <xsl:choose>
      <xsl:when test="/ViewHierarchy/@density">
        <xsl:value-of select="/ViewHierarchy/@density"/>
      </xsl:when>
      <xsl:otherwise>1</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:output method="html" indent="yes" encoding="utf-8"/>

  <!-- Main page template -->
  <xsl:template match="/">
    <html>
      <head>
        <title>Detox View Hierarchy</title>

        <style>
          <!-- CSS_PLACEHOLDER -->
        </style>

        <script>
          <!-- JS_PLACEHOLDER -->
        </script>
      </head>

      <body>
        <header>
          <h1>Detox Hierarchy Snapshot</h1>
          <p class="instructions">
            Hover a box to see attributes — failed elements are outlined in magenta.
          </p>
        </header>

        <!-- Canvas container with optional screenshot background -->
        <div>
          <xsl:attribute name="class">
            root<xsl:if test="$shot != ''"> bg</xsl:if>
          </xsl:attribute>

          <xsl:attribute name="style">
            <xsl:if test="$win/@width">width: <xsl:value-of select="$win/@width div $density"/>px;</xsl:if>
            <xsl:if test="$win/@height">height: <xsl:value-of select="$win/@height div $density"/>px;</xsl:if>
            <xsl:if test="$shot != ''">
              background: url('<xsl:value-of select="$shot"/>') 0 0/contain no-repeat;
            </xsl:if>
          </xsl:attribute>

          <!-- Render all view nodes (excluding ErrorMessage) -->
          <xsl:apply-templates select="ViewHierarchy/*[not(self::ErrorMessage)]"/>
        </div>

        <div class="controls">
          <label class="checkbox-container">
            <input type="checkbox" id="overflow-toggle" checked="checked"/>
            <span class="checkmark"></span>
            Hide overflow
          </label>
        </div>

        <!-- Smart tooltip element -->
        <div id="smart-tooltip">
          <div id="tooltip-content"></div>
        </div>

        <!-- Error message section -->
        <xsl:apply-templates select="/ViewHierarchy/ErrorMessage"/>
      </body>
    </html>
  </xsl:template>

  <!-- Individual view node template -->
  <xsl:template match="*">
    <div>
      <xsl:attribute name="class">
        <xsl:text>node</xsl:text>
        <xsl:if test="@visibility != 'visible'"> invisible</xsl:if>
      </xsl:attribute>

      <xsl:attribute name="data-z">
        <xsl:value-of select="count(ancestor::*) - 1"/>
      </xsl:attribute>

      <xsl:attribute name="style">
        position: absolute;
        <xsl:choose>
          <xsl:when test="/ViewHierarchy/@platform = 'android'">
            left: <xsl:value-of select="(sum(@x) - sum(parent::*/@x)) div $density"/>px;
            top: <xsl:value-of select="(sum(@y) - sum(parent::*/@y)) div $density"/>px;
          </xsl:when>
          <xsl:otherwise>
            left: <xsl:value-of select="@x div $density"/>px;
            top: <xsl:value-of select="@y div $density"/>px;
          </xsl:otherwise>
        </xsl:choose>
        width: <xsl:value-of select="@width div $density"/>px;
        height: <xsl:value-of select="@height div $density"/>px;
        <xsl:if test="@alpha">opacity: <xsl:value-of select="@alpha"/>;</xsl:if>
      </xsl:attribute>

      <!-- Store node name for tooltip -->
      <xsl:attribute name="data-node-name">
        <xsl:value-of select="name()"/>
      </xsl:attribute>

      <!-- Store active pointer for overlay system -->
      <xsl:if test="@ptr = $activePtr">
        <xsl:attribute name="data-active-ptr">true</xsl:attribute>
      </xsl:if>

      <!-- Store all attributes as JSON for tooltip -->
      <xsl:attribute name="data-node-attributes">
        <xsl:text>{</xsl:text>
        <xsl:for-each select="@*">
          <xsl:if test="position() > 1">,</xsl:if>
          <xsl:text>"</xsl:text><xsl:value-of select="name()"/><xsl:text>":"</xsl:text>
          <xsl:call-template name="escape-json">
            <xsl:with-param name="text" select="."/>
          </xsl:call-template>
          <xsl:text>"</xsl:text>
        </xsl:for-each>
        <xsl:text>}</xsl:text>
      </xsl:attribute>

      <!-- Display text or label when available -->
      <xsl:choose>
        <xsl:when test="normalize-space(@text) != ''">
          <span class="txt"><xsl:value-of select="@text"/></span>
        </xsl:when>
        <xsl:when test="normalize-space(@label) != ''">
          <span class="txt"><xsl:value-of select="@label"/></span>
        </xsl:when>
      </xsl:choose>

      <xsl:apply-templates select="*"/>
    </div>
  </xsl:template>

  <!-- Error message template -->
  <xsl:template match="ErrorMessage">
    <div class="error-container">
      <h2>Failure Details</h2>
      <pre><xsl:value-of select="."/></pre>
    </div>
  </xsl:template>

  <!-- Helper template to escape JSON strings -->
  <xsl:template name="escape-json">
    <xsl:param name="text"/>
    <xsl:choose>
      <xsl:when test="contains($text, '&quot;')">
        <xsl:call-template name="escape-json">
          <xsl:with-param name="text" select="substring-before($text, '&quot;')"/>
        </xsl:call-template>
        <xsl:text>\\"</xsl:text>
        <xsl:call-template name="escape-json">
          <xsl:with-param name="text" select="substring-after($text, '&quot;')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="contains($text, '\\')">
        <xsl:call-template name="escape-json">
          <xsl:with-param name="text" select="substring-before($text, '\\')"/>
        </xsl:call-template>
        <xsl:text>\\\\</xsl:text>
        <xsl:call-template name="escape-json">
          <xsl:with-param name="text" select="substring-after($text, '\\')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$text"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
