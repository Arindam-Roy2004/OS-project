// theme.js
// all the colors in one place so i dont go crazy
// using tinycolor for some helper functions

import tinycolor from 'tinycolor2';

// Core theme colors - warm, professional, non-AI
export const THEME = {
  // Background shades
  bg: {
    base: '#1d1f21',
    surface: '#232527',
    raised: '#2a2c2e',
    overlay: '#373b41',
  },
  
  // Text colors
  text: {
    primary: '#c5c8c6',
    secondary: '#969896',
    muted: '#707880',
    disabled: '#4d4d4c',
  },
  
  // Accent colors - warm copper/amber tones
  accent: {
    primary: '#e8985e',     // Copper - main accent
    secondary: '#f0c674',   // Amber - headers
    tertiary: '#de935f',    // Burnt orange - warnings
  },
  
  // Semantic colors
  semantic: {
    success: '#b5bd68',     // Olive green - soft success
    error: '#cc6666',       // Muted red
    warning: '#de935f',     // Warm orange
    info: '#81a2be',        // Slate blue
  },
  
  // Border colors
  border: {
    default: '#373b41',
    subtle: '#2a2c2e',
    focus: '#e8985e',
  },
};

/**
 * Generate a readable text color for any background
 */
export function getReadableText(bgColor) {
  const color = tinycolor(bgColor);
  return color.isLight() ? '#1d1f21' : '#c5c8c6';
}

/**
 * Darken a color by percentage
 */
export function darken(color, amount = 10) {
  return tinycolor(color).darken(amount).toHexString();
}

/**
 * Lighten a color by percentage
 */
export function lighten(color, amount = 10) {
  return tinycolor(color).lighten(amount).toHexString();
}

/**
 * Create a transparent version of a color
 */
export function alpha(color, amount = 0.5) {
  return tinycolor(color).setAlpha(amount).toRgbString();
}

/**
 * Generate hover state color
 */
export function getHoverColor(color) {
  const tc = tinycolor(color);
  return tc.isLight() ? tc.darken(8).toHexString() : tc.lighten(8).toHexString();
}

/**
 * Generate a complementary color for accents
 */
export function getComplementary(color) {
  return tinycolor(color).complement().toHexString();
}

/**
 * Get analogous colors for gradients
 */
export function getAnalogous(color, count = 3) {
  return tinycolor(color)
    .analogous(count)
    .map(c => c.toHexString());
}

/**
 * CSS custom properties object for injection
 */
export function getThemeCSSVariables() {
  return {
    '--theme-bg-base': THEME.bg.base,
    '--theme-bg-surface': THEME.bg.surface,
    '--theme-bg-raised': THEME.bg.raised,
    '--theme-bg-overlay': THEME.bg.overlay,
    '--theme-text-primary': THEME.text.primary,
    '--theme-text-secondary': THEME.text.secondary,
    '--theme-text-muted': THEME.text.muted,
    '--theme-accent-primary': THEME.accent.primary,
    '--theme-accent-secondary': THEME.accent.secondary,
    '--theme-semantic-success': THEME.semantic.success,
    '--theme-semantic-error': THEME.semantic.error,
    '--theme-semantic-warning': THEME.semantic.warning,
    '--theme-semantic-info': THEME.semantic.info,
    '--theme-border-default': THEME.border.default,
    '--theme-border-focus': THEME.border.focus,
  };
}

export default THEME;
