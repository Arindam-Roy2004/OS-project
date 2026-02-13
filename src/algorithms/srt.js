// srt.js - shortest remaining time
// preemptive version of sjf
// can interrupt running process if shorter one arrives

export function srt(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst, started: false, firstStart: -1 }));
  const n = procs.length;
  const timeline = [];
  const results = [];
  let currentTime = 0;
  let done = 0;
  let lastPid = null;
  let segStart = 0;

  const maxTime = Math.max(...procs.map(p => p.arrival)) + procs.reduce((s, p) => s + p.burst, 0) + 1;

  while (done < n && currentTime < maxTime) {
    // get arrived processes with time left
    let candidates = procs.filter(p => p.arrival <= currentTime && p.remaining > 0);

    if (candidates.length === 0) {
      // nothing to run, skip ahead
      const nextArrival = Math.min(
        ...procs.filter(p => p.remaining > 0).map(p => p.arrival)
      );
      if (lastPid !== null) {
        timeline.push({ pid: lastPid, start: segStart, end: currentTime });
        lastPid = null;
      }
      timeline.push({ pid: 'idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    // Pick shortest remaining (tie: arrival, then PID)
    candidates.sort((a, b) => {
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      if (a.arrival !== b.arrival) return a.arrival - b.arrival;
      return a.pid - b.pid;
    });

    const chosen = candidates[0];

    // Track timeline segments
    if (chosen.pid !== lastPid) {
      if (lastPid !== null) {
        timeline.push({ pid: lastPid, start: segStart, end: currentTime });
      }
      segStart = currentTime;
      lastPid = chosen.pid;
    }

    // Record first start for response time
    if (!chosen.started) {
      chosen.started = true;
      chosen.firstStart = currentTime;
    }

    // Execute for 1 time unit
    chosen.remaining--;
    currentTime++;

    // Check if completed
    if (chosen.remaining === 0) {
      timeline.push({ pid: chosen.pid, start: segStart, end: currentTime });
      lastPid = null;

      const completion = currentTime;
      const turnaround = completion - chosen.arrival;
      const waiting = turnaround - chosen.burst;
      const response = chosen.firstStart - chosen.arrival;

      results.push({
        pid: chosen.pid, arrival: chosen.arrival, burst: chosen.burst,
        priority: chosen.priority, completion, turnaround, waiting, response
      });
      done++;
    }
  }

  // Flush last segment
  if (lastPid !== null) {
    timeline.push({ pid: lastPid, start: segStart, end: currentTime });
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
