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

export async function browseAllQuestionSets() {
  const { data } = await client.get('/question-sets/all');
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

export async function publishQuestionSet(id, { visibility, preApprovedStudentIds }) {
  const { data } = await client.post(`/question-sets/${id}/publish`, { visibility, preApprovedStudentIds });
  return data;
}

export async function unpublishQuestionSet(id) {
  const { data } = await client.post(`/question-sets/${id}/unpublish`);
  return data;
}

export async function updateQuestionSetVisibility(id, visibility) {
  const { data } = await client.patch(`/question-sets/${id}/visibility`, { visibility });
  return data;
}

export async function requestQuizEditAccess(id) {
  const { data } = await client.post(`/question-sets/${id}/editor-requests`);
  return data;
}

export async function getQuizEditorRequests(id) {
  const { data } = await client.get(`/question-sets/${id}/editor-requests`);
  return data;
}

export async function approveQuizEditorRequest(id, requestId) {
  const { data } = await client.post(`/question-sets/${id}/editor-requests/${requestId}/approve`);
  return data;
}

export async function rejectQuizEditorRequest(id, requestId) {
  const { data } = await client.post(`/question-sets/${id}/editor-requests/${requestId}/reject`);
  return data;
}

export async function requestQuizAccess(id) {
  const { data } = await client.post(`/question-sets/${id}/request-access`);
  return data;
}

export async function getQuizAccessRequests(id) {
  const { data } = await client.get(`/question-sets/${id}/access-requests`);
  return data;
}

export async function decideQuizAccessRequest(quizId, accessRequestId, decision) {
  const { data } = await client.post(`/question-sets/${quizId}/access-requests/${accessRequestId}/${decision}`);
  return data;
}

export async function getQuizzesForCourse(courseId) {
  const { data } = await client.get(`/question-sets/by-course/${courseId}`);
  return data;
}

export async function getQuizDetail(id) {
  const { data } = await client.get(`/question-sets/${id}/detail`);
  return data;
}

export async function addQuizCollaborator(quizId, instructorId) {
  const { data } = await client.post(`/question-sets/${quizId}/collaborators`, { instructorId });
  return data;
}

export async function removeQuizCollaborator(quizId, collaboratorId) {
  const { data } = await client.delete(`/question-sets/${quizId}/collaborators/${collaboratorId}`);
  return data;
}

export async function grantQuizStudentAccess(quizId, studentId) {
  const { data } = await client.post(`/question-sets/${quizId}/student-access`, { studentId });
  return data;
}

export async function revokeQuizStudentAccess(quizId, accessId) {
  const { data } = await client.delete(`/question-sets/${quizId}/student-access/${accessId}`);
  return data;
}

export async function getQuestionsForManagement(quizId) {
  const { data } = await client.get(`/question-sets/${quizId}/questions-management`);
  return data;
}

export async function getConceptsForManagement(quizId) {
  const { data } = await client.get(`/question-sets/${quizId}/concepts-management`);
  return data;
}

export async function toggleQuestionInclusion(quizId, itemId, included) {
  const { data } = await client.patch(`/question-sets/${quizId}/questions-management/${itemId}`, { included });
  return data;
}

export async function toggleConceptInclusion(quizId, conceptGroupId, included) {
  const { data } = await client.patch(`/question-sets/${quizId}/concepts-management/${conceptGroupId}`, { included });
  return data;
}

export async function resetStudentQuizProgress(quizId, studentId) {
  const { data } = await client.post(`/question-sets/${quizId}/students/${studentId}/reset-progress`);
  return data;
}

export async function editQuestionSet(id, { title, description }) {
  const { data } = await client.patch(`/question-sets/${id}`, { title, description });
  return data;
}
