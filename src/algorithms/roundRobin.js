/**
 * Round Robin (RR)
 * 
 * HOW IT WORKS:
 * Each process gets a fixed time slice (quantum). Processes are placed
 * in a circular queue. When a process's quantum expires, it goes to
 * the back of the queue. This ensures fair CPU distribution.
 * 
 * TYPE: Preemptive
 * PROS: Fair, prevents starvation, good for time-sharing systems
 * CONS: Performance depends on quantum size; too small = too many context switches;
 *       too large = degenerates to FCFS
 */

export function roundRobin(processes, options = {}) {
  const quantum = options.quantum || 2;
  const procs = processes.map(p => ({
    ...p, remaining: p.burst, started: false, firstStart: -1
  }));
  const n = procs.length;

  // Sort by arrival initially
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);

  const timeline = [];
  const results = [];
  const queue = [];
  let currentTime = 0;
  let done = 0;
  let nextArrivalIdx = 0;

  // Add first arrivals to queue
  while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
    queue.push(sorted[nextArrivalIdx]);
    nextArrivalIdx++;
  }

  while (done < n) {
    if (queue.length === 0) {
      // Idle — jump to next arrival
      if (nextArrivalIdx < n) {
        const nextTime = sorted[nextArrivalIdx].arrival;
        timeline.push({ pid: 'idle', start: currentTime, end: nextTime });
        currentTime = nextTime;
        while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
          queue.push(sorted[nextArrivalIdx]);
          nextArrivalIdx++;
        }
      }
      continue;
    }

    const proc = queue.shift();

    // Record first start
    if (!proc.started) {
      proc.started = true;
      proc.firstStart = currentTime;
    }

    // Execute for min(quantum, remaining)
    const execTime = Math.min(quantum, proc.remaining);
    const start = currentTime;
    const end = start + execTime;

    timeline.push({ pid: proc.pid, start, end });

    proc.remaining -= execTime;
    currentTime = end;

    // Add any newly arrived processes to queue BEFORE re-adding current
    while (nextArrivalIdx < n && sorted[nextArrivalIdx].arrival <= currentTime) {
      queue.push(sorted[nextArrivalIdx]);
      nextArrivalIdx++;
    }

    if (proc.remaining > 0) {
      // Not done — back of queue
      queue.push(proc);
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
