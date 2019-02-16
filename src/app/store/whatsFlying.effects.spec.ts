import { TestBed, inject } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { WhatsFlyingEffects } from './whatsFlying.effects';

describe('WhatsFlyingEffects', () => {
  let actions$: Observable<any>;
  let effects: WhatsFlyingEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WhatsFlyingEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.get(WhatsFlyingEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
