import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttChartComponent } from './gantt-chart.component';

describe('GanttChartComponent', () => {
  let component: GanttChartComponent;
  let fixture: ComponentFixture<GanttChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GanttChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GanttChartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
