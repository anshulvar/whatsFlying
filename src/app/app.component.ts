import { Component } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import * as Collections from 'typescript-collections';
import 'rxjs/add/operator/map';
import { FlightService } from './flight.service';
import { Flight } from './flight';
declare const google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  flightList = new Array<Flight>();
  flightMarkers = new Collections.Dictionary<String, any>();
  basePath ='/assets/';

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
    console.log('flight update service failed' + err);
  }

  getFlightImage(heading) {

    if (heading >= 337.5 || heading < 22.5) {
      return this.basePath + 'North.png';
    } else if (heading >= 22.5 && heading < 67.5) {
      return this.basePath + 'NorthEast.png';
    } else if (heading >= 67.5 && heading < 112.5) {
      return this.basePath + 'East.png';
    } else if (heading >= 112.5 && heading < 157.5) {
      return this.basePath + 'SouthEast.png';
    } else if (heading >= 157.5 && heading < 202.5) {
      return this.basePath + 'South.png';
    } else if (heading >= 202.5 && heading < 247.5) {
      return this.basePath + 'SouthWest.png';
    } else if (heading >= 247.5 && heading < 292.5) {
      return this.basePath + 'West.png';
    } else {
      return this.basePath + 'NorthWest.png';
    }
  }

  getHighLightedFlightImage(heading) {
        if (heading >= 337.5 || heading < 22.5) {
          return this.basePath + 'HL_North.png';
        } else if (heading >= 22.5 && heading < 67.5) {
          return this.basePath + 'HL_NorthEast.png';
        } else if (heading >= 67.5 && heading < 112.5) {
          return this.basePath + 'HL_East.png';
        } else if (heading >= 112.5 && heading < 157.5) {
          return this.basePath + 'HL_SouthEast.png';
        } else if (heading >= 157.5 && heading < 202.5) {
          return this.basePath + 'HL_South.png';
        } else if (heading >= 202.5 && heading < 247.5) {
          return this.basePath + 'HL_SouthWest.png';
        } else if (heading >= 247.5 && heading < 292.5) {
          return this.basePath + 'HL_West.png';
        } else {
          return this.basePath + 'HL_NorthWest.png';
        }
      }

  updateMapWithFlightList(flightList, map) {
    console.log('updating map with' + flightList.length + 'flights');
    for (const flight of flightList) {
      if ( flight.latitude != null &&  flight.latitude != null ) {
        const flightPosition = { lat: flight.latitude, lng: flight.longitude };
        if (this.flightMarkers.containsKey(flight.id)) {
          const marker = this.flightMarkers.getValue(flight.id);
          marker.setPosition(flightPosition);
          marker.setIcon(this.getFlightImage(flight.heading));
          this.flightMarkers.setValue(flight.id, marker);
        } else {
          const marker = new google.maps.Marker({
            position: flightPosition,
            icon: this.getFlightImage(flight.heading),
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
