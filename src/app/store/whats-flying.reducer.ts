import { Action } from '@ngrx/store';
import { Flight } from '../models/flight';


export interface State {
  flightList:  Array<Flight>;
}

export const initialState: State = {
  flightList: new Array<Flight>()
};

export function reducer(state = initialState, action: Action): State {
  switch (action.type) {

    default:
      return state;
  }
}
