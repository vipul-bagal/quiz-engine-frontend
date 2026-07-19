import client from './client';

export async function startSession({ courseId, questionSetId }) {
  const { data } = await client.post('/quiz/start-session', { courseId, questionSetId });
  return data;
}

export async function getNextQuestion(sessionId) {
  const { data } = await client.get('/quiz/next-question', { params: { sessionId } });
  return data;
}

export async function submitAnswer({ sessionId, questionId, selectedOptionIndexes }) {
  const { data } = await client.post('/quiz/submit-answer', { sessionId, questionId, selectedOptionIndexes });
  return data;
}

export async function completeSession(sessionId) {
  const { data } = await client.post(`/quiz/session/${sessionId}/complete`);
  return data;
}

export async function getSessionSummary(sessionId) {
  const { data } = await client.get(`/quiz/session/${sessionId}/summary`);
  return data;
}

export async function getConceptAnalysis(sessionId) {
  const { data } = await client.get(`/quiz/session/${sessionId}/concept-analysis`);
  return data;
}

export async function getMySessions() {
  const { data } = await client.get('/quiz/my-sessions');
  return data;
}

export async function getAvailableQuizzes() {
  const { data } = await client.get('/quiz/available-quizzes');
  return data;
}
