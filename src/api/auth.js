import client from './client';

export async function register({ email, password, firstName, lastName, role }) {
  const { data } = await client.post('/auth/register', { email, password, firstName, lastName, role });
  return data;
}

export async function login({ email, password }) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}
