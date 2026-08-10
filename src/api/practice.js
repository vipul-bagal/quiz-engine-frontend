import client from './client';

export async function getPracticeableQuizzes() {
  const { data } = await client.get('/practice/available-quizzes');
  return data;
}

export async function startPractice(questionSetIds) {
  const { data } = await client.post('/practice/start', { questionSetIds });
  return data; // QuizSession
}
