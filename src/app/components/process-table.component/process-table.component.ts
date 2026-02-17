import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Process {
  name: string,
  arrivalTime: number | null
  processingTime: number | null
}

@Component({
  selector: 'app-process-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './process-table.component.html',
  styleUrl: './process-table.component.css',
})
export class ProcessTableComponent {

  public program: Process[] = [{ name: 'A', arrivalTime: 0, processingTime: null }]

  public selectedAlgorithm: string = 'RR'
  
  public algorithms = [
    { value: 'RR', label: 'RR, time quantum = 1' },
    { value: 'SPN', label: 'SPN' },
    { value: 'SRT', label: 'SRT' },
    { value: 'HRRN', label: 'HRRN' },
    { value: 'Feedback', label: 'Feedback, time quantum = 1' }
  ]

  private getNextProcessName(): string {
    if (this.program.length === 0) return 'A'
    const lastProcess = this.program[this.program.length - 1]
    const lastChar = lastProcess.name.charCodeAt(0)
    return String.fromCharCode(lastChar + 1)
  }

  removeProcess(index: number) {
    if (this.program.length > 1) {
      this.program.splice(index, 1)
    }
  }

  addprocess() {
    const newProcess: Process = {
      name: this.getNextProcessName(),
      arrivalTime: null,
      processingTime: null
    }
    this.program.push(newProcess)
  }

  clearAll() {
    this.program = [
      { name: 'A', arrivalTime: null, processingTime: null }
    ]
  }
}
