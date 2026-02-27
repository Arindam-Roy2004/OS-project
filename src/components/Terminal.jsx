import React, { useState, useRef, useEffect, useCallback } from 'react';
import figlet from 'figlet';
import { runAlgorithm, getAlgorithmList, ALGORITHMS } from '../algorithms';
import { chalk, boxen, createSpinner, gradient, cliTable, inquirerList } from '../utils/cliTools';
import { getCommandSuggestion, askSchedulingQuestion, getAlgorithmRecommendation, analyzeResults, chatWithAI } from '../services/aiService';
import './Terminal.css';

// Fallback banner before figlet loads
const FALLBACK_BANNER = [
  { text: '', type: 'info' },
  { text: '  CPU Scheduling Algorithm Visualizer', type: 'header' },
  { text: '  Interactive terminal for OS scheduling simulation', type: 'dim' },
  { text: '  Type "help" to see available commands', type: 'dim' },
  { text: '', type: 'info' },
];

// spinner stuff for boot animation
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Boot sequence messages
const BOOT_STEPS = [
  { msg: 'Loading scheduling engine', delay: 400 },
  { msg: 'Initializing algorithms', delay: 350 },
  { msg: 'Rendering visualizer modules', delay: 400 },
  { msg: 'Mounting terminal interface', delay: 300 },
];

function makeBannerArt(figletText) {
  return figletText.split('\n').map(l => ({ text: '  ' + l, type: 'success' }));
}

// renders the timeline as colored blocks
function renderTextGantt(timeline, processes) {
  if (!timeline || timeline.length === 0) return [];

  const maxTime = Math.max(...timeline.map(t => t.end));
  const totalWidth = 60; // Characters width
  const scale = totalWidth / maxTime;

  // Colors cycle
  const COLORS = ['bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite'];
  const getPIDColor = (pid) => COLORS[(pid - 1) % COLORS.length];

  let ganttRow = [];
  let legend = [];
  let timeAxis = [];

  // 1. Build Gantt Bar
  // Merge consecutive segments
  const merged = [];
  for (const seg of timeline) {
    const last = merged[merged.length - 1];
    if (last && last.pid === seg.pid && last.end === seg.start) {
      last.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }

  let currentPos = 0;
  merged.forEach(seg => {
    const duration = seg.end - seg.start;
    const width = Math.max(1, Math.round(duration * scale)); // At least 1 char

    // Gap if idle
    if (seg.start > currentPos) {
      const gap = Math.round((seg.start - currentPos) * scale);
      if (gap > 0) ganttRow.push({ text: ' '.repeat(gap), type: 'dim' });
    }

    if (seg.pid === 'idle') {
      ganttRow.push({ text: '░'.repeat(width), type: 'dim' });
    } else {
      const colorFn = chalk[getPIDColor(seg.pid)] || chalk.bgWhite;
      // Center PID in the block if distinct enough
      const segText = width > 3 ? ` P${seg.pid}`.padEnd(width) : ' '.repeat(width);
      ganttRow.push(colorFn(segText));
    }
    currentPos = seg.end;
  });

  // 2. Build Legend
  const uniquePids = [...new Set(processes.map(p => p.pid))].sort((a, b) => a - b);
  legend = uniquePids.map(pid => {
    const colorFn = chalk[getPIDColor(pid)] || chalk.bgWhite;
    return colorFn(` P${pid} `);
  });

  // Return line objects
  return [
    { text: '', type: 'output' },
    chalk.white('  Timeline Visualization:'),
    { text: '  ' + ganttRow.map(i => i.text).join(''), type: 'output', isHtml: true, parts: ganttRow },
    // Hack: Terminal renders parts if available, or we just rely on renderLine logic if we flat it.
    // Actually renderLine in Terminal.jsx expects a single `text` string or we need to update renderLine to support spans.
    // simpler approach: one line is one color.
    // Ah, renderLine does not support multi-color lines yet! 
    // I need to update renderLine to support an array of spans.
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
  const [spinnerInterval, setSpinnerInterval] = useState(null);
  const [booting, setBooting] = useState(true);
  const [bannerLines, setBannerLines] = useState(FALLBACK_BANNER);
  const [aiMode, setAiMode] = useState(false);
  const aiHistoryRef = useRef([]);

  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // figlet + boot animation on mount
  useEffect(() => {
    let cancelled = false;

    async function bootSequence() {
      // 1. Load figlet font
      let artLines;
      try {
        const font = await import('figlet/importable-fonts/ANSI Regular');
        figlet.parseFont('ANSI Regular', font.default);
        const art = figlet.textSync('CPU Sched', { font: 'ANSI Regular' });
        artLines = makeBannerArt(art);
      } catch {
        artLines = [{ text: '  CPU Scheduling Algorithm Visualizer', type: 'header' }];
      }

      if (cancelled) return;

      // 2. Show ASCII art immediately
      setLines([
        { text: '', type: 'info' },
        ...artLines,
        { text: '', type: 'info' },
      ]);

      // 3. Run boot steps with spinner animation
      for (const step of BOOT_STEPS) {
        if (cancelled) return;

        // Add spinner line
        let frameIdx = 0;
        const spinnerLine = { text: `  ${SPINNER[0]} ${step.msg}...`, type: 'info' };

        setLines(prev => [...prev, spinnerLine]);

        // Animate spinner
        const interval = setInterval(() => {
          if (cancelled) return;
          frameIdx = (frameIdx + 1) % SPINNER.length;
          setLines(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              text: `  ${SPINNER[frameIdx]} ${step.msg}...`,
              type: 'info',
            };
            return updated;
          });
        }, 80);

        // Wait for step duration
        await new Promise(r => setTimeout(r, step.delay));
        clearInterval(interval);

        if (cancelled) return;

        // Replace spinner with checkmark
        setLines(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            text: `  ✔ ${step.msg}`,
            type: 'success',
          };
          return updated;
        });
      }

      if (cancelled) return;

      // 4. System Ready message (gradient) + Info Box
      await new Promise(r => setTimeout(r, 200));

      const infoBox = boxen(
        'Interactive terminal for OS scheduling simulation\nType "help" to see available commands',
        {
          padding: 0,
          borderStyle: 'round',
          borderColor: 'dim',
          textColor: 'dim',
        }
      );

      setLines(prev => {
        const finalBanner = [
          ...prev,
          { text: '', type: 'info' },
          gradient.mind('  >> SYSTEM READY <<'),
          { text: '', type: 'info' },
          ...infoBox,
          { text: '', type: 'info' },
        ];
        // Store the banner for clear command
        setBannerLines(finalBanner);
        return finalBanner;
      });

      setBooting(false);
    }

    bootSequence();
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Cleanup spinner on unmount
  useEffect(() => {
    return () => {
      if (spinnerInterval) clearInterval(spinnerInterval);
    };
  }, [spinnerInterval]);

  // Focus input on click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const addLines = useCallback((newLines) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  // shows spinner while running algo, looks cool
  const runWithSpinner = useCallback((text, task, duration = 600) => {
    return new Promise((resolve) => {
      const spinner = createSpinner(text);
      const spinnerLineIdx = { current: null };

      // Add initial spinner frame
      setLines(prev => {
        spinnerLineIdx.current = prev.length;
        return [...prev, spinner.getFrame()];
      });

      // Animate spinner
      const interval = setInterval(() => {
        setLines(prev => {
          const updated = [...prev];
          if (spinnerLineIdx.current !== null) {
            updated[spinnerLineIdx.current] = spinner.getFrame();
          }
          return updated;
        });
      }, 80);

      setSpinnerInterval(interval);

      // After duration, stop spinner and run task
      setTimeout(() => {
        clearInterval(interval);
        setSpinnerInterval(null);

        const result = task();

        // Replace spinner with success/fail
        setLines(prev => {
          const updated = [...prev];
          if (spinnerLineIdx.current !== null) {
            updated[spinnerLineIdx.current] = result.error
              ? spinner.fail(result.error)
              : spinner.succeed(`${text} — done`);
          }
          return updated;
        });

        resolve(result);
      }, duration);
    });
  }, []);

  const handleCommand = useCallback((cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add command to history
    setHistory(prev => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);

    // chalk: Echo the command with styling
    addLines([chalk.white(`$ ${trimmed}`)]);

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
        setLines([...bannerLines]);
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
        addLines([chalk.green('✔ All processes cleared.')]);
        break;
      case 'info':
        handleInfo(parts[1]);
        break;
      case 'demo':
        handleDemo();
        break;
      case 'ai-help':
        handleAiHelp();
        break;
      case 'ai':
        handleAI(parts.slice(1).join(' '));
        break;
      case 'suggest':
        handleSuggest();
        break;
      case 'analyze':
        handleAnalyze();
        break;
      default:
        handleUnknownCommand(command, trimmed);
    }
  }, [processes, bannerLines]);

  // help command
  const handleHelp = () => {
    const helpBox = boxen(
      'Type any command below to get started\nUse arrow keys ↑↓ for command history',
      {
        padding: 0,
        borderStyle: 'round',
        borderColor: 'dim',
        textColor: 'dim',
        title: 'QUICK START',
        titleColor: 'header',
      }
    );

    const algoRows = getAlgorithmList().map(a => [a.key, a.name, a.type]);

    addLines([
      { text: '', type: 'output' },
      // chalk: styled header
      chalk.yellowBold('  COMMANDS'),
      chalk.dim('  ──────────────────────────────────────────'),
      chalk.white('  add <pid> <arrival> <burst> [priority]    Add a process'),
      chalk.white('  list                                      Show current processes'),
      chalk.white('  run <algorithm> [quantum]                 Run a scheduling algorithm'),
      chalk.white('  compare                                   Compare all algorithms'),
      chalk.white('  info <algorithm>                          Show algorithm details'),
      chalk.white('  demo                                      Load demo processes'),
      chalk.white('  reset                                     Clear all processes'),
      chalk.white('  clear                                     Clear terminal'),
      chalk.white('  help                                      Show this help'),
      { text: '', type: 'output' },
      chalk.yellowBold('  AI COMMANDS'),
      chalk.dim('  ──────────────────────────────────────────'),
      chalk.white('  ai-help                                   Start interactive AI chat'),
      chalk.white('  ai <question>                             Quick AI question'),
      chalk.white('  suggest                                   AI recommends best algorithm'),
      chalk.white('  analyze                                   AI analyzes last run results'),
      { text: '', type: 'output' },
      // chalk: styled header
      chalk.yellowBold('  ALGORITHMS'),
      chalk.dim('  ──────────────────────────────────────────'),
      // cli-table3: formatted table
      ...cliTable(
        ['Key', 'Name', 'Type'],
        algoRows,
        { headerColor: 'header', rowColor: 'output', borderColor: 'dim' }
      ),
      { text: '', type: 'output' },
      // boxen: info box
      ...helpBox,
      { text: '', type: 'output' },
    ]);
  };

  const handleAdd = (args) => {
    if (args.length < 3) {
      addLines([
        chalk.red('  ✖ Usage: add <pid> <arrival> <burst> [priority]'),
        chalk.dim('  Example: add 1 0 5')
      ]);
      return;
    }

    const pid = parseInt(args[0]);
    const arrival = parseInt(args[1]);
    const burst = parseInt(args[2]);
    const priority = args[3] ? parseInt(args[3]) : 0;

    if (isNaN(pid) || isNaN(arrival) || isNaN(burst)) {
      addLines([chalk.red('  ✖ PID, arrival, and burst must be numbers.')]);
      return;
    }
    if (burst <= 0) {
      addLines([chalk.red('  ✖ Burst time must be positive.')]);
      return;
    }
    if (arrival < 0) {
      addLines([chalk.red('  ✖ Arrival time cannot be negative.')]);
      return;
    }
    if (processes.some(p => p.pid === pid)) {
      addLines([chalk.red(`  ✖ Process with PID ${pid} already exists.`)]);
      return;
    }

    const proc = { pid, arrival, burst, priority };
    setProcesses(prev => [...prev, proc]);
    addLines([
      chalk.green(`  ✔ Process added: PID=${pid}, Arrival=${arrival}, Burst=${burst}${args[3] ? `, Priority=${priority}` : ''}`)
    ]);
  };

  // shows all processes in a table
  const handleList = () => {
    if (processes.length === 0) {
      addLines([chalk.yellow('  ⚠ No processes added yet. Use "add" or "demo".')]);
      return;
    }

    const rows = processes.map(p => [p.pid, p.arrival, p.burst, p.priority]);

    addLines([
      { text: '', type: 'output' },
      // cli-table3: formatted table
      ...cliTable(
        ['PID', 'Arrival', 'Burst', 'Priority'],
        rows,
        { headerColor: 'header', rowColor: 'output', borderColor: 'dim' }
      ),
      chalk.dim(`  Total: ${processes.length} process(es)`),
      { text: '', type: 'output' },
    ]);
  };

  // runs the scheduling algo
  const handleRun = async (args) => {
    if (args.length === 0) {
      addLines([
        chalk.red('  ✖ Usage: run <algorithm> [quantum]'),
        chalk.dim('  Example: run fcfs  or  run rr 3')
      ]);
      return;
    }

    const algoKey = args[0].toLowerCase();
    if (!ALGORITHMS[algoKey]) {
      addLines([
        chalk.red(`  ✖ Unknown algorithm: ${algoKey}`),
        chalk.dim(`  Available: ${Object.keys(ALGORITHMS).join(', ')}`)
      ]);
      return;
    }

    if (processes.length === 0) {
      addLines([chalk.red('  ✖ No processes to schedule. Use "add" or "demo" first.')]);
      return;
    }

    const algo = ALGORITHMS[algoKey];
    const options = {};
    if (algo.needsQuantum) {
      const q = parseInt(args[1]);
      if (!q || q <= 0) {
        // inquirer-style prompt
        addLines([
          ...inquirerList(`${algo.shortName} requires a time quantum:`, [
            `run ${algoKey} 2`,
            `run ${algoKey} 3`,
            `run ${algoKey} 4`,
          ]),
        ]);
        return;
      }
      options.quantum = q;
    }

    // ora: Run with spinner animation
    const result = await runWithSpinner(
      `Running ${algo.name} (${algo.type})...`,
      () => runAlgorithm(algoKey, processes, options),
      600
    );

    if (result.error) {
      return;
    }

    // Build results rows for cli-table3
    const resultRows = result.results.map(r => [
      r.pid, r.arrival, r.burst, r.completion, r.turnaround, r.waiting, r.response
    ]);

    // boxen: Summary box with averages
    const summaryBox = boxen(
      `Avg TAT: ${result.averages.avgTurnaround.toFixed(2)}  │  Avg WT: ${result.averages.avgWaiting.toFixed(2)}  │  Avg RT: ${result.averages.avgResponse.toFixed(2)}`,
      {
        padding: 0,
        borderStyle: 'round',
        borderColor: 'success',
        textColor: 'success',
      }
    );

    addLines([
      { text: '', type: 'output' },
      // gradient-string: Result header
      gradient.vice(`  ═══ ${result.algorithmName} Results ═══`),
      { text: '', type: 'output' },
      // cli-table3: Results table
      ...cliTable(
        ['PID', 'AT', 'BT', 'CT', 'TAT', 'WT', 'RT'],
        resultRows,
        { headerColor: 'header', rowColor: 'output', borderColor: 'dim' }
      ),
      { text: '', type: 'output' },
      // boxen: Summary
      ...summaryBox,
      { text: '', type: 'output' },
      // Text Gantt Chart
      ...renderTextGantt(result.timeline, processes),
      { text: '', type: 'output' },
    ]);

    setResults({ ...result, algoKey, options });
    setComparisonResults(null);
  };

  // compares all algorithms side by side
  const handleCompare = async () => {
    if (processes.length === 0) {
      addLines([chalk.red('  ✖ No processes. Use "add" or "demo" first.')]);
      return;
    }

    // ora: Spinner while computing
    const allResults = await runWithSpinner(
      'Comparing all algorithms...',
      () => {
        const results = {};
        for (const [key, algo] of Object.entries(ALGORITHMS)) {
          const opts = {};
          if (algo.needsQuantum) opts.quantum = 2;
          const result = runAlgorithm(key, processes, opts);
          if (!result.error) results[key] = result;
        }
        return results;
      },
      800
    );

    // cli-table3: Comparison table
    const compRows = Object.entries(allResults).map(([key, r]) => [
      ALGORITHMS[key].shortName,
      r.averages.avgTurnaround.toFixed(2),
      r.averages.avgWaiting.toFixed(2),
      r.averages.avgResponse.toFixed(2),
    ]);

    // Find best
    let bestWT = Infinity, bestAlgo = '';
    for (const [key, r] of Object.entries(allResults)) {
      if (r.averages.avgWaiting < bestWT) {
        bestWT = r.averages.avgWaiting;
        bestAlgo = ALGORITHMS[key].shortName;
      }
    }

    // boxen: Winner box
    const winnerBox = boxen(
      `★ Best avg waiting time: ${bestAlgo} (${bestWT.toFixed(2)})`,
      {
        padding: 0,
        borderStyle: 'bold',
        borderColor: 'success',
        textColor: 'success',
      }
    );

    addLines([
      { text: '', type: 'output' },
      gradient.rainbow('  ═══ Algorithm Comparison ═══'),
      { text: '', type: 'output' },
      ...cliTable(
        ['Algorithm', 'Avg TAT', 'Avg WT', 'Avg RT'],
        compRows,
        { headerColor: 'header', rowColor: 'output', borderColor: 'dim' }
      ),
      { text: '', type: 'output' },
      ...winnerBox,
      { text: '', type: 'output' },
    ]);

    setComparisonResults(allResults);
    setResults(null);
  };

  // shows details about a specific algo
  const handleInfo = (algoKey) => {
    if (!algoKey) {
      addLines([chalk.red('  ✖ Usage: info <algorithm>')]);
      return;
    }
    const key = algoKey.toLowerCase();
    const algo = ALGORITHMS[key];
    if (!algo) {
      addLines([chalk.red(`  ✖ Unknown algorithm: ${key}`)]);
      return;
    }

    const detailLines = [
      `${algo.name} (${algo.shortName})`,
      `Type: ${algo.type}`,
      '',
      algo.description,
    ];

    const detailBox = boxen(detailLines.join('\n'), {
      padding: 1,
      borderStyle: 'double',
      borderColor: 'info',
      textColor: 'output',
      title: algo.shortName,
      titleColor: 'header',
    });

    addLines([
      { text: '', type: 'output' },
      ...detailBox,
      { text: '', type: 'output' },
      chalk.greenBold('  Pros:'),
      ...algo.pros.map(p => chalk.green(`    ✔ ${p}`)),
      chalk.redBold('  Cons:'),
      ...algo.cons.map(c => chalk.red(`    ✖ ${c}`)),
      { text: '', type: 'output' },
      ...(algo.needsQuantum ? [chalk.yellow(`  ⚙ Requires quantum: run ${key} <quantum>`)] : []),
      ...(algo.needsPriority ? [chalk.yellow('  ⚙ Uses priority: add <pid> <arrival> <burst> <priority>')] : []),
      { text: '', type: 'output' },
    ]);
  };

  // loads some sample processes for testing
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

    const rows = demoProcesses.map(p => [p.pid, p.arrival, p.burst, p.priority]);

    // boxen: hint box
    const hintBox = boxen(
      'Try: run fcfs, run rr 3, or compare',
      {
        padding: 0,
        borderStyle: 'round',
        borderColor: 'dim',
        textColor: 'dim',
      }
    );

    addLines([
      chalk.green('  ✔ Demo processes loaded:'),
      { text: '', type: 'output' },
      // cli-table3: process table
      ...cliTable(
        ['PID', 'Arrival', 'Burst', 'Priority'],
        rows,
        { headerColor: 'header', rowColor: 'output', borderColor: 'dim' }
      ),
      { text: '', type: 'output' },
      ...hintBox,
    ]);
  };

  // ─── AI COMMAND HANDLERS ────────────────────────

  const handleAiHelp = () => {
    setAiMode(true);
    aiHistoryRef.current = [];

    const welcomeBox = boxen(
      'Interactive AI Chat — OS Scheduling Tutor\n\nAsk anything about scheduling algorithms, OS concepts,\nor how to use this simulator.\n\nType "exit" to leave AI mode.',
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'info',
        textColor: 'output',
        title: '🤖 AI HELP',
        titleColor: 'info',
      }
    );

    addLines([
      { text: '', type: 'output' },
      ...welcomeBox,
      { text: '', type: 'output' },
      chalk.dim('  Entering AI mode... prompt changed to ai>'),
      { text: '', type: 'output' },
    ]);
  };

  const handleAiModeInput = async (text) => {
    const trimmed = text.trim();

    // Echo user input
    addLines([chalk.cyan(`  ai> ${trimmed}`)]);

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      setAiMode(false);
      aiHistoryRef.current = [];
      addLines([
        { text: '', type: 'output' },
        chalk.green('  ✔ Exited AI mode. Back to normal terminal.'),
        chalk.dim('  Type "help" for commands.'),
        { text: '', type: 'output' },
      ]);
      return;
    }

    if (!trimmed) return;

    addLines([chalk.dim('  🤖 Thinking...')]);

    try {
      const reply = await chatWithAI(trimmed, aiHistoryRef.current);

      // Store conversation context
      aiHistoryRef.current.push({ role: 'user', content: trimmed });
      aiHistoryRef.current.push({ role: 'assistant', content: reply });
      // Keep last 8 messages for context
      if (aiHistoryRef.current.length > 8) {
        aiHistoryRef.current = aiHistoryRef.current.slice(-8);
      }

      const replyLines = reply.split('\n').filter(l => l.trim());

      const aiBox = boxen(
        replyLines.join('\n'),
        {
          padding: 0,
          borderStyle: 'round',
          borderColor: 'info',
          textColor: 'output',
          title: '🤖',
          titleColor: 'info',
        }
      );

      // Replace the "Thinking..." line with actual response
      setLines(prev => {
        const updated = [...prev];
        // Remove last line (Thinking...)
        updated.pop();
        return [...updated, ...aiBox, { text: '', type: 'output' }];
      });
    } catch {
      setLines(prev => {
        const updated = [...prev];
        updated.pop();
        return [...updated, chalk.red('  ✖ AI request failed. Try again.'), { text: '', type: 'output' }];
      });
    }
  };

  const handleUnknownCommand = async (command, fullInput) => {
    addLines([
      chalk.red(`  ✖ Unknown command: ${command}`),
      chalk.dim('  🤖 Asking AI for suggestions...'),
    ]);

    try {
      const suggestion = await getCommandSuggestion(fullInput);
      const suggestionLines = suggestion.split('\n').filter(l => l.trim());

      const aiBox = boxen(
        suggestionLines.join('\n'),
        {
          padding: 0,
          borderStyle: 'round',
          borderColor: 'info',
          textColor: 'output',
          title: '🤖 AI Suggestion',
          titleColor: 'info',
        }
      );

      addLines([
        ...aiBox,
        { text: '', type: 'output' },
      ]);
    } catch {
      addLines([chalk.dim('  Type "help" for available commands.')]);
    }
  };

  const handleAI = async (question) => {
    if (!question.trim()) {
      addLines([
        chalk.red('  ✖ Usage: ai <question>'),
        chalk.dim('  Example: ai what is the convoy effect in FCFS?'),
      ]);
      return;
    }

    const spinner = createSpinner('Thinking...');
    let spinnerIdx = -1;

    setLines(prev => {
      spinnerIdx = prev.length;
      return [...prev, spinner.getFrame()];
    });

    const interval = setInterval(() => {
      setLines(prev => {
        if (spinnerIdx === -1) return prev;
        const updated = [...prev];
        // Ensure we are updating the correct line (the last one usually)
        // Check if the lines array has changed size drastically (e.g. clear command)
        if (updated.length <= spinnerIdx) return prev; 
        updated[spinnerIdx] = spinner.getFrame();
        return updated;
      });
    }, 80);

    try {
      const answer = await askSchedulingQuestion(question);
      clearInterval(interval);
      
      const answerLines = answer.split('\n').filter(l => l.trim());
      
      setLines(prev => {
        const updated = [...prev];
        // Replace spinner line with header or remove it
        if (spinnerIdx !== -1 && updated.length > spinnerIdx) {
            updated[spinnerIdx] = chalk.cyan('  🤖 AI Response:');
        }
        return [
            ...updated,
            ...answerLines.map(l => ({ text: '  ' + l, type: 'output' })), // uniform simple text
            { text: '', type: 'output' }
        ];
      });

    } catch (err) {
      clearInterval(interval);
      setLines(prev => {
        const updated = [...prev];
         if (spinnerIdx !== -1 && updated.length > spinnerIdx) {
            updated[spinnerIdx] = chalk.red('  ✖ AI request failed.');
        }
        return updated;
      });
    }
  };

  const handleSuggest = async () => {
    if (processes.length === 0) {
      addLines([chalk.red('  ✖ No processes loaded. Use "add" or "demo" first.')]);
      return;
    }

    addLines([chalk.dim('  🤖 Analyzing processes...')]);

    try {
      const recommendation = await getAlgorithmRecommendation(processes);
      const recLines = recommendation.split('\n').filter(l => l.trim());

      const aiBox = boxen(
        recLines.join('\n'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'success',
          textColor: 'output',
          title: '🤖 AI Recommendation',
          titleColor: 'success',
        }
      );

      addLines([
        { text: '', type: 'output' },
        ...aiBox,
        { text: '', type: 'output' },
      ]);
    } catch {
      addLines([chalk.red('  ✖ AI is currently unavailable. Try again later.')]);
    }
  };

  const handleAnalyze = async () => {
    if (!results) {
      addLines([chalk.red('  ✖ No results to analyze. Run an algorithm first.')]);
      return;
    }

    addLines([chalk.dim(' ֎ Analyzing results...')]);

    try {
      const analysis = await analyzeResults(
        results.algorithmName,
        results.results,
        results.averages
      );
      const analysisLines = analysis.split('\n').filter(l => l.trim());

      const aiBox = boxen(
        analysisLines.join('\n'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'header',
          textColor: 'output',
          title: '🤖 AI Analysis',
          titleColor: 'header',
        }
      );

      addLines([
        { text: '', type: 'output' },
        ...aiBox,
        { text: '', type: 'output' },
      ]);
    } catch {
      addLines([chalk.red('  ✖ AI is currently unavailable. Try again later.')]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (aiMode) {
        handleAiModeInput(input);
      } else {
        handleCommand(input);
      }
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

  // renders one line of terminal output
  const renderLine = (line, i) => {
    if (line.isHtml && line.parts) {
      return (
        <div key={i} className="term-line">
          {line.parts.map((part, j) => {
            const classNames = [`term-${part.type}`];
            if (part.bold) classNames.push('term-bold');
            return <span key={j} className={classNames.join(' ')}>{part.text}</span>;
          })}
        </div>
      );
    }

    const classNames = [`term-line`, `term-${line.type}`];
    if (line.bold) classNames.push('term-bold');
    if (line.isGradient) classNames.push('term-gradient');

    return (
      <div key={i} className={classNames.join(' ')}>
        {line.text}
      </div>
    );
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
          {lines.map((line, i) => renderLine(line, i))}
        </div>
        <div className="terminal-input-line">
          <span className="terminal-prompt" style={aiMode ? { color: '#81a2be' } : undefined}>{aiMode ? 'ai>' : '$'}&nbsp;</span>
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
        <div className="terminal-footer">
          made by <a href="https://royarindam.page" target="_blank" rel="noopener noreferrer" className="terminal-footer-link">arindam roy</a>
        </div>
      </div>
    </div>
  );
}
