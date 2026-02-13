// cliTools.js
// bunch of terminal-looking stuff for the browser
// tryna make it feel like a real CLI but its just react lol

// ─────────────────────────────────────────────
// chalk - colors n stuff
// ─────────────────────────────────────────────
export const chalk = {
  green: (text) => ({ text, type: 'success' }),
  red: (text) => ({ text, type: 'error' }),
  yellow: (text) => ({ text, type: 'warning' }),
  cyan: (text) => ({ text, type: 'info' }),
  bold: (text) => ({ text, type: 'header' }),
  dim: (text) => ({ text, type: 'dim' }),
  white: (text) => ({ text, type: 'output' }),
  // Background colors
  bgRed: (text) => ({ text, type: 'bg-red' }),
  bgGreen: (text) => ({ text, type: 'bg-green' }),
  bgYellow: (text) => ({ text, type: 'bg-yellow' }),
  bgBlue: (text) => ({ text, type: 'bg-blue' }),
  bgMagenta: (text) => ({ text, type: 'bg-magenta' }),
  bgCyan: (text) => ({ text, type: 'bg-cyan' }),
  bgWhite: (text) => ({ text, type: 'bg-white' }),
  // Chained styles
  greenBold: (text) => ({ text, type: 'success', bold: true }),
  cyanBold: (text) => ({ text, type: 'info', bold: true }),
  yellowBold: (text) => ({ text, type: 'header' }),
  redBold: (text) => ({ text, type: 'error', bold: true }),
};


// ─────────────────────────────────────────────
// boxen - those fancy boxes with borders
// ─────────────────────────────────────────────
const BOX_CHARS = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  bold: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
};

export function boxen(text, options = {}) {
  const {
    padding = 1,
    borderStyle = 'round',
    borderColor = 'info',    // maps to CSS class
    textColor = 'output',
    title = null,
    titleColor = 'header',
    width = null,
  } = options;

  const box = BOX_CHARS[borderStyle] || BOX_CHARS.round;
  const lines = text.split('\n');

  // Calculate width
  const maxTextLen = Math.max(...lines.map(l => l.length));
  const innerWidth = width || maxTextLen + (padding * 2);

  const result = [];

  // Top border with optional title
  if (title) {
    const titleStr = ` ${title} `;
    const remainingWidth = innerWidth - titleStr.length;
    const leftDashes = Math.floor(remainingWidth / 2);
    const rightDashes = remainingWidth - leftDashes;
    result.push({
      text: `  ${box.tl}${box.h.repeat(leftDashes)}${titleStr}${box.h.repeat(rightDashes)}${box.tr}`,
      type: borderColor,
    });
  } else {
    result.push({
      text: `  ${box.tl}${box.h.repeat(innerWidth)}${box.tr}`,
      type: borderColor,
    });
  }

  // Top padding
  for (let i = 0; i < padding; i++) {
    result.push({
      text: `  ${box.v}${' '.repeat(innerWidth)}${box.v}`,
      type: borderColor,
    });
  }

  // Content lines
  for (const line of lines) {
    const paddedLine = ' '.repeat(padding) + line + ' '.repeat(innerWidth - line.length - padding);
    result.push({
      text: `  ${box.v}${paddedLine}${box.v}`,
      type: textColor,
    });
  }

  // Bottom padding
  for (let i = 0; i < padding; i++) {
    result.push({
      text: `  ${box.v}${' '.repeat(innerWidth)}${box.v}`,
      type: borderColor,
    });
  }

  // Bottom border
  result.push({
    text: `  ${box.bl}${box.h.repeat(innerWidth)}${box.br}`,
    type: borderColor,
  });

  return result;
}


// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// spinner - the loading dots thing
// ─────────────────────────────────────────────
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text) {
  let frameIdx = 0;
  return {
    frames: SPINNER_FRAMES,
    text,
    getFrame() {
      const frame = SPINNER_FRAMES[frameIdx % SPINNER_FRAMES.length];
      frameIdx++;
      return { text: `  ${frame} ${text}`, type: 'info' };
    },
    succeed(msg) {
      return { text: `  ✔ ${msg || text}`, type: 'success' };
    },
    fail(msg) {
      return { text: `  ✖ ${msg || text}`, type: 'error' };
    },
    warn(msg) {
      return { text: `  ⚠ ${msg || text}`, type: 'warning' };
    },
  };
}


// ─────────────────────────────────────────────
// gradient - colorful text effects
// ─────────────────────────────────────────────
export const gradient = {
  pastel: (text) => ({ text, type: 'gradient-pastel', isGradient: true }),
  rainbow: (text) => ({ text, type: 'gradient-rainbow', isGradient: true }),
  vice: (text) => ({ text, type: 'gradient-vice', isGradient: true }),
  mind: (text) => ({ text, type: 'gradient-mind', isGradient: true }),
};


// ─────────────────────────────────────────────
// cliTable - makes those ascii tables
// ─────────────────────────────────────────────
export function cliTable(headers, rows, options = {}) {
  const {
    headerColor = 'header',
    rowColor = 'output',
    borderColor = 'dim',
    compact = false,
  } = options;

  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRow = Math.max(...rows.map(r => String(r[i] ?? '').length));
    return Math.max(h.length, maxRow) + 2;
  });

  const totalWidth = colWidths.reduce((a, b) => a + b, 0) + headers.length + 1;

  const result = [];

  // Top border
  result.push({
    text: '  ┌' + colWidths.map(w => '─'.repeat(w)).join('┬') + '┐',
    type: borderColor,
  });

  // Header row
  const headerStr = '  │' + headers.map((h, i) =>
    ' ' + h.padEnd(colWidths[i] - 1)
  ).join('│') + '│';
  result.push({ text: headerStr, type: headerColor });

  // Header separator
  result.push({
    text: '  ├' + colWidths.map(w => '─'.repeat(w)).join('┼') + '┤',
    type: borderColor,
  });

  // Data rows
  for (const row of rows) {
    const rowStr = '  │' + row.map((cell, i) =>
      ' ' + String(cell ?? '').padEnd(colWidths[i] - 1)
    ).join('│') + '│';
    result.push({ text: rowStr, type: rowColor });
  }

  // Bottom border
  result.push({
    text: '  └' + colWidths.map(w => '─'.repeat(w)).join('┴') + '┘',
    type: borderColor,
  });

  return result;
}


// ─────────────────────────────────────────────
// 6. INQUIRER — Interactive CLI Prompts
//    Generates prompt-style display text.
// ─────────────────────────────────────────────
export function inquirerList(question, choices, selectedIdx = null) {
  const result = [
    { text: `  ? ${question}`, type: 'info' },
  ];

  choices.forEach((choice, i) => {
    const prefix = i === selectedIdx ? '❯' : ' ';
    const type = i === selectedIdx ? 'success' : 'output';
    result.push({ text: `    ${prefix} ${choice}`, type });
  });

  return result;
}
