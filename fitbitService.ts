
import { fitbitConfig } from './fitbitConfig';

// Using a public CORS proxy for the prototype to bypass Fitbit's strict browser-side CORS policy.
// In a production app, these calls should be routed through your own backend.
const PROXY = 'https://corsproxy.io/?';

export const exchangeFitbitCodeForToken = async (code: string): Promise<string | null> => {
  try {
    const response = await fetch(`${PROXY}${encodeURIComponent(fitbitConfig.tokenUrl)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${fitbitConfig.clientId}:${fitbitConfig.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: fitbitConfig.redirectUri,
        client_id: fitbitConfig.clientId,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    console.error('Fitbit token exchange failed:', data);
    return null;
  } catch (error) {
    console.error('Error exchanging Fitbit code:', error);
    return null;
  }
};

/**
 * Fetch calories from Fitbit API for a specific date using a CORS proxy
 */
export const fetchFitbitCalories = async (token: string, date: string): Promise<number | null> => {
  try {
    const url = `https://api.fitbit.com/1/user/-/activities/date/${date}.json`;
    const response = await fetch(`${PROXY}${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.message || 'Failed to fetch');
    }

    const data = await response.json();
    return data.summary?.caloriesOut || 0;
  } catch (error) {
    console.error('Error fetching Fitbit calories:', error);
    throw error;
  }
};
