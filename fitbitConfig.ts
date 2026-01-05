export const fitbitConfig = {
  clientId: '23TVTH', // Replace with the ID you see
  clientSecret: '89a45c8661a5cb1dcaf53157a83b185f', // Replace with the Secret you see
  scope: 'activity', // We only need activity for calorie expenditure
  redirectUri: 'https://calorietracker-457380672728.us-west1.run.app/', // The exact URL you entered in the Fitbit portal
  authUrl: 'https://www.fitbit.com/oauth2/authorize',
  tokenUrl: 'https://api.fitbit.com/oauth2/token'
};