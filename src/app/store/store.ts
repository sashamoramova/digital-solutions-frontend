import { configureStore } from '@reduxjs/toolkit';
import searchReducer from '@/app/slice/searchSlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    // other reducers...
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
