import React from 'react';
import { getProcessColor } from '../utils/colors';
import { ALGORITHMS } from '../algorithms';
import './ResultsTable.css';

export default function ResultsTable({ results, averages, algorithmName, processes, comparison }) {
  // Comparison mode
  if (comparison) {
    return (
      <div className="results-table-container">
        <h3 className="results-title">📋 Comparison Summary</h3>
        <div className="table-scroll">
          <table className="results-table comparison-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Type</th>
                <th>Avg TAT</th>
                <th>Avg WT</th>
                <th>Avg RT</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(comparison).map(([key, r]) => {
                const algo = ALGORITHMS[key];
                // Find best values
                const allAvgWT = Object.values(comparison).map(c => c.averages.avgWaiting);
                const bestWT = Math.min(...allAvgWT);
                const isBest = r.averages.avgWaiting === bestWT;
                return (
                  <tr key={key} className={isBest ? 'best-row' : ''}>
                    <td className="algo-name-cell">
                      <span className="algo-badge">{algo.shortName}</span>
                    </td>
                    <td>
                      <span className={`type-badge ${algo.type === 'Preemptive' ? 'preemptive' : 'non-preemptive'}`}>
                        {algo.type}
                      </span>
                    </td>
                    <td>{r.averages.avgTurnaround.toFixed(2)}</td>
                    <td className={isBest ? 'best-value' : ''}>
                      {r.averages.avgWaiting.toFixed(2)}
                      {isBest && <span className="best-star"> ★</span>}
                    </td>
                    <td>{r.averages.avgResponse.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Single algorithm results
  if (!results || results.length === 0) return null;

  const colorMap = {};
  processes?.forEach((p, i) => { colorMap[p.pid] = getProcessColor(i); });

  return (
    <div className="results-table-container">
      <h3 className="results-title">📋 Results — {algorithmName}</h3>
      <div className="table-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Arrival</th>
              <th>Burst</th>
              <th>Completion</th>
              <th>Turnaround</th>
              <th>Waiting</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const color = colorMap[r.pid];
              return (
                <tr key={r.pid}>
                  <td>
                    <span className="pid-badge" style={{ background: color?.bg, color: color?.text }}>
                      P{r.pid}
                    </span>
                  </td>
                  <td>{r.arrival}</td>
                  <td>{r.burst}</td>
                  <td>{r.completion}</td>
                  <td>{r.turnaround}</td>
                  <td>{r.waiting}</td>
                  <td>{r.response}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="averages-row">
              <td colSpan="3">Averages</td>
              <td>—</td>
              <td>{averages.avgTurnaround.toFixed(2)}</td>
              <td>{averages.avgWaiting.toFixed(2)}</td>
              <td>{averages.avgResponse.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="metric-cards">
        <div className="metric-card">
          <div className="metric-label">Avg Turnaround</div>
          <div className="metric-value">{averages.avgTurnaround.toFixed(2)}</div>
          <div className="metric-desc">CT - Arrival Time</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Waiting</div>
          <div className="metric-value highlight">{averages.avgWaiting.toFixed(2)}</div>
          <div className="metric-desc">TAT - Burst Time</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Response</div>
          <div className="metric-value">{averages.avgResponse.toFixed(2)}</div>
          <div className="metric-desc">First CPU - Arrival</div>
        </div>
      </div>
    </div>
  );
}
