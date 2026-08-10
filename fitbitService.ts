
import { fitbitConfig } from './fitbitConfig';

// Route Fitbit requests through server API routes to prevent CORS errors in browser
export const exchangeFitbitCodeForToken = async (code: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/fitbit/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
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
 * Fetch calories from Fitbit API for a specific date
 */
export const fetchFitbitCalories = async (token: string, date: string): Promise<number | null> => {
  try {
    const response = await fetch(`/api/fitbit/calories?date=${encodeURIComponent(date)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch Fitbit calories');
    }

    const data = await response.json();
    return data.caloriesOut || 0;
  } catch (error) {
    console.error('Error fetching Fitbit calories:', error);
    throw error;
  }
};
