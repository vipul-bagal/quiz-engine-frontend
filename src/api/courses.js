import client from './client';

export async function createCourse({ name, description }) {
  const { data } = await client.post('/courses', { name, description });
  return data;
}

export async function getMyCourses() {
  const { data } = await client.get('/courses/mine');
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

export async function addStudentToCourse(courseId, { email, password }) {
  const { data } = await client.post(`/courses/${courseId}/students`, { email, password });
  return data;
}
