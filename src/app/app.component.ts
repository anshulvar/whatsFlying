import { Component } from '@angular/core';
import * as Collections from 'typescript-collections';

import { FlightService } from './services/flight.service';
import { Flight } from './models/flight';
import { FlightMarkerUtility } from './utilities/flight-marker.utility';

declare const google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  flightList = new Array<Flight>();
  flightMarkers = new Collections.Dictionary<String, any>();

  constructor(public flightService: FlightService) {
  }

  loadFlightsDetails(results, map) {
    this.flightList = [];
    for (let flightState of results.states) {
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

      this.flightList.push(flight);
    }
    // this.clearMarkers();
    this.updateMapWithFlightList(this.flightList, map);
  }

  flightDetailsError(err) {
    console.log('Flight update service failed with error : ' + err);
  }

  updateMapWithFlightList(flightList, map) {
    console.log('updating map with ' + flightList.length + ' flights');
    for (const flight of flightList) {
      if ( flight.latitude != null &&  flight.latitude != null ) {
        const flightPosition = { lat: flight.latitude, lng: flight.longitude };
        if (this.flightMarkers.containsKey(flight.id)) {
          const marker = this.flightMarkers.getValue(flight.id);
          marker.setPosition(flightPosition);
          marker.setIcon(FlightMarkerUtility.getFlightMarker(flight.heading, false));
          this.flightMarkers.setValue(flight.id, marker);
        } else {
          const marker = new google.maps.Marker({
            position: flightPosition,
            icon: FlightMarkerUtility.getFlightMarker(flight.heading, false),
            map: map
          });
          const infowindow = new google.maps.InfoWindow({
                content: 'Orgin : ' + flight.origin_country + '<br /> Altitude : ' + flight.altitude + ' ft<br />Speed : '
                + flight.velocity + ' mph <br />Vertical Speed : ' + flight.vertical_rate + ' <br />Heading : ' + flight.heading + ' - E'
              });
          marker.addListener('click', function() {
              infowindow.open(map, marker);
             // marker.setIcon(this.getFlightImage(flight.heading)).bind(this);
          });
          marker.addListener('mouseover', function() {
            infowindow.open(map, marker);
          });
          marker.addListener('mouseout', function() {
            infowindow.close(map, marker);
          });
          this.flightMarkers.setValue(flight.id, marker);
        }
          // this.flightMarkers.setValue(flight.id, marker);
          // this.markersArray.push(marker);
      }
    }
  }

  // clearMarkers() {
  //   console.log('Clearing ' + this.markersArray.length + ' markers from map');
  //   for (let i = 0; i < this.markersArray.length; i++) {
  //     this.markersArray[i].setMap(null);
  //   }
  //   this.markersArray.length = 0;
  // }

  updateFlights(flightService, map) {
    const flights = flightService.getFlights();
    flights.subscribe(
      results => this.loadFlightsDetails(results, map),
      err => this.flightDetailsError(err));
  }

  setCurrentLocation(map, Position) {
    const currentLocation = { lat: Position.coords.latitude, lng: Position.coords.longitude };
    map.setCenter(currentLocation);
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnInit() {

    const defaultStartingLocation = { lat: 41.8781 , lng: -87.6298 };
    const mapProp = {
      center: defaultStartingLocation,
      zoom: 8,
      fullscreenControl: true
    };

    const map = new google.maps.Map(document.getElementById('googleMap'), mapProp);

    if (window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(this.setCurrentLocation.bind(null, map));
    }

    const flights = this.flightService.getFlights();
    flights.subscribe(
      results => this.loadFlightsDetails(results, map),
      err => this.flightDetailsError(err));

    setInterval(this.updateFlights.bind(this, this.flightService, map), 2000);
  }
}
