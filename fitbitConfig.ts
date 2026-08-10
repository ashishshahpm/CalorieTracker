export const fitbitConfig = {
  clientId: '23TVTH',
  scope: 'activity',
  redirectUri: typeof window !== 'undefined' ? window.location.origin + '/' : 'https://calorietracker-457380672728.us-west1.run.app/',
  authUrl: 'https://www.fitbit.com/oauth2/authorize',
  tokenUrl: 'https://api.fitbit.com/oauth2/token'
};