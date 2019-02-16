import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FlightService } from './services/flight.service'
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { By } from '@angular/platform-browser';


describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],imports: [
        HttpClientModule,
        BrowserModule
      ],providers: [
        FlightService
      ],
    }).compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have google maps div'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const mapDiv = fixture.debugElement.query(By.css('google-map'));
    expect(mapDiv).toBeTruthy;
    
  }));
});
