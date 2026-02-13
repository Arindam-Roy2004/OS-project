// sjf.js - shortest job first
// picks the process with smallest burst time
// good for avg waiting time but long processes might wait forever

export function sjf(processes) {
  const procs = processes.map(p => ({ ...p }));
  const n = procs.length;
  const completed = new Array(n).fill(false);
  const timeline = [];
  const results = [];
  let currentTime = 0;
  let done = 0;

  while (done < n) {
    // find processes that have arrived
    let candidates = [];
    for (let i = 0; i < n; i++) {
      if (!completed[i] && procs[i].arrival <= currentTime) {
        candidates.push(i);
      }
    }

    if (candidates.length === 0) {
      // nothing to run rn, skip ahead
      const nextArrival = Math.min(
        ...procs.filter((_, i) => !completed[i]).map(p => p.arrival)
      );
      timeline.push({ pid: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // get shortest burst one
    candidates.sort((a, b) => {
      if (procs[a].burst !== procs[b].burst) return procs[a].burst - procs[b].burst;
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
