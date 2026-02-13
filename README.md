# cpu-scheduler

terminal-based cpu scheduling visualizer thing i made for my OS class

## what is this

basically a web terminal where u can add processes and run different scheduling algorithms on them. shows gantt chart and all that good stuff

## algorithms it has

- FCFS (first come first serve)
- SJF (shortest job first)
- SRT (shortest remaining time)
- Round Robin
- Priority
- HRRN (highest response ratio next)
- MLFQ (multi level feedback queue)
- Feedback
- Aging

## how to run

```bash
npm install
npm run dev
```

then open localhost:5173

## usage

type `help` in the terminal to see commands

quick example:
```
add 1 0 5        # add process with pid=1, arrival=0, burst=5
add 2 1 3
add 3 2 4
run fcfs         # run first come first serve
compare          # compare all algorithms
```

## tech

- react + vite
- figlet for ascii art
- some color libs for the terminal look

## acknowledgments

algorithms code was inspired by/adapted from [CPU-Scheduling-Algorithms](https://github.com/yousefkotp/CPU-Scheduling-Algorithms) - thanks for the reference!

## notes

made this cuz the textbook examples were boring. wanted something interactive where i can actually see whats happening

feel free to use for ur own OS assignments lol
