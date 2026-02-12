/**
 * Feedback (FB) — Multi-Level Feedback Queue with fixed quantum
 * 
 * HOW IT WORKS:
 * Uses multiple priority queues. New processes start at the highest queue.
 * Each queue uses RR with quantum=1. After using its quantum, a process
 * is demoted to the next lower queue. Lower queues only run when higher
 * queues are empty. The lowest queue also uses RR with quantum=1.
 * 
 * TYPE: Preemptive
 * PROS: Favors short/interactive processes; adapts to process behavior
 * CONS: Long processes may starve; complexity
 */

export function feedback(processes) {
  return feedbackGeneric(processes, false);
}

/**
 * Feedback Variable (FBV) — Feedback with varying time quantum
 * 
 * Same as Feedback but quantum DOUBLES at each level: 1, 2, 4, 8...
 * This gives longer processes bigger time slices at lower priorities,
 * reducing context switches for CPU-bound processes.
 */
export function feedbackVariable(processes) {
  return feedbackGeneric(processes, true);
}

function feedbackGeneric(processes, variableQuantum) {
  const NUM_QUEUES = 5;
  const procs = processes.map(p => ({
    ...p, remaining: p.burst, started: false, firstStart: -1, queueLevel: 0
  }));
  const n = procs.length;

  const queues = Array.from({ length: NUM_QUEUES }, () => []);
  const timeline = [];
  const results = [];
  let currentTime = 0;
  let done = 0;

  // Sort by arrival
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
  let nextArrivalIdx = 0;

  // Add initial arrivals
  while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
    queues[0].push(sorted[nextArrivalIdx]);
    nextArrivalIdx++;
  }

  while (done < n) {
    // Find highest non-empty queue
    let activeQueue = -1;
    for (let q = 0; q < NUM_QUEUES; q++) {
      if (queues[q].length > 0) { activeQueue = q; break; }
    }

    if (activeQueue === -1) {
      // Idle
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

    const proc = queues[activeQueue].shift();
    const quantum = variableQuantum ? Math.pow(2, activeQueue) : 1;

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

    // Add newly arrived processes to queue 0
    while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
      queues[0].push(sorted[nextArrivalIdx]);
      nextArrivalIdx++;
    }

    if (proc.remaining > 0) {
      // Demote to next queue (or stay at lowest)
      const nextQueue = Math.min(activeQueue + 1, NUM_QUEUES - 1);
      proc.queueLevel = nextQueue;
      queues[nextQueue].push(proc);
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
