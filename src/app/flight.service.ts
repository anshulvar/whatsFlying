import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Response, Headers } from '@angular/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'
import {map} from "rxjs/operators";

@Injectable()
export class FlightService {

  constructor(private _http: HttpClient) { }

  getFlights():  Observable<any> {

    return this._http.get(environment.getFlightsUrl)
        .pipe(map((response: Response) => response));
  }

}
