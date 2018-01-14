import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs';

@Injectable()
export class FlightService {

  constructor(private _http: Http) { }

  getFlights():  Observable<any> {

    return this._http.get('https://opensky-network.org/api/states/all')
        .map((response: Response) => response.json());
  }

}
