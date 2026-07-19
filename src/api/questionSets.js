import client from './client';

export async function getMyConcepts() {
  const { data } = await client.get('/question-sets/concepts');
  return data;
}

export async function createQuestionSet(payload) {
  const { data } = await client.post('/question-sets', payload);
  return data;
}

export async function getMyQuestionSets({ page = 0, size = 20 }) {
  const { data } = await client.get('/question-sets/mine', { params: { page, size } });
  return data;
}

export async function setQuestionSetPriority(id, priority) {
  const { data } = await client.patch(`/question-sets/${id}/priority`, { priority });
  return data;
}
