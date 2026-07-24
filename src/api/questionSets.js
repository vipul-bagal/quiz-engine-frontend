import client from './client';

export async function getMyConcepts(questionSetIds) {
  const params = {};
  if (questionSetIds && questionSetIds.length > 0) {
    params.questionSetIds = questionSetIds.join(',');
  }
  const { data } = await client.get('/question-sets/concepts', { params });
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

export async function getQuestionsInSet(id) {
  const { data } = await client.get(`/question-sets/${id}/questions`);
  return data;
}

export async function setQuestionSetPriority(id, priority) {
  const { data } = await client.patch(`/question-sets/${id}/priority`, { priority });
  return data;
}

export async function setQuestionSetArchived(id, archived) {
  const { data } = await client.patch(`/question-sets/${id}/status`, { archived });
  return data;
}

export async function deleteQuestionSet(id) {
  const { data } = await client.delete(`/question-sets/${id}`);
  return data;
}

export async function getAssignedCourses(id) {
  const { data } = await client.get(`/question-sets/${id}/courses`);
  return data;
}

export async function assignQuestionSetToCourse(id, courseId) {
  const { data } = await client.post(`/question-sets/${id}/courses`, { courseId });
  return data;
}

export async function unassignQuestionSetFromCourse(id, courseId) {
  const { data } = await client.delete(`/question-sets/${id}/courses/${courseId}`);
  return data;
}
