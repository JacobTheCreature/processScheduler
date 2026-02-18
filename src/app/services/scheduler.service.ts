import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface Process {
  name: string
  arrivalTime: number | null
  processingTime: number | null
}

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  private processesSubject = new BehaviorSubject<Process[]>([
    { name: 'A', arrivalTime: 0, processingTime: null }
  ])
  
  private algorithmSubject = new BehaviorSubject<string>('RR')
  private generateTrigger = new Subject<void>()

  processes$: Observable<Process[]> = this.processesSubject.asObservable()
  algorithm$: Observable<string> = this.algorithmSubject.asObservable()
  generate$: Observable<void> = this.generateTrigger.asObservable()

  getProcesses(): Process[] {
    return this.processesSubject.value
  }

  getAlgorithm(): string {
    return this.algorithmSubject.value
  }

  setProcesses(processes: Process[]): void {
    this.processesSubject.next(processes)
  }

  setAlgorithm(algorithm: string): void {
    this.algorithmSubject.next(algorithm)
  }

  triggerGenerate(): void {
    this.generateTrigger.next()
  }
}
