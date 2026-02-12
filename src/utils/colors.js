/**
 * colors.js — Process Color Assignment
 * 
 * Hand-picked, muted palette for process visualization.
 * No AI gradients. Real, purposeful color choices.
 */

const PROCESS_COLORS = [
  { bg: '#3b82f6', text: '#fff', light: '#1e3a5f' },   // Steel Blue
  { bg: '#e5c07b', text: '#000', light: '#3d3520' },   // Amber
  { bg: '#98c379', text: '#000', light: '#1e3a1e' },   // Sage Green
  { bg: '#e06c75', text: '#fff', light: '#3d1e20' },   // Rust Red
  { bg: '#c678dd', text: '#fff', light: '#301e3d' },   // Plum
  { bg: '#56b6c2', text: '#000', light: '#1e3337' },   // Teal
  { bg: '#d19a66', text: '#000', light: '#3d2e1e' },   // Burnt Orange
  { bg: '#61afef', text: '#000', light: '#1e2e3d' },   // Sky Blue
  { bg: '#be5046', text: '#fff', light: '#3d1e1a' },   // Terracotta
  { bg: '#e5c07b', text: '#000', light: '#3d3520' },   // Gold
  { bg: '#98c379', text: '#000', light: '#1e3a1e' },   // Olive
  { bg: '#56b6c2', text: '#000', light: '#1e3337' },   // Slate Cyan
];

export function getProcessColor(index) {
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

export function getProcessColorMap(processes) {
  const map = {};
  processes.forEach((p, i) => {
    map[p.pid] = getProcessColor(i);
  });
  return map;
}
