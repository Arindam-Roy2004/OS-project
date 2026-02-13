// index.js
// all the scheduling algorithms in one place
// add new ones here if u want

import { fcfs } from './fcfs';
import { sjf } from './sjf';
import { srt } from './srt';
import { roundRobin } from './roundRobin';
import { hrrn } from './hrrn';
import { priority } from './priority';
import { feedback, feedbackVariable } from './feedback';
import { aging } from './aging';
import { mlfq } from './mlfq';

export const ALGORITHMS = {
  fcfs: {
    name: 'First Come First Serve',
    shortName: 'FCFS',
    fn: fcfs,
    type: 'Non-preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: 'Processes are executed in the order they arrive. Simple but can cause the convoy effect where a long process blocks many short ones.',
    pros: ['Simple to implement', 'Fair — no starvation', 'Predictable'],
    cons: ['Convoy effect', 'Poor average waiting time', 'Not optimal']
  },
  sjf: {
    name: 'Shortest Job First',
    shortName: 'SJF',
    fn: sjf,
    type: 'Non-preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: 'When the CPU is free, the process with the shortest burst time (among arrived processes) is selected. Optimal for minimizing average waiting time among non-preemptive algorithms.',
    pros: ['Optimal average waiting time (non-preemptive)', 'Better than FCFS'],
    cons: ['Starvation of long processes', 'Requires burst time prediction']
  },
  srt: {
    name: 'Shortest Remaining Time',
    shortName: 'SRT',
    fn: srt,
    type: 'Preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: 'Preemptive version of SJF. At every time unit, if a newly arrived process has less remaining time than the current one, the CPU switches to it.',
    pros: ['Optimal average waiting time overall', 'Very responsive'],
    cons: ['High context-switching overhead', 'Starvation possible', 'Requires remaining time tracking']
  },
  rr: {
    name: 'Round Robin',
    shortName: 'RR',
    fn: roundRobin,
    type: 'Preemptive',
    needsQuantum: true,
    needsPriority: false,
    description: 'Each process gets a fixed time slice (quantum). After the quantum expires, the process goes to the back of the queue. Ensures fair CPU distribution.',
    pros: ['Fair distribution', 'No starvation', 'Good for time-sharing'],
    cons: ['Performance depends on quantum size', 'Higher context switches than FCFS']
  },
  hrrn: {
    name: 'Highest Response Ratio Next',
    shortName: 'HRRN',
    fn: hrrn,
    type: 'Non-preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: 'Picks the process with the highest Response Ratio = (WaitingTime + BurstTime) / BurstTime. Naturally prevents starvation since waiting increases the ratio.',
    pros: ['Prevents starvation', 'Good balance of short and long processes'],
    cons: ['Requires burst time knowledge', 'Computation overhead for ratios']
  },
  priority: {
    name: 'Priority Scheduling',
    shortName: 'Priority',
    fn: priority,
    type: 'Non-preemptive',
    needsQuantum: false,
    needsPriority: true,
    description: 'Each process has a priority number (lower = higher priority). The highest-priority arrived process runs next. Used in real-time systems.',
    pros: ['Important processes run first', 'Good for real-time systems'],
    cons: ['Starvation of low-priority processes', 'Priority inversion possible']
  },
  feedback: {
    name: 'Feedback',
    shortName: 'FB',
    fn: feedback,
    type: 'Preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: 'Multi-level queue system. New processes start at the highest queue (quantum=1). After using its quantum, a process is demoted to the next lower queue.',
    pros: ['Favors short/interactive processes', 'Adaptive'],
    cons: ['Long processes may starve', 'Complex implementation']
  },
  fbv: {
    name: 'Feedback Variable Quantum',
    shortName: 'FBV',
    fn: feedbackVariable,
    type: 'Preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: 'Same as Feedback but the quantum doubles at each level (1, 2, 4, 8...). Gives longer time slices to CPU-bound processes at lower priorities.',
    pros: ['Less context switches than FB', 'Better for CPU-bound processes'],
    cons: ['Starvation still possible', 'More complex than FB']
  },
  aging: {
    name: 'Aging',
    shortName: 'Aging',
    fn: aging,
    type: 'Preemptive',
    needsQuantum: false,
    needsPriority: true,
    description: 'Priority scheduling with anti-starvation. Each tick, waiting processes gain priority. The current process resets to its initial priority. Inspired by Xinu OS.',
    pros: ['Prevents starvation', 'Combines priority with fairness'],
    cons: ['Higher overhead', 'Complex priority management']
  },
  mlfq: {
    name: 'Multi-Level Feedback Queue',
    shortName: 'MLFQ',
    fn: mlfq,
    type: 'Preemptive',
    needsQuantum: false,
    needsPriority: false,
    description: '3 levels: Level 1 uses RR(q=2), Level 2 uses RR(q=4), Level 3 uses FCFS. Processes start at Level 1 and get demoted if they don\'t finish within their quantum.',
    pros: ['Best of both worlds', 'Used in real OS kernels', 'Adaptive'],
    cons: ['Most complex to implement', 'Requires careful parameter tuning']
  }
};

export function runAlgorithm(name, processes, options = {}) {
  const algo = ALGORITHMS[name];
  if (!algo) return { error: `Unknown algorithm: ${name}` };
  if (processes.length === 0) return { error: 'No processes to schedule' };

  try {
    return { ...algo.fn(processes, options), algorithmName: algo.name, shortName: algo.shortName };
  } catch (err) {
    return { error: `Algorithm error: ${err.message}` };
  }
}

export function getAlgorithmList() {
  return Object.entries(ALGORITHMS).map(([key, algo]) => ({
    key,
    name: algo.name,
    shortName: algo.shortName,
    type: algo.type,
    needsQuantum: algo.needsQuantum,
    needsPriority: algo.needsPriority
  }));
}
