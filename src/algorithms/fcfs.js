// fcfs.js - first come first serve
// simplest one, just runs processes in order they arrive
// not efficient but easy to understand

export function fcfs(processes) {
  // sort by arrival, use pid as tiebreaker
  const sorted = [...processes]
    .sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);

  const timeline = [];
  const results = [];
  let currentTime = 0;

  for (const proc of sorted) {
    // If CPU is idle, fast-forward to this process's arrival
    if (currentTime < proc.arrival) {
      timeline.push({ pid: 'idle', start: currentTime, end: proc.arrival });
      currentTime = proc.arrival;
    }

    const start = currentTime;
    const end = start + proc.burst;

    timeline.push({ pid: proc.pid, start, end });

    const completion = end;
    const turnaround = completion - proc.arrival;
    const waiting = turnaround - proc.burst;
    const response = start - proc.arrival;

    results.push({
      pid: proc.pid,
      arrival: proc.arrival,
      burst: proc.burst,
      priority: proc.priority,
      completion,
      turnaround,
      waiting,
      response
    });

    currentTime = end;
  }

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
