
import { Tables } from "./database.types";

// FIX: Module '"react-router-dom"' has no exported member '...'.
// This ambient module declaration is a workaround for a potential TypeScript
// configuration issue where the types for 'react-router-dom' are not being resolved.
declare module 'react-router-dom';

export type Profile = Tables<'profiles'>;
