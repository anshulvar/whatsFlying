import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs';

@Injectable()
export class FlightService {

  constructor(private _http: Http) { }
  // getFlights() {
  //   console.log('calling flight service')
  //    return this._http.get('https://opensky-network.org/api/states/all')
  //               .subscribe(result => this.flights =result.json());

  // }

  getFlights():  Observable<any> {

    return this._http.get('https://opensky-network.org/api/states/all')
        .map((response:Response) => response.json());
        // .catch((err) => {
        //     if (err instanceof Response) {
        //         return Observable.throw(err.json().error || 'backend server error');
        //     }
        //     return Observable.throw(err || 'backend server error');
        // });

  }

}
