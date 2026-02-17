import { Component } from '@angular/core';
import { ProcessTableComponent } from '../process-table.component/process-table.component';

@Component({
  selector: 'app-dashboard',
  imports: [ProcessTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {

}
