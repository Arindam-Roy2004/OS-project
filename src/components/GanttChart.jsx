import React from 'react';
import { getProcessColor } from '../utils/colors';
import './GanttChart.css';

export default function GanttChart({ timeline, processes, algorithmName, compact = false }) {
  if (!timeline || timeline.length === 0) return null;

  const maxTime = Math.max(...timeline.map(t => t.end));
  const colorMap = {};
  processes.forEach((p, i) => {
    colorMap[p.pid] = getProcessColor(i);
  });

  // Merge consecutive same-pid segments for cleaner display
  const merged = [];
  for (const seg of timeline) {
    const last = merged[merged.length - 1];
    if (last && last.pid === seg.pid && last.end === seg.start) {
      last.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }

  return (
    <div className={`gantt-container ${compact ? 'gantt-compact' : ''}`}>
      {!compact && (
        <div className="gantt-header">
          <h3 className="gantt-title">📊 Gantt Chart — {algorithmName}</h3>
          <div className="gantt-legend">
            {processes.map((p, i) => (
              <div key={p.pid} className="gantt-legend-item">
                <span
                  className="gantt-legend-color"
                  style={{ background: getProcessColor(i).bg }}
                ></span>
                <span>P{p.pid}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {compact && (
        <div className="gantt-compact-header">{algorithmName}</div>
      )}

      <div className="gantt-chart">
        <div className="gantt-bars">
          {merged.map((seg, i) => {
            const widthPercent = ((seg.end - seg.start) / maxTime) * 100;
            const isIdle = seg.pid === 'idle';
            const color = isIdle ? null : colorMap[seg.pid];

            return (
              <div
                key={i}
                className={`gantt-bar ${isIdle ? 'gantt-idle' : ''}`}
                style={{
                  width: `${widthPercent}%`,
                  background: isIdle ? 'rgba(255,255,255,0.03)' : color?.bg,
                  color: isIdle ? 'rgba(255,255,255,0.3)' : color?.text,
                  animationDelay: `${i * 0.05}s`
                }}
                title={isIdle ? `Idle: ${seg.start}-${seg.end}` : `P${seg.pid}: ${seg.start}-${seg.end}`}
              >
                {!compact && (seg.end - seg.start > 0) && (
                  <span className="gantt-bar-label">
                    {isIdle ? 'idle' : `P${seg.pid}`}
                  </span>
                )}
                {compact && !isIdle && (seg.end - seg.start) / maxTime > 0.06 && (
                  <span className="gantt-bar-label">P{seg.pid}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Time markers */}
        <div className="gantt-time-axis">
          {Array.from(new Set(merged.flatMap(s => [s.start, s.end]))).sort((a, b) => a - b).map(t => (
            <div
              key={t}
              className="gantt-time-mark"
              style={{ left: `${(t / maxTime) * 100}%` }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
