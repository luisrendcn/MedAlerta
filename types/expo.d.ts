/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_OS?: 'ios' | 'android' | 'web';
  }
}

declare module 'react/jsx-runtime' {
  export = JSX;
}