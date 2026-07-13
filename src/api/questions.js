import client from './client';

export async function generateQuestions({ file, courseId, courseContext, numQuestions, difficulty }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('courseId', courseId);
  formData.append('courseContext', courseContext);
  formData.append('numQuestions', numQuestions);
  formData.append('difficulty', difficulty);

  const { data } = await client.post('/questions/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getMyQuestions({ page = 0, size = 20 }) {
  const { data } = await client.get('/questions/mine', { params: { page, size } });
  return data;
}

export async function getQuestionsByCourse(courseId) {
  const { data } = await client.get(`/questions/course/${courseId}`);
  return data;
}

export async function updateQuestion(id, payload) {
  const { data } = await client.put(`/questions/${id}`, payload);
  return data;
}

export async function deleteQuestion(id) {
  const { data } = await client.delete(`/questions/${id}`);
  return data;
}

export async function getMyAnalytics() {
  const { data } = await client.get('/analytics/mine');
  return data;
}
