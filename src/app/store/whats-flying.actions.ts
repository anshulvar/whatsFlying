import { Action } from '@ngrx/store';

export enum WhatsFlyingActionTypes {
  LoadWhatsFlyings = '[WhatsFlying] Load WhatsFlyings',
  
  
}

export class LoadWhatsFlyings implements Action {
  readonly type = WhatsFlyingActionTypes.LoadWhatsFlyings;
}


export type WhatsFlyingActions = LoadWhatsFlyings;
