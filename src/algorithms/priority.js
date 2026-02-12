/**
 * Priority Scheduling (Non-Preemptive)
 * 
 * HOW IT WORKS:
 * Each process is assigned a priority number (lower number = higher priority).
 * When the CPU is free, the highest-priority arrived process runs to completion.
 * 
 * TYPE: Non-preemptive
 * PROS: Important processes get served first; used in real-time systems
 * CONS: Can cause starvation for low-priority processes
 */

export function priority(processes) {
  const procs = processes.map(p => ({ ...p }));
  const n = procs.length;
  const completed = new Array(n).fill(false);
  const timeline = [];
  const results = [];
  let currentTime = 0;
  let done = 0;

  while (done < n) {
    let candidates = [];
    for (let i = 0; i < n; i++) {
      if (!completed[i] && procs[i].arrival <= currentTime) {
        candidates.push(i);
      }
    }

    if (candidates.length === 0) {
      const nextArrival = Math.min(
        ...procs.filter((_, i) => !completed[i]).map(p => p.arrival)
      );
      timeline.push({ pid: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Sort by priority (lower = higher), then arrival, then PID
    candidates.sort((a, b) => {
      const pa = procs[a].priority ?? 0;
      const pb = procs[b].priority ?? 0;
      if (pa !== pb) return pa - pb;
      if (procs[a].arrival !== procs[b].arrival) return procs[a].arrival - procs[b].arrival;
      return procs[a].pid - procs[b].pid;
    });

    const idx = candidates[0];
    const proc = procs[idx];
    const start = currentTime;
    const end = start + proc.burst;

    timeline.push({ pid: proc.pid, start, end });

    const completion = end;
    const turnaround = completion - proc.arrival;
    const waiting = turnaround - proc.burst;
    const response = start - proc.arrival;

    results.push({
      pid: proc.pid, arrival: proc.arrival, burst: proc.burst,
      priority: proc.priority, completion, turnaround, waiting, response
    });

    completed[idx] = true;
    currentTime = end;
    done++;
  }

  results.sort((a, b) => a.pid - b.pid);
  return { timeline, results, ...computeAverages(results) };
}

function computeAverages(results) {
  const n = results.length;
  if (n === 0) return { averages: { avgTurnaround: 0, avgWaiting: 0, avgResponse: 0 } };
  const avgTurnaround = results.reduce((s, r) => s + r.turnaround, 0) / n;
  const avgWaiting = results.reduce((s, r) => s + r.waiting, 0) / n;
  const avgResponse = results.reduce((s, r) => s + r.response, 0) / n;
  return { averages: { avgTurnaround, avgWaiting, avgResponse } };
}
