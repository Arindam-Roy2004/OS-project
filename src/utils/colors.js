/**
 * colors.js — Process Color Assignment
 * 
 * Assigns distinct, visually pleasing colors to processes
 * for the Gantt chart and results table.
 */

const PROCESS_COLORS = [
  { bg: '#6366f1', text: '#fff', light: 'rgba(99,102,241,0.15)' },   // Indigo
  { bg: '#f59e0b', text: '#000', light: 'rgba(245,158,11,0.15)' },   // Amber
  { bg: '#10b981', text: '#fff', light: 'rgba(16,185,129,0.15)' },   // Emerald
  { bg: '#ef4444', text: '#fff', light: 'rgba(239,68,68,0.15)' },    // Red
  { bg: '#8b5cf6', text: '#fff', light: 'rgba(139,92,246,0.15)' },   // Violet
  { bg: '#06b6d4', text: '#fff', light: 'rgba(6,182,212,0.15)' },    // Cyan
  { bg: '#f97316', text: '#fff', light: 'rgba(249,115,22,0.15)' },   // Orange
  { bg: '#ec4899', text: '#fff', light: 'rgba(236,72,153,0.15)' },   // Pink
  { bg: '#14b8a6', text: '#fff', light: 'rgba(20,184,166,0.15)' },   // Teal
  { bg: '#a855f7', text: '#fff', light: 'rgba(168,85,247,0.15)' },   // Purple
  { bg: '#eab308', text: '#000', light: 'rgba(234,179,8,0.15)' },    // Yellow
  { bg: '#3b82f6', text: '#fff', light: 'rgba(59,130,246,0.15)' },   // Blue
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
