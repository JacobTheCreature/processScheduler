import { Component } from '@angular/core';
import { ProcessTableComponent } from '../process-table.component/process-table.component';
import { GanttChartComponent } from '../gantt-chart.component/gantt-chart.component';

@Component({
  selector: 'app-dashboard',
  imports: [ProcessTableComponent, GanttChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {

  
}
