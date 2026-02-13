// aiService.js
// AI integration using Groq & OpenRouter free models
// provides smart suggestions, command help, and OS knowledge

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// System prompts for different AI tasks
const SYSTEM_PROMPTS = {
  commandHelper: `You are a helpful CLI assistant for a CPU Scheduling Algorithm Visualizer terminal app.
The app supports these commands:
- help: Show available commands
- add <pid> <arrival> <burst> [priority]: Add a process
- list (or ls): Show current processes
- run <algorithm> [quantum]: Run a scheduling algorithm
- compare: Compare all algorithms
- info <algorithm>: Show algorithm details
- demo: Load demo processes
- reset: Clear all processes
- clear: Clear terminal
- ai <question>: Ask AI about scheduling concepts
- suggest: Get AI algorithm recommendation based on current processes

Available algorithms: fcfs, sjf, srt, rr, hrrn, priority, feedback, fbv, aging, mlfq

When a user types a wrong command, suggest the correct command concisely.
Keep responses SHORT (2-3 lines max). Use plain text, no markdown.`,

  schedulingExpert: `You are an expert in Operating Systems CPU scheduling algorithms.
You explain concepts clearly and concisely for students.
Available algorithms in this simulator: FCFS, SJF, SRT (preemptive SJF), Round Robin, HRRN, Priority Scheduling, Feedback, Feedback Variable Quantum, Aging, MLFQ.
Keep answers concise (4-6 lines max). Use plain text, no markdown formatting.`,

  algorithmAdvisor: `You are a CPU scheduling algorithm advisor.
Given a set of processes with their arrival times, burst times, and priorities, recommend the best algorithm and explain why in 3-4 lines.
Available algorithms: FCFS, SJF, SRT, Round Robin (needs quantum), HRRN, Priority, Feedback, FBV, Aging, MLFQ.
Be specific about which algorithm command to run. Use plain text.`,

  resultAnalyzer: `You are an OS scheduling result analyst.
Given scheduling results (algorithm name, process metrics, averages), provide a brief insightful analysis in 3-5 lines.
Mention what the numbers mean, if the results are good/bad, and potential improvements. Use plain text.`,
};

// ─────────────────────────────────────────────
// Core API call functions
// ─────────────────────────────────────────────

async function callGroq(messages, maxTokens = 200) {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
  } catch (err) {
    console.warn('Groq failed, falling back to OpenRouter:', err.message);
    return null; // Signal to try fallback
  }
}

async function callOpenRouter(messages, maxTokens = 200) {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CPU Scheduler Visualizer',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
  } catch (err) {
    console.error('OpenRouter also failed:', err.message);
    return null;
  }
}

// Try Groq first, fallback to OpenRouter
async function askAI(systemPrompt, userMessage, maxTokens = 200) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  // Try Groq first (faster)
  let response = await callGroq(messages, maxTokens);
  if (response) return response;

  // Fallback to OpenRouter
  response = await callOpenRouter(messages, maxTokens);
  if (response) return response;

  return 'AI is currently unavailable. Please try again later.';
}

// ─────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────

/**
 * Get command suggestion when user types a wrong command
 */
export async function getCommandSuggestion(wrongCommand) {
  return askAI(
    SYSTEM_PROMPTS.commandHelper,
    `The user typed this wrong command: "${wrongCommand}". What did they probably mean? Suggest the correct command.`,
    150
  );
}

/**
 * Ask a general OS scheduling question
 */
export async function askSchedulingQuestion(question) {
  return askAI(
    SYSTEM_PROMPTS.schedulingExpert,
    question,
    300
  );
}

/**
 * Get algorithm recommendation based on current processes
 */
export async function getAlgorithmRecommendation(processes) {
  const processInfo = processes.map(p =>
    `PID=${p.pid}, Arrival=${p.arrival}, Burst=${p.burst}, Priority=${p.priority}`
  ).join('\n');

  return askAI(
    SYSTEM_PROMPTS.algorithmAdvisor,
    `Here are the current processes:\n${processInfo}\n\nWhich scheduling algorithm would work best for these processes and why?`,
    250
  );
}

/**
 * Analyze scheduling results
 */
export async function analyzeResults(algorithmName, results, averages) {
  const resultInfo = results.map(r =>
    `PID=${r.pid}: TAT=${r.turnaround}, WT=${r.waiting}, RT=${r.response}`
  ).join('\n');

  return askAI(
    SYSTEM_PROMPTS.resultAnalyzer,
    `Algorithm: ${algorithmName}\nResults:\n${resultInfo}\nAverages: TAT=${averages.avgTurnaround.toFixed(2)}, WT=${averages.avgWaiting.toFixed(2)}, RT=${averages.avgResponse.toFixed(2)}\n\nAnalyze these scheduling results briefly.`,
    250
  );
}

/**
 * Interactive AI chat for the knowledge space panel
 */
export async function chatWithAI(message, conversationHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are an interactive OS scheduling tutor in a CPU Scheduling Visualizer app.
You help students understand scheduling algorithms, OS concepts, and how to use this simulator.
Be friendly, concise, and educational. Use examples when helpful.
The simulator supports: FCFS, SJF, SRT, Round Robin, HRRN, Priority, Feedback, FBV, Aging, MLFQ.
Commands: help, add, list, run, compare, info, demo, reset, clear, ai, suggest.
Keep responses under 6 lines. Use plain text, no markdown.`
    },
    ...conversationHistory.slice(-6), // Keep last 6 messages for context
    { role: 'user', content: message },
  ];

  let response = await callGroq(messages, 350);
  if (response) return response;

  response = await callOpenRouter(messages, 350);
  if (response) return response;

  return 'AI is currently unavailable. Please try again later.';
}
