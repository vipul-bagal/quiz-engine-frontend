import client from './client';

export async function getMyAnalytics() {
  const { data } = await client.get('/analytics/mine');
  return data;
}

export async function getConceptStruggles() {
  const { data } = await client.get('/analytics/concept-struggles');
  return data;
}

export async function getMyStudents() {
  const { data } = await client.get('/analytics/students');
  return data;
}
