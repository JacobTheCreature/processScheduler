import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchedulerService, Process } from '../../services/scheduler.service';
import { Subscription } from 'rxjs';

interface TimeSlot {
  processName: string
  startTime: number
  endTime: number
}

interface ProcessState {
  name: string
  arrival: number
  remaining: number
}

interface ProcessWithCompletion {
  name: string
  arrival: number
  processing: number
  completed: boolean
}

interface ProcessWithLevel extends ProcessState {
  level: number
}

@Component({
  selector: 'app-gantt-chart',
  imports: [CommonModule],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.css',
})
export class GanttChartComponent implements OnInit, OnDestroy {
  program: Process[] = []
  algorithm: string = 'RR'
  timeline: TimeSlot[] = []
  totalTime: number = 0
  hasError: boolean = false

  private subscriptions = new Subscription()

  constructor(
    private schedulerService: SchedulerService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.schedulerService.processes$.subscribe(program => {
        this.program = program
        // Clear the chart if all processes are invalid
        const hasValidProcess = program.some(
          p => p.arrivalTime !== null && p.processingTime !== null && p.processingTime > 0
        )
        if (!hasValidProcess) {
          this.timeline = []
          this.totalTime = 0
        }
      })
    )

    this.subscriptions.add(
      this.schedulerService.algorithm$.subscribe(algorithm => {
        this.algorithm = algorithm;
        // Clear the chart when algorithm changes
        this.timeline = []
        this.totalTime = 0
      })
    )

    this.subscriptions.add(
      this.schedulerService.generate$.subscribe(() => {
        this.runScheduler()
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe()
  }

  private runScheduler() {
    // Check for invalid processes
    const invalidProcesses = this.program.filter(
      p => p.arrivalTime === null || p.processingTime === null || p.processingTime <= 0
    )

    if (invalidProcesses.length > 0) {
      this.hasError = true
      this.timeline = []
      this.totalTime = 0
      return
    }

    if (this.program.length === 0) {
      this.hasError = false
      this.timeline = []
      this.totalTime = 0
      return
    }

    // Clear any previous error
    this.hasError = false

    switch (this.algorithm) {
      case 'RR':
        this.roundRobin(this.program)
        break
      case 'SPN':
        this.shortestProcessNext(this.program)
        break
      case 'SRT':
        this.shortestRemainingTime(this.program)
        break
      case 'HRRN':
        this.highestResponseRatioNext(this.program)
        break
      case 'Feedback':
        this.feedback(this.program)
        break
      default:
        this.roundRobin(this.program)
    }
  }

  private roundRobin(program: Process[]) {
    const timeline: TimeSlot[] = []
    const stack: ProcessState[] = []
    let time = 0
    let i = 0

    // Make a copy
    const processes = program.map(p => ({
      name: p.name,
      arrival: p.arrivalTime!,
      remaining: p.processingTime!
    }))

    // sort by arrival time
    processes.sort((a, b) => a.arrival - b.arrival)

    while (stack.length > 0 || i < processes.length) {
      // Add arrived processes to stack
      while (i < processes.length && processes[i].arrival <= time) {
        stack.push({ ...processes[i] })
        i++
      }

      if (stack.length === 0) {
        time = processes[i].arrival
        continue
      }

      const currentProcess = stack.shift()!
      const timeQuantum = Math.min(1, currentProcess.remaining)
      
      timeline.push({
        processName: currentProcess.name,
        startTime: time,
        endTime: time + timeQuantum
      })

      time += timeQuantum
      currentProcess.remaining -= timeQuantum

      // Add any new processes that have arrived
      while (i < processes.length && processes[i].arrival <= time) {
        stack.push({ ...processes[i] })
        i++
      }

      // Restack if not done
      if (currentProcess.remaining > 0) {
        stack.push(currentProcess)
      }
    }

    this.timeline = timeline
    this.totalTime = time
  }

  private shortestProcessNext(program: Process[]) {
    const timeline: TimeSlot[] = []
    let time = 0
    const done: boolean[] = new Array(program.length).fill(false)

    while (done.includes(false)) {
      let shortest = -1
      let shortestTime = Infinity
     
      for (let i = 0; i < program.length; i++) {
        if (!done[i] && program[i].arrivalTime! <= time) {
          if (program[i].processingTime! < shortestTime) {
            shortestTime = program[i].processingTime!
            shortest = i
          }
        }
      }

      if (shortest === -1) {
        time++
        continue
      }

      const currentProcess = program[shortest]
      timeline.push({
        processName: currentProcess.name,
        startTime: time,
        endTime: time + currentProcess.processingTime!
      })

      time += currentProcess.processingTime!
      done[shortest] = true
    }

    this.timeline = timeline
    this.totalTime = time
  }

  private shortestRemainingTime(program: Process[]) {
    const timeline: TimeSlot[] = []
    let time = 0

    // Make a copy
    const processes = program.map(p => ({
      name: p.name,
      arrival: p.arrivalTime!,
      remaining: p.processingTime!
    }))

    let lastProcess = ''
    let lastStartTime = 0

    while (processes.some(p => p.remaining > 0)) {
      let shortest = -1
      let shortestRemaining = Infinity
     
      // Find process with shortest remaining time among arrived processes
      for (let i = 0; i < processes.length; i++) {
        if (processes[i].remaining > 0 && processes[i].arrival <= time) {
          if (processes[i].remaining < shortestRemaining) {
            shortestRemaining = processes[i].remaining
            shortest = i
          }
        }
      }

      // If no process has arrived advance time
      if (shortest === -1) {
        time++
        continue
      }

      const currentProcess = processes[shortest]

      // If switching processes, save the previous timeline slot
      if (lastProcess !== '' && lastProcess !== currentProcess.name) {
        timeline.push({
          processName: lastProcess,
          startTime: lastStartTime,
          endTime: time
        })
        lastStartTime = time
      }

      // If this is the first execution or we just pushed a process
      if (lastProcess === '' || lastProcess !== currentProcess.name) {
        lastProcess = currentProcess.name
        lastStartTime = time
      }

      time++
      currentProcess.remaining--
    }

    // Push the final timeline slot
    if (lastProcess !== '') {
      timeline.push({
        processName: lastProcess,
        startTime: lastStartTime,
        endTime: time
      })
    }

    this.timeline = timeline
    this.totalTime = time
  }

  private highestResponseRatioNext(program: Process[]) {
    const timeline: TimeSlot[] = []
    let time = 0
    const done: boolean[] = new Array(program.length).fill(false)

    while (done.includes(false)) {
      let best = -1
      let bestRatio = -1
     
      for (let i = 0; i < program.length; i++) {
        if (!done[i] && program[i].arrivalTime! <= time) {
          const wait = time - program[i].arrivalTime!
          const service = program[i].processingTime!
          const ratio = (wait + service) / service
         
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = i
          }
        }
      }

      if (best === -1) {
        time++
        continue
      }

      const currentProcess = program[best]
      timeline.push({
        processName: currentProcess.name,
        startTime: time,
        endTime: time + currentProcess.processingTime!
      })

      time += currentProcess.processingTime!
      done[best] = true
    }

    this.timeline = timeline
    this.totalTime = time
  }

  private feedback(program: Process[]) {
    const timeline: TimeSlot[] = []
    let time = 0
   
    const s0: ProcessWithLevel[] = []
    const s1: ProcessWithLevel[] = []
    const s2: ProcessWithLevel[] = []
   
    const processes = program.map(p => ({
      name: p.name,
      arrival: p.arrivalTime!,
      remaining: p.processingTime!,
      level: 0
    }))

    processes.sort((a, b) => a.arrival - b.arrival)

    let i = 0

    while (s0.length > 0 || s1.length > 0 || s2.length > 0 || i < processes.length) {
      // Add arrived processes to stack 0
      while (i < processes.length && processes[i].arrival <= time) {
        s0.push({ ...processes[i] })
        i++
      }

      let currentProcess: ProcessWithLevel | undefined
      if (s0.length > 0) {
        currentProcess = s0.shift()!
      } else if (s1.length > 0) {
        currentProcess = s1.shift()!
      } else if (s2.length > 0) {
        currentProcess = s2.shift()!
      } else {
        time = processes[i].arrival
        continue
      }

      const timeSlice = Math.min(1, currentProcess.remaining)
     
      timeline.push({
        processName: currentProcess.name,
        startTime: time,
        endTime: time + timeSlice
      })

      time += timeSlice
      currentProcess.remaining -= timeSlice

      // Add new arrivals
      while (i < processes.length && processes[i].arrival <= time) {
        s0.push({ ...processes[i] })
        i++
      }

      // Move to next stack if not done
      if (currentProcess.remaining > 0) {
        if (currentProcess.level === 0) {
          currentProcess.level = 1
          s1.push(currentProcess)
        } else if (currentProcess.level === 1) {
          currentProcess.level = 2
          s2.push(currentProcess)
        } else {
          s2.push(currentProcess)
        }
      }
    }

    this.timeline = timeline
    this.totalTime = time
  }

  getProcessColor(processName: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
    const charCode = processName.charCodeAt(0) - 65
    return colors[charCode % colors.length]
  }

  getSlotWidth(slot: TimeSlot): number {
    if (this.totalTime === 0) return 0
    return ((slot.endTime - slot.startTime) / this.totalTime) * 100
  }

  getProcessNames(): string[] {
    const names = new Set<string>()
    this.program.forEach(p => names.add(p.name))
    return Array.from(names).sort()
  }

  getProcessSlots(processName: string): TimeSlot[] {
    return this.timeline.filter(slot => slot.processName === processName)
  }

  getSlotLeftPosition(slot: TimeSlot): number {
    if (this.totalTime === 0) return 0
    return (slot.startTime / this.totalTime) * 100
  }
}
