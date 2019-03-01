import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer
} from '@ngrx/store';
import { environment } from '../../environments/environment';
import * as whatsFlyingReducer from './whats-flying.reducer';

export interface State {
  whatsFlying: whatsFlyingReducer.State;
}

export const reducers: ActionReducerMap<State> = {
  whatsFlying: whatsFlyingReducer.reducer,
};

export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];
