// hrrn.js - highest response ratio next
// calculates ratio = (waiting + burst) / burst
// picks highest ratio, prevents starvation naturally

export function hrrn(processes) {
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
        const waitingTime = currentTime - procs[i].arrival;
        const responseRatio = (waitingTime + procs[i].burst) / procs[i].burst;
        candidates.push({ index: i, responseRatio });
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

    // Pick highest response ratio (tie: earlier arrival, then PID)
    candidates.sort((a, b) => {
      if (b.responseRatio !== a.responseRatio) return b.responseRatio - a.responseRatio;
      if (procs[a.index].arrival !== procs[b.index].arrival)
        return procs[a.index].arrival - procs[b.index].arrival;
      return procs[a.index].pid - procs[b.index].pid;
    });

    const idx = candidates[0].index;
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
