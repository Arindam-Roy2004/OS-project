import React, { useState, useRef, useEffect, useCallback } from 'react';
import figlet from 'figlet';
import { runAlgorithm, getAlgorithmList, ALGORITHMS } from '../algorithms';
import GanttChart from './GanttChart';
import ResultsTable from './ResultsTable';
import './Terminal.css';

const FALLBACK_BANNER = [
  { text: '', type: 'info' },
  { text: '  CPU Scheduling Algorithm Visualizer', type: 'header' },
  { text: '  Interactive terminal for OS scheduling simulation', type: 'dim' },
  { text: '  Type "help" to see available commands', type: 'dim' },
  { text: '', type: 'info' },
];

function makeBanner(figletText) {
  const artLines = figletText.split('\n').map(l => ({ text: '  ' + l, type: 'success' }));
  return [
    { text: '', type: 'info' },
    ...artLines,
    { text: '', type: 'info' },
    { text: '  Interactive terminal for OS scheduling simulation', type: 'dim' },
    { text: '  Type "help" to see available commands', type: 'dim' },
    { text: '', type: 'info' },
  ];
}

export default function Terminal() {
  const [lines, setLines] = useState(FALLBACK_BANNER);
  const [input, setInput] = useState('');
  const [processes, setProcesses] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [results, setResults] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);

  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const addLines = useCallback((newLines) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const handleCommand = useCallback((cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add command to history
    setHistory(prev => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);

    // Echo the command
    addLines([{ text: `$ ${trimmed}`, type: 'command' }]);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'help':
        handleHelp();
        break;
      case 'add':
        handleAdd(parts.slice(1));
        break;
      case 'list':
      case 'ls':
        handleList();
        break;
      case 'clear':
        setLines([]);
        setResults(null);
        setComparisonResults(null);
        break;
      case 'run':
        handleRun(parts.slice(1));
        break;
      case 'compare':
        handleCompare();
        break;
      case 'reset':
        setProcesses([]);
        setResults(null);
        setComparisonResults(null);
        addLines([{ text: 'All processes cleared.', type: 'success' }]);
        break;
      case 'info':
        handleInfo(parts[1]);
        break;
      case 'demo':
        handleDemo();
        break;
      default:
        addLines([
          { text: `Unknown command: ${command}`, type: 'error' },
          { text: 'Type "help" for available commands.', type: 'dim' }
        ]);
    }
  }, [processes]);

  const handleHelp = () => {
    addLines([
      { text: '', type: 'output' },
      { text: '  AVAILABLE COMMANDS', type: 'header' },
      { text: '  ──────────────────────────────────────────', type: 'dim' },
      { text: '  add <pid> <arrival> <burst> [priority]    Add a process', type: 'output' },
      { text: '  list                                      Show current processes', type: 'output' },
      { text: '  run <algorithm> [quantum]                 Run a scheduling algorithm', type: 'output' },
      { text: '  compare                                   Compare all algorithms', type: 'output' },
      { text: '  info <algorithm>                          Show algorithm details', type: 'output' },
      { text: '  demo                                      Load demo processes', type: 'output' },
      { text: '  reset                                     Clear all processes', type: 'output' },
      { text: '  clear                                     Clear terminal', type: 'output' },
      { text: '  help                                      Show this help', type: 'output' },
      { text: '', type: 'output' },
      { text: '  AVAILABLE ALGORITHMS', type: 'header' },
      { text: '  ──────────────────────────────────────────', type: 'dim' },
      ...getAlgorithmList().map(a =>
        ({ text: `  ${a.key.padEnd(12)} ${a.name} (${a.type})`, type: 'output' })
      ),
      { text: '', type: 'output' },
      { text: '  EXAMPLE WORKFLOW', type: 'header' },
      { text: '  ──────────────────────────────────────────', type: 'dim' },
      { text: '  $ demo                    # Load sample processes', type: 'dim' },
      { text: '  $ run fcfs                # Run FCFS algorithm', type: 'dim' },
      { text: '  $ run rr 3                # Run Round Robin with quantum=3', type: 'dim' },
      { text: '  $ compare                 # Compare all algorithms', type: 'dim' },
      { text: '', type: 'output' },
    ]);
  };

  const handleAdd = (args) => {
    if (args.length < 3) {
      addLines([
        { text: 'Usage: add <pid> <arrival> <burst> [priority]', type: 'error' },
        { text: 'Example: add 1 0 5', type: 'dim' }
      ]);
      return;
    }

    const pid = parseInt(args[0]);
    const arrival = parseInt(args[1]);
    const burst = parseInt(args[2]);
    const priority = args[3] ? parseInt(args[3]) : 0;

    if (isNaN(pid) || isNaN(arrival) || isNaN(burst)) {
      addLines([{ text: 'Error: PID, arrival, and burst must be numbers.', type: 'error' }]);
      return;
    }
    if (burst <= 0) {
      addLines([{ text: 'Error: Burst time must be positive.', type: 'error' }]);
      return;
    }
    if (arrival < 0) {
      addLines([{ text: 'Error: Arrival time cannot be negative.', type: 'error' }]);
      return;
    }
    if (processes.some(p => p.pid === pid)) {
      addLines([{ text: `Error: Process with PID ${pid} already exists.`, type: 'error' }]);
      return;
    }

    const proc = { pid, arrival, burst, priority };
    setProcesses(prev => [...prev, proc]);
    addLines([
      { text: `✓ Process added: PID=${pid}, Arrival=${arrival}, Burst=${burst}${args[3] ? `, Priority=${priority}` : ''}`, type: 'success' }
    ]);
  };

  const handleList = () => {
    if (processes.length === 0) {
      addLines([{ text: 'No processes added yet. Use "add <pid> <arrival> <burst>" or "demo".', type: 'warning' }]);
      return;
    }

    addLines([
      { text: '', type: 'output' },
      { text: `  ${'PID'.padEnd(8)}${'Arrival'.padEnd(10)}${'Burst'.padEnd(10)}${'Priority'.padEnd(10)}`, type: 'header' },
      { text: '  ' + '─'.repeat(38), type: 'dim' },
      ...processes.map(p => ({
        text: `  ${String(p.pid).padEnd(8)}${String(p.arrival).padEnd(10)}${String(p.burst).padEnd(10)}${String(p.priority).padEnd(10)}`,
        type: 'output'
      })),
      { text: `  Total: ${processes.length} process(es)`, type: 'dim' },
      { text: '', type: 'output' }
    ]);
  };

  const handleRun = (args) => {
    if (args.length === 0) {
      addLines([
        { text: 'Usage: run <algorithm> [quantum]', type: 'error' },
        { text: 'Example: run fcfs  or  run rr 3', type: 'dim' }
      ]);
      return;
    }

    const algoKey = args[0].toLowerCase();
    if (!ALGORITHMS[algoKey]) {
      addLines([
        { text: `Unknown algorithm: ${algoKey}`, type: 'error' },
        { text: `Available: ${Object.keys(ALGORITHMS).join(', ')}`, type: 'dim' }
      ]);
      return;
    }

    if (processes.length === 0) {
      addLines([{ text: 'No processes to schedule. Use "add" or "demo" first.', type: 'error' }]);
      return;
    }

    const algo = ALGORITHMS[algoKey];
    const options = {};
    if (algo.needsQuantum) {
      const q = parseInt(args[1]);
      if (!q || q <= 0) {
        addLines([{ text: `${algo.shortName} requires a quantum. Usage: run ${algoKey} <quantum>`, type: 'error' }]);
        return;
      }
      options.quantum = q;
    }

    addLines([
      { text: `Running ${algo.name} (${algo.type})...`, type: 'info' },
    ]);

    const result = runAlgorithm(algoKey, processes, options);
    if (result.error) {
      addLines([{ text: `Error: ${result.error}`, type: 'error' }]);
      return;
    }

    // Show results in terminal
    addLines([
      { text: '', type: 'output' },
      { text: `  ═══ ${result.algorithmName} Results ═══`, type: 'header' },
      { text: '', type: 'output' },
      { text: `  ${'PID'.padEnd(6)}${'AT'.padEnd(6)}${'BT'.padEnd(6)}${'CT'.padEnd(6)}${'TAT'.padEnd(6)}${'WT'.padEnd(6)}${'RT'.padEnd(6)}`, type: 'header' },
      { text: '  ' + '─'.repeat(42), type: 'dim' },
      ...result.results.map(r => ({
        text: `  ${String(r.pid).padEnd(6)}${String(r.arrival).padEnd(6)}${String(r.burst).padEnd(6)}${String(r.completion).padEnd(6)}${String(r.turnaround).padEnd(6)}${String(r.waiting).padEnd(6)}${String(r.response).padEnd(6)}`,
        type: 'output'
      })),
      { text: '  ' + '─'.repeat(42), type: 'dim' },
      { text: `  Avg TAT: ${result.averages.avgTurnaround.toFixed(2)}  |  Avg WT: ${result.averages.avgWaiting.toFixed(2)}  |  Avg RT: ${result.averages.avgResponse.toFixed(2)}`, type: 'success' },
      { text: '', type: 'output' }
    ]);

    setResults({ ...result, algoKey, options });
    setComparisonResults(null);
  };

  const handleCompare = () => {
    if (processes.length === 0) {
      addLines([{ text: 'No processes. Use "add" or "demo" first.', type: 'error' }]);
      return;
    }

    addLines([{ text: 'Comparing all algorithms...', type: 'info' }]);

    const allResults = {};
    for (const [key, algo] of Object.entries(ALGORITHMS)) {
      const options = {};
      if (algo.needsQuantum) options.quantum = 2; // default quantum for comparison
      const result = runAlgorithm(key, processes, options);
      if (!result.error) {
        allResults[key] = result;
      }
    }

    // Show comparison table
    addLines([
      { text: '', type: 'output' },
      { text: '  ═══ Algorithm Comparison ═══', type: 'header' },
      { text: '', type: 'output' },
      { text: `  ${'Algorithm'.padEnd(16)}${'Avg TAT'.padEnd(12)}${'Avg WT'.padEnd(12)}${'Avg RT'.padEnd(12)}`, type: 'header' },
      { text: '  ' + '─'.repeat(52), type: 'dim' },
      ...Object.entries(allResults).map(([key, r]) => ({
        text: `  ${ALGORITHMS[key].shortName.padEnd(16)}${r.averages.avgTurnaround.toFixed(2).padEnd(12)}${r.averages.avgWaiting.toFixed(2).padEnd(12)}${r.averages.avgResponse.toFixed(2).padEnd(12)}`,
        type: 'output'
      })),
      { text: '', type: 'output' },
    ]);

    // Find best algorithm
    let bestWT = Infinity, bestAlgo = '';
    for (const [key, r] of Object.entries(allResults)) {
      if (r.averages.avgWaiting < bestWT) {
        bestWT = r.averages.avgWaiting;
        bestAlgo = ALGORITHMS[key].shortName;
      }
    }
    addLines([
      { text: `  ★ Best avg waiting time: ${bestAlgo} (${bestWT.toFixed(2)})`, type: 'success' },
      { text: '', type: 'output' }
    ]);

    setComparisonResults(allResults);
    setResults(null);
  };

  const handleInfo = (algoKey) => {
    if (!algoKey) {
      addLines([{ text: 'Usage: info <algorithm>', type: 'error' }]);
      return;
    }
    const key = algoKey.toLowerCase();
    const algo = ALGORITHMS[key];
    if (!algo) {
      addLines([{ text: `Unknown algorithm: ${key}`, type: 'error' }]);
      return;
    }
    addLines([
      { text: '', type: 'output' },
      { text: `  ═══ ${algo.name} (${algo.shortName}) ═══`, type: 'header' },
      { text: `  Type: ${algo.type}`, type: 'info' },
      { text: '', type: 'output' },
      { text: `  ${algo.description}`, type: 'output' },
      { text: '', type: 'output' },
      { text: '  Pros:', type: 'success' },
      ...algo.pros.map(p => ({ text: `    ✓ ${p}`, type: 'success' })),
      { text: '  Cons:', type: 'error' },
      ...algo.cons.map(c => ({ text: `    ✗ ${c}`, type: 'error' })),
      { text: '', type: 'output' },
      ...(algo.needsQuantum ? [{ text: `  ⚙ Requires quantum parameter: run ${key} <quantum>`, type: 'warning' }] : []),
      ...(algo.needsPriority ? [{ text: '  ⚙ Uses priority: add <pid> <arrival> <burst> <priority>', type: 'warning' }] : []),
      { text: '', type: 'output' }
    ]);
  };

  const handleDemo = () => {
    const demoProcesses = [
      { pid: 1, arrival: 0, burst: 5, priority: 3 },
      { pid: 2, arrival: 1, burst: 3, priority: 1 },
      { pid: 3, arrival: 2, burst: 8, priority: 4 },
      { pid: 4, arrival: 3, burst: 2, priority: 2 },
      { pid: 5, arrival: 4, burst: 4, priority: 5 },
    ];
    setProcesses(demoProcesses);
    setResults(null);
    setComparisonResults(null);
    addLines([
      { text: '✓ Demo processes loaded:', type: 'success' },
      { text: '', type: 'output' },
      { text: `  ${'PID'.padEnd(8)}${'Arrival'.padEnd(10)}${'Burst'.padEnd(10)}${'Priority'.padEnd(10)}`, type: 'header' },
      { text: '  ' + '─'.repeat(38), type: 'dim' },
      ...demoProcesses.map(p => ({
        text: `  ${String(p.pid).padEnd(8)}${String(p.arrival).padEnd(10)}${String(p.burst).padEnd(10)}${String(p.priority).padEnd(10)}`,
        type: 'output'
      })),
      { text: '', type: 'output' },
      { text: '  Try: run fcfs, run rr 3, or compare', type: 'dim' }
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="terminal-wrapper">
      <div className="terminal-container" onClick={focusInput}>
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <span className="terminal-title">cpu-scheduler — bash</span>
        </div>
        <div className="terminal-output" ref={outputRef}>
          {lines.map((line, i) => (
            <div key={i} className={`term-line term-${line.type}`}>
              {line.text}
            </div>
          ))}
        </div>
        <div className="terminal-input-line">
          <span className="terminal-prompt">$&nbsp;</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      {/* Visualization area */}
      {results && (
        <div className="results-area">
          <GanttChart
            timeline={results.timeline}
            processes={processes}
            algorithmName={results.algorithmName}
          />
          <ResultsTable
            results={results.results}
            averages={results.averages}
            algorithmName={results.algorithmName}
            processes={processes}
          />
        </div>
      )}

      {comparisonResults && (
        <div className="results-area comparison-area">
          <h2 className="comparison-title">📊 Algorithm Comparison</h2>
          {Object.entries(comparisonResults).map(([key, result]) => (
            <div key={key} className="comparison-block">
              <GanttChart
                timeline={result.timeline}
                processes={processes}
                algorithmName={result.algorithmName}
                compact
              />
            </div>
          ))}
          <ResultsTable
            comparison={comparisonResults}
            processes={processes}
          />
        </div>
      )}
    </div>
  );
}
