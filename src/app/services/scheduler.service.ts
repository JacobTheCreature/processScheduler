import { Injectable } from '@angular/core';

export interface Process {
  name: string
  arrivalTIme: number
  processingTime: number
}

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  
}
