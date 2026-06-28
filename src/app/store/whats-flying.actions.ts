import { Action } from '@ngrx/store';

export enum WhatsFlyingActionTypes {
  LoadWhatsFlying = '[WhatsFlying] Load WhatsFlying',
  GetFlights = '[WhatsFlying] Get Flights',
  GetFlightsSuccess = '[WhatsFlying] Get Flights Success',
  GetFlightsFailure = '[WhatsFlying] Get Flights FAilure'
}

export class LoadWhatsFlying implements Action {
  readonly type = WhatsFlyingActionTypes.LoadWhatsFlying;
}

export class GetFlights implements Action {
  readonly type = WhatsFlyingActionTypes.GetFlights;
}

export class GetFlightsSuccess implements Action {
  readonly type = WhatsFlyingActionTypes.GetFlightsSuccess;
  constructor(public payload: string) {}
}

export class GetFlightsFailure implements Action {
  readonly type = WhatsFlyingActionTypes.GetFlightsFailure;
}

export type WhatsFlyingActions = LoadWhatsFlying | GetFlights | GetFlightsSuccess | GetFlightsFailure ;
