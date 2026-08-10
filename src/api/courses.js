import client from './client';

export async function createCourse({ name, description, visibility }) {
  const { data } = await client.post('/courses', { name, description, visibility });
  return data;
}

export async function getMyCourses() {
  const { data } = await client.get('/courses/mine');
  return data;
}

export async function browseAllCourses() {
  const { data } = await client.get('/courses/all');
  return data;
}

export async function getAvailableCourses() {
  const { data } = await client.get('/courses/available');
  return data;
}

export async function requestEnrollment(courseId) {
  const { data } = await client.post(`/courses/${courseId}/enroll`);
  return data;
}

export async function getEnrollments(courseId) {
  const { data } = await client.get(`/courses/${courseId}/enrollments`);
  return data;
}

export async function approveEnrollment(courseId, enrollmentId) {
  const { data } = await client.post(`/courses/${courseId}/enrollments/${enrollmentId}/approve`);
  return data;
}

export async function rejectEnrollment(courseId, enrollmentId) {
  const { data } = await client.post(`/courses/${courseId}/enrollments/${enrollmentId}/reject`);
  return data;
}

export async function enrollExistingStudent(courseId, studentId) {
  const { data } = await client.post(`/courses/${courseId}/students`, { studentId });
  return data;
}

export async function setCourseArchived(courseId, archived) {
  const { data } = await client.patch(`/courses/${courseId}/archive`, { archived });
  return data;
}

export async function updateCourseVisibility(courseId, visibility) {
  const { data } = await client.patch(`/courses/${courseId}/visibility`, { visibility });
  return data;
}

export async function deleteCourse(courseId) {
  const { data } = await client.delete(`/courses/${courseId}`);
  return data;
}

export async function requestCourseEditAccess(courseId) {
  const { data } = await client.post(`/courses/${courseId}/editor-requests`);
  return data;
}

export async function getCourseEditorRequests(courseId) {
  const { data } = await client.get(`/courses/${courseId}/editor-requests`);
  return data;
}

export async function approveCourseEditorRequest(courseId, requestId) {
  const { data } = await client.post(`/courses/${courseId}/editor-requests/${requestId}/approve`);
  return data;
}

export async function rejectCourseEditorRequest(courseId, requestId) {
  const { data } = await client.post(`/courses/${courseId}/editor-requests/${requestId}/reject`);
  return data;
}

export async function getCourseQuizzes(courseId) {
  const { data } = await client.get(`/courses/${courseId}/quizzes`);
  return data;
}

export async function removeEnrollment(courseId, enrollmentId) {
  const { data } = await client.delete(`/courses/${courseId}/enrollments/${enrollmentId}`);
  return data;
}

export async function getCourseCollaborators(courseId) {
  const { data } = await client.get(`/courses/${courseId}/collaborators`);
  return data;
}

export async function addCourseCollaborator(courseId, instructorId) {
  const { data } = await client.post(`/courses/${courseId}/collaborators`, { instructorId });
  return data;
}

export async function removeCourseCollaborator(courseId, collaboratorId) {
  const { data } = await client.delete(`/courses/${courseId}/collaborators/${collaboratorId}`);
  return data;
}

export async function editCourse(courseId, { name, description }) {
  const { data } = await client.patch(`/courses/${courseId}`, { name, description });
  return data;
}
