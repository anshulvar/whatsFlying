import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

@Injectable()
export class FlightService {

  constructor(private _http: HttpClient) { }

  getFlights(): Observable<any> {
    return this._http.get(environment.getFlightsUrl).pipe(
      catchError(error => {
        let msg = 'Unknown error';
        if (error.status === 429) {
          msg = 'OpenSky rate limit hit. Ensure OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET are set in your terminal, then restart the dev server.';
        } else if (error.status === 401 || error.status === 403) {
          msg = 'OpenSky auth failed (invalid or expired token). Restart the dev server to refresh.';
        } else if (error.status === 0) {
          msg = 'Cannot reach the server. Make sure the proxy/server is running.';
        } else if (error.status) {
          msg = `HTTP ${error.status}: ${error.statusText}`;
        }
        return throwError(msg);
      })
    );
  }
}
