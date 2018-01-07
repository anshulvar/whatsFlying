import { Component } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map'
import { FlightService } from './flight.service';
import { Flight } from './flight';
declare const google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  flights;
  flightList = new Array<Flight>();
  markersArray = new Array;

  constructor(public flightService: FlightService) {
  }

  loadFlightsDetails(results, map) {
    this.flightList = [];
    this.flights = results.states;
    for (let flightState of this.flights) {
      let flight = new Flight();
      flight.id = flightState[0];
      flight.origin_country = flightState[2];
      flight.longitude = flightState[5];
      flight.latitude = flightState[6];
      flight.altitude = flightState[7];
      flight.on_ground = flightState[8];
      flight.velocity = flightState[9];
      flight.heading = flightState[10];
      flight.vertical_rate = flightState[11];
      flight.baro_altitude = flightState[13];

      //this.markersArray.push(marker);
      this.flightList.push(flight);

    }
    this.updateMapWithFlightList(this.flightList, map);
    console.log(this.flightList);
  }

  flightDetailsError(err) {
    console.log('flight update service faileed' + err);
  }

  stopRefreshing() {
  }

  updateMapWithFlightList(flightList, map) {
    console.log('updating map with' + flightList.length + 'flights');
    for (let flight of flightList) {
      const flightPosition = { lat: flight.latitude, lng: flight.longitude };
      const marker = new google.maps.Marker({
        position: flightPosition,
        icon: '/assets/icon18.png',
        map: map,
        title: 'Hello World!'
      });
      this.markersArray.push(marker);
    }
  }

  clearMarkers() {
    console.log ('clearing ' + this.markersArray.length  + 'markers from map');
    for (let i = 0; i < this.markersArray.length; i++) {
      this.markersArray[i].setMap(null);
    }
    this.markersArray.length = 0;
  }

  updateFlights(flightService, map) {
    this.clearMarkers();
    let flights = flightService.getFlights();
    flights.subscribe(
      results => this.loadFlightsDetails(results, map),
      err => this.flightDetailsError(err),
      () => this.stopRefreshing());
  }

  setCurrentLocation(map, Position) {
    const currentLocation = { lat: Position.coords.latitude, lng: Position.coords.longitude };
    map.setCenter(currentLocation);
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnInit() {

    const defaultLocation = { lat: 0, lng: 0 };
    const mapProp = {
      center: defaultLocation,
      zoom: 6,
      fullscreenControl: true
    };

    const map = new google.maps.Map(document.getElementById('googleMap'), mapProp);

    if (window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(this.setCurrentLocation.bind(null, map));
    }

    let flights = this.flightService.getFlights();
    flights.subscribe(
      results => this.loadFlightsDetails(results, map),
      err => this.flightDetailsError(err),
      () => this.stopRefreshing());

    setInterval(this.updateFlights.bind(this, this.flightService, map), 2000);
  }
}
