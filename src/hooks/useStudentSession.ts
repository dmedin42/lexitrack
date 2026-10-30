const SESSION_KEY = "lexitrack_student_session";

export interface StudentSession {
  studentId: string;
  studentName: string;
  username: string;
  classId: string;
  avatar: string;
}

export function getStudentSession(): StudentSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentSession;
  } catch {
    return null;
  }
}

export function setStudentSession(session: StudentSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStudentSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
