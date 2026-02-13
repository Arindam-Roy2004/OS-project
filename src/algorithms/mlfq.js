// mlfq.js - multi level feedback queue
// 3 levels with different quantums
// level 1: rr q=2, level 2: rr q=4, level 3: fcfs
// this is what actual operating systems use (kinda)

export function mlfq(processes) {
  const LEVELS = [
    { quantum: 2, policy: 'rr' },
    { quantum: 4, policy: 'rr' },
    { quantum: Infinity, policy: 'fcfs' }
  ];

  const procs = processes.map(p => ({
    ...p, remaining: p.burst, started: false, firstStart: -1, level: 0
  }));
  const n = procs.length;
  const queues = LEVELS.map(() => []);
  const timeline = [];
  const results = [];
  let currentTime = 0;
  let done = 0;

  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
  let nextArrivalIdx = 0;

  // Add initial arrivals to level 0
  while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
    queues[0].push(sorted[nextArrivalIdx]);
    nextArrivalIdx++;
  }

  while (done < n) {
    // Find highest (lowest index) non-empty queue
    let activeLevel = -1;
    for (let q = 0; q < LEVELS.length; q++) {
      if (queues[q].length > 0) { activeLevel = q; break; }
    }

    if (activeLevel === -1) {
      if (nextArrivalIdx < n) {
        const nextTime = sorted[nextArrivalIdx].arrival;
        timeline.push({ pid: 'idle', start: currentTime, end: nextTime });
        currentTime = nextTime;
        while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
          queues[0].push(sorted[nextArrivalIdx]);
          nextArrivalIdx++;
        }
      }
      continue;
    }

    const proc = queues[activeLevel].shift();
    const quantum = LEVELS[activeLevel].quantum;

    if (!proc.started) {
      proc.started = true;
      proc.firstStart = currentTime;
    }

    const execTime = Math.min(quantum, proc.remaining);
    const start = currentTime;
    const end = start + execTime;
    timeline.push({ pid: proc.pid, start, end });

    proc.remaining -= execTime;
    currentTime = end;

    // Add newly arrived processes to level 0
    while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
      queues[0].push(sorted[nextArrivalIdx]);
      nextArrivalIdx++;
    }

    if (proc.remaining > 0) {
      // Demote to next level (or stay at lowest)
      const nextLevel = Math.min(activeLevel + 1, LEVELS.length - 1);
      proc.level = nextLevel;
      queues[nextLevel].push(proc);
    } else {
      // Completed
      const completion = currentTime;
      const turnaround = completion - proc.arrival;
      const waiting = turnaround - proc.burst;
      const response = proc.firstStart - proc.arrival;

      results.push({
        pid: proc.pid, arrival: proc.arrival, burst: proc.burst,
        priority: proc.priority, completion, turnaround, waiting, response
      });
      done++;
    }
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
