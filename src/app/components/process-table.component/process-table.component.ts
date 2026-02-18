import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService, Process } from '../../services/scheduler.service';

@Component({
  selector: 'app-process-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './process-table.component.html',
  styleUrl: './process-table.component.css',
})
export class ProcessTableComponent implements OnInit {
  public program: Process[] = []
  public selectedAlgorithm: string = 'RR'
  
  public algorithms = [
    { value: 'RR', label: 'RR, time quantum = 1' },
    { value: 'SPN', label: 'SPN' },
    { value: 'SRT', label: 'SRT' },
    { value: 'HRRN', label: 'HRRN' },
    { value: 'Feedback', label: 'Feedback, time quantum = 1' }
  ]

  constructor(private schedulerService: SchedulerService) {}

  ngOnInit() {
    this.program = this.schedulerService.getProcesses()
    this.selectedAlgorithm = this.schedulerService.getAlgorithm()
    // Ensure the algorithm is set in the service on init
    this.schedulerService.setAlgorithm(this.selectedAlgorithm)
  }

  onAlgorithmChange() {
    this.schedulerService.setAlgorithm(this.selectedAlgorithm)
  }

  onInputChange() {
    this.schedulerService.setProcesses([...this.program])
  }

  private getNextProcessName(): string {
    if (this.program.length === 0) return 'A'
    const lastProcess = this.program[this.program.length - 1]
    const lastChar = lastProcess.name.charCodeAt(0)
    return String.fromCharCode(lastChar + 1)
  }

  removeProcess(index: number) {
    if (this.program.length > 1) {
      this.program.splice(index, 1)
      this.schedulerService.setProcesses([...this.program])
    }
  }

  addprocess() {
    const newProcess: Process = {
      name: this.getNextProcessName(),
      arrivalTime: null,
      processingTime: null
    }
    this.program.push(newProcess)
    this.schedulerService.setProcesses([...this.program])
  }

  clearAll() {
    this.program = [{ name: 'A', arrivalTime: 0, processingTime: null }]
    this.schedulerService.setProcesses([...this.program])
  }

  generateGanttChart() {
    this.schedulerService.setProcesses([...this.program])
    this.schedulerService.setAlgorithm(this.selectedAlgorithm)
    this.schedulerService.triggerGenerate()
  }
}
