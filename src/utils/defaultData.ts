/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Activity, Classroom } from '../types';

export const DEFAULT_STUDENTS: Student[] = [
  { id: 'st1', name: '강민준', number: 1 },
  { id: 'st2', name: '김도현', number: 2 },
  { id: 'st3', name: '김민지', number: 3 },
  { id: 'st4', name: '김서현', number: 4 },
  { id: 'st5', name: '김아인', number: 5 },
  { id: 'st6', name: '김우진', number: 6 },
  { id: 'st7', name: '김지민', number: 7 },
  { id: 'st8', name: '김지우', number: 8 },
  { id: 'st9', name: '박건우', number: 9 },
  { id: 'st10', name: '박서연', number: 10 },
  { id: 'st11', name: '박예준', number: 11 },
  { id: 'st12', name: '박하은', number: 12 },
  { id: 'st13', name: '서지훈', number: 13 },
  { id: 'st14', name: '윤도윤', number: 14 },
  { id: 'st15', name: '이서윤', number: 15 },
  { id: 'st16', name: '이수아', number: 16 },
  { id: 'st17', name: '이준우', number: 17 },
  { id: 'st18', name: '정민서', number: 18 },
  { id: 'st19', name: '정하윤', number: 19 },
  { id: 'st20', name: '최주원', number: 20 },
];

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'act1', title: '아침 독서 15분 읽기 📚', createdAt: new Date().toISOString(), isActive: true },
  { id: 'act2', title: '수학 익힘책 24~27쪽 풀기 📐', createdAt: new Date(Date.now() - 3600000).toISOString(), isActive: true },
  { id: 'act3', title: '받아쓰기 5회 연습하기 📝', createdAt: new Date(Date.now() - 7200000).toISOString(), isActive: true },
  { id: 'act4', title: '줄넘기 100개 완료하기 🏃‍♂️', createdAt: new Date(Date.now() - 10800000).toISOString(), isActive: false },
];

export const CUTE_STAMPS = ['🦁', '🐼', '🐰', '🦖', '🚀', '🐱', '🐶', '🦄', '🐳', '🍀', '🍕', '🎉', '🌻', '🧸', '🎈'];

export function createDefaultClassroom(id: string, name: string): Classroom {
  return {
    id,
    name,
    students: [...DEFAULT_STUDENTS],
    activities: [...DEFAULT_ACTIVITIES],
    completions: [],
    teacherMessage: '오늘도 즐겁고 힘차게 도전하는 멋진 우리 반! 🌟 다한 활동은 자기 이름을 눌러 체크해요!',
  };
}
