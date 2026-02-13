/**
 * colors.js — Process Color Assignment
 * 
 * Tomorrow Night Eighties inspired palette for process visualization.
 * Warm, professional colors - no neon AI greens.
 */

const PROCESS_COLORS = [
  { bg: '#81a2be', text: '#1d1f21', light: '#2d3640' },   // Slate Blue
  { bg: '#f0c674', text: '#1d1f21', light: '#3d3520' },   // Warm Amber
  { bg: '#b5bd68', text: '#1d1f21', light: '#2d3020' },   // Olive Green
  { bg: '#cc6666', text: '#ffffff', light: '#3d2020' },   // Muted Red
  { bg: '#b294bb', text: '#1d1f21', light: '#302030' },   // Dusty Purple
  { bg: '#8abeb7', text: '#1d1f21', light: '#203030' },   // Sage Teal
  { bg: '#de935f', text: '#1d1f21', light: '#3d2d20' },   // Burnt Orange
  { bg: '#5f819d', text: '#ffffff', light: '#202830' },   // Steel Blue
  { bg: '#a3685a', text: '#ffffff', light: '#302020' },   // Terracotta
  { bg: '#e8985e', text: '#1d1f21', light: '#3d2820' },   // Copper
  { bg: '#8c9440', text: '#1d1f21', light: '#252810' },   // Moss
  { bg: '#85678f', text: '#ffffff', light: '#282030' },   // Plum
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
