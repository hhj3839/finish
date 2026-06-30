/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  number: number; // Student number (출석 번호)
}

export interface Activity {
  id: string;
  title: string;
  createdAt: string;
  isActive: boolean;
}

export interface CompletionRecord {
  studentId: string;
  activityId: string;
  completedAt: string; // ISO string
  stampType?: string; // Cute emoji stamp assigned dynamically (e.g. 🦁, 🐼, 🐰)
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
  activities: Activity[];
  completions: CompletionRecord[];
  teacherMessage?: string; // Custom warm welcome message from the teacher
}
