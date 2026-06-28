import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import * as Collections from 'typescript-collections';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FlightService } from './services/flight.service';
import { Flight } from './models/flight';
import { FlightMarkerUtility } from './utilities/flight-marker.utility';

declare const google: any;

interface FlightFilters {
  search: string;
  country: string;
  minAlt: number;
  maxAlt: number;
  airborneOnly: boolean;
  categories: Set<number>;
}

interface AppStats {
  total: number;
  airborne: number;
  onGround: number;
  avgAltitude: number;
  avgSpeed: number;
  avgVerticalRate: number;
  countryCount: number;
}

const CATEGORY_LABELS: { [key: number]: string } = {
  0: 'No info',
  1: 'No ADS-B category',
  2: 'Light (< 15500 lbs)',
  3: 'Small (15500–75000 lbs)',
  4: 'Large (75000–300000 lbs)',
  5: 'High Vortex Large',
  6: 'Heavy (> 300000 lbs)',
  7: 'High Performance',
  8: 'Rotorcraft',
  9: 'Glider',
  10: 'Lighter-than-air',
  11: 'Parachutist',
  12: 'Ultralight',
  13: 'Reserved',
  14: 'UAV',
  15: 'Space / Trans-atmospheric',
  16: 'Surface Vehicle – Emergency',
  17: 'Surface Vehicle – Service',
  18: 'Point Obstacle',
  19: 'Cluster Obstacle',
  20: 'Line Obstacle'
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS).map(Number);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  flightList: Flight[] = [];
  filteredFlightList: Flight[] = [];
  flightMarkers = new Collections.Dictionary<string, any>();
  selectedFlight: Flight | null = null;
  selectedMarker: any = null;

  countries: string[] = [];

  filters: FlightFilters = {
    search: '',
    country: '',
    minAlt: 0,
    maxAlt: 50000,
    airborneOnly: true,
    categories: new Set([2, 3, 4, 5, 6, 7])
  };

  stats: AppStats = {
    total: 0,
    airborne: 0,
    onGround: 0,
    avgAltitude: 0,
    avgSpeed: 0,
    avgVerticalRate: 0,
    countryCount: 0
  };

  refreshInterval = 3000;
  lastUpdate: Date | null = null;
  isConnected = false;
  mapError = false;
  errorMessage = '';

  private map: any;
  private infoWindow: any;
  private updateTimer: any;
  private iconCache: { [key: string]: string } = {};
  private loadInProgress = false;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private flightService: FlightService, private zone: NgZone) {
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
    const defaultStartingLocation = { lat: 40.7128, lng: -73.9352 };
    const mapProp = {
      center: defaultStartingLocation,
      zoom: 7,
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      },
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }]
        }
      ]
    };

    this.map = new google.maps.Map(document.getElementById('googleMap'), mapProp);
    this.infoWindow = new google.maps.InfoWindow();

    if (window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(
        pos => this.map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }

    setTimeout(() => {
      this.fetchAndUpdate();
      this.updateTimer = setInterval(() => this.fetchAndUpdate(), this.refreshInterval);
    }, 2000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  fetchAndUpdate() {
    if (this.loadInProgress) { return; }
    this.loadInProgress = true;
    this.flightService.getFlights().pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      results => {
        this.zone.run(() => {
          this.loadFlightsDetails(results);
          this.lastUpdate = new Date();
          this.isConnected = true;
          this.mapError = false;
          this.loadInProgress = false;
        });
      },
      err => {
        this.zone.run(() => {
          this.isConnected = false;
          this.mapError = true;
          this.errorMessage = err;
          this.loadInProgress = false;
        });
      }
    );
  }

  loadFlightsDetails(results) {
    this.flightList = [];
    const countrySet = new Set<string>();

    for (const flightState of results.states) {
      const flight = new Flight();
      flight.id = flightState[0];
      flight.callsign = flightState[1] ? flightState[1].trim() : '';
      flight.origin_country = flightState[2];
      flight.longitude = flightState[5];
      flight.latitude = flightState[6];
      flight.altitude = flightState[7];
      flight.on_ground = flightState[8];
      flight.velocity = flightState[9];
      flight.heading = flightState[10];
      flight.vertical_rate = flightState[11];
      flight.baro_altitude = flightState[13];
      flight.category = flightState[17];

      if (flight.origin_country) {
        countrySet.add(flight.origin_country);
      }
      this.flightList.push(flight);
    }

    const countryArr: string[] = [];
    countrySet.forEach(c => countryArr.push(c));
    this.countries = countryArr.sort();
    this.syncAllMarkers();
    this.applyFilters();
  }

  private syncAllMarkers() {
    const NORMAL = 22;
    const SELECTED_SIZE = 28;

    for (const flight of this.flightList) {
      if (flight.latitude == null || flight.longitude == null) { continue; }

      const flightPosition = { lat: flight.latitude, lng: flight.longitude };
      const isSelected = this.selectedFlight && this.selectedFlight.id === flight.id;
      const roundedHeading = Math.round(flight.heading || 0);
      const dimmed = flight.category === 0 || flight.category === 1;

      if (this.flightMarkers.containsKey(flight.id)) {
        const marker = this.flightMarkers.getValue(flight.id);
        marker.setPosition(flightPosition);
        const iconChanged = isSelected !== marker.__selected ||
          dimmed !== marker.__dimmed ||
          Math.abs((marker.__heading || 0) - roundedHeading) > 2;
        if (iconChanged) {
          const size = isSelected ? SELECTED_SIZE : NORMAL;
          marker.setIcon(this.buildIconConfig(flight.heading, isSelected, size, dimmed));
          marker.__selected = isSelected;
          marker.__heading = roundedHeading;
          marker.__dimmed = dimmed;
        }
      } else {
        const marker = new google.maps.Marker({
          position: flightPosition,
          icon: this.buildIconConfig(flight.heading, false, NORMAL, dimmed),
          map: this.map
        });
        marker.__selected = false;
        marker.__heading = roundedHeading;
        marker.__dimmed = dimmed;

        marker.addListener('click', () => {
          this.zone.run(() => this.selectFlight(flight, marker));
        });
        marker.addListener('mouseover', () => {
          this.infoWindow.setContent(this.buildInfoContent(flight));
          this.infoWindow.open(this.map, marker);
        });
        marker.addListener('mouseout', () => {
          this.infoWindow.close();
        });

        this.flightMarkers.setValue(flight.id, marker);
      }
    }
  }

  applyFilters() {
    const { search, country, minAlt, maxAlt, airborneOnly, categories } = this.filters;
    const searchLower = search.toLowerCase().trim();

    this.filteredFlightList = this.flightList.filter(flight => {
      if (searchLower && !flight.callsign.toLowerCase().includes(searchLower) &&
          !flight.origin_country.toLowerCase().includes(searchLower)) {
        return false;
      }
      if (country && flight.origin_country !== country) {
        return false;
      }
      const alt = flight.altitude || 0;
      if (alt < minAlt || alt > maxAlt) {
        return false;
      }
      if (airborneOnly && flight.on_ground) {
        return false;
      }
      if (categories.size > 0 && !categories.has(flight.category)) {
        return false;
      }
      return true;
    });

    this.applyVisibility();
    this.updateStats();
  }

  private applyVisibility() {
    const visibleIds = new Set<string>();
    for (const flight of this.filteredFlightList) {
      if (flight.latitude != null && flight.longitude != null) {
        visibleIds.add(flight.id);
      }
    }

    const keys = this.flightMarkers.keys();
    for (let i = 0; i < keys.length; i++) {
      const marker = this.flightMarkers.getValue(keys[i]);
      if (marker) {
        if (visibleIds.has(keys[i])) {
          marker.setMap(this.map);
        } else {
          marker.setMap(null);
        }
      }
    }

    if (this.selectedFlight && !visibleIds.has(this.selectedFlight.id)) {
      this.selectedFlight = null;
      this.selectedMarker = null;
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      search: '',
      country: '',
      minAlt: 0,
      maxAlt: 50000,
      airborneOnly: false,
      categories: new Set([2, 3, 4, 5, 6, 7])
    };
    this.applyFilters();
  }

  updateStats() {
    const visible = this.filteredFlightList.filter(f => f.latitude != null && f.longitude != null);
    const total = visible.length;
    let airborne = 0;
    let onGround = 0;
    let altSum = 0;
    let altCount = 0;
    let speedSum = 0;
    let speedCount = 0;
    let vertSum = 0;
    let vertCount = 0;
    const countries = new Set<string>();

    for (const f of visible) {
      if (f.on_ground) { onGround++; } else { airborne++; }
      if (f.altitude != null) { altSum += f.altitude; altCount++; }
      if (f.velocity != null) { speedSum += f.velocity; speedCount++; }
      if (f.vertical_rate != null) { vertSum += f.vertical_rate; vertCount++; }
      if (f.origin_country) { countries.add(f.origin_country); }
    }

    this.stats = {
      total,
      airborne,
      onGround,
      avgAltitude: altCount ? Math.round(altSum / altCount) : 0,
      avgSpeed: speedCount ? Math.round(speedSum / speedCount * 10) / 10 : 0,
      avgVerticalRate: vertCount ? Math.round(vertSum / vertCount) : 0,
      countryCount: countries.size
    };
  }

  private getIconUri(heading: number, selected: boolean, dimmed: boolean): string {
    const key = Math.round(heading || 0) + '-' + selected + '-' + dimmed;
    if (this.iconCache[key]) { return this.iconCache[key]; }
    if (Object.keys(this.iconCache).length > 1000) { this.iconCache = {}; }
    const svg = FlightMarkerUtility.createFlightSVG(heading, selected, dimmed);
    const uri = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    this.iconCache[key] = uri;
    return uri;
  }

  private buildIconConfig(heading: number, selected: boolean, size: number, dimmed: boolean = false): any {
    return {
      url: this.getIconUri(heading, selected, dimmed),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2)
    };
  }

  selectFlight(flight: Flight, marker?: any) {
    if (this.selectedFlight && this.selectedFlight.id === flight.id) {
      this.deselectFlight();
      return;
    }

    if (this.selectedMarker) {
      const prevId = this.selectedFlight.id;
      if (this.flightMarkers.containsKey(prevId)) {
        const prevMarker = this.flightMarkers.getValue(prevId);
        const prevDimmed = prevMarker.__dimmed || false;
        prevMarker.setIcon(this.buildIconConfig(this.selectedFlight.heading, false, 22, prevDimmed));
        prevMarker.__selected = false;
      }
    }

    this.selectedFlight = flight;
    this.selectedMarker = marker;

    if (marker) {
      const dimmed = flight.category === 0 || flight.category === 1;
      marker.setIcon(this.buildIconConfig(flight.heading, true, 28, dimmed));
      marker.__selected = true;
      this.map.setCenter({ lat: flight.latitude, lng: flight.longitude });
    }
  }

  deselectFlight() {
    if (this.selectedFlight && this.flightMarkers.containsKey(this.selectedFlight.id)) {
      const marker = this.flightMarkers.getValue(this.selectedFlight.id);
      const dimmed = marker.__dimmed || false;
      marker.setIcon(this.buildIconConfig(this.selectedFlight.heading, false, 22, dimmed));
      marker.__selected = false;
    }
    this.selectedFlight = null;
    this.selectedMarker = null;
  }

  closeDetail() {
    this.deselectFlight();
  }

  trackFlight() {
    if (this.selectedFlight && this.selectedFlight.latitude && this.selectedFlight.longitude) {
      this.map.setCenter({ lat: this.selectedFlight.latitude, lng: this.selectedFlight.longitude });
      this.map.setZoom(8);
    }
  }

  get categoryKeys(): number[] {
    return CATEGORY_KEYS;
  }

  onSearchChange(value: string) {
    this.filters.search = value;
    this.searchSubject.next(value);
  }

  getCategoryLabel(category: number): string {
    return CATEGORY_LABELS[category] || 'Unknown';
  }

  isCategorySelected(category: number): boolean {
    return this.filters.categories.has(category);
  }

  toggleCategory(category: number) {
    if (this.filters.categories.has(category)) {
      this.filters.categories.delete(category);
    } else {
      this.filters.categories.add(category);
    }
    this.onFilterChange();
  }

  formatAltitude(alt: number): string {
    if (alt == null) { return 'N/A'; }
    if (alt >= 1000) {
      return (alt / 1000).toFixed(1) + 'k ft';
    }
    return Math.round(alt) + ' ft';
  }

  formatSpeed(speed: number): string {
    if (speed == null) { return 'N/A'; }
    return Math.round(speed) + ' mph';
  }

  formatVerticalRate(rate: number): string {
    if (rate == null) { return 'N/A'; }
    const sign = rate >= 0 ? '+' : '';
    return sign + Math.round(rate) + ' ft/min';
  }

  private buildInfoContent(flight: Flight): string {
    const catLabel = this.getCategoryLabel(flight.category);
    return `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; min-width: 200px;">
        <div style="font-weight: 600; font-size: 14px; color: #333; margin-bottom: 4px;">
          ${flight.callsign || 'N/A'}
          <span style="font-weight: 400; color: #666; font-size: 12px; margin-left: 4px;">
            (${flight.origin_country || 'Unknown'})
          </span>
        </div>
        <div style="font-size: 12px; color: #555; line-height: 1.6;">
          <div>Altitude: ${this.formatAltitude(flight.altitude)}</div>
          <div>Speed: ${this.formatSpeed(flight.velocity)}</div>
          <div>Heading: ${flight.heading != null ? Math.round(flight.heading) + '°' : 'N/A'}</div>
          <div>Status: ${flight.on_ground ? 'On Ground' : 'In Air'}</div>
          <div style="margin-top: 2px; padding-top: 2px; border-top: 1px solid #eee;">Type: ${catLabel}</div>
        </div>
      </div>
    `;
  }
}
