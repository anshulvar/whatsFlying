import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

@Injectable()
export class WhatsFlyingEffects {
  constructor(private actions$: Actions) {}
}
