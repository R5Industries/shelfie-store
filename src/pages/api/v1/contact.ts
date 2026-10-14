import type { APIRoute } from 'astro';
import { forwardToShelfieApi } from '../../../features/shelfie/proxy';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  return forwardToShelfieApi(context);
};
