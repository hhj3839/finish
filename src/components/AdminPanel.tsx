/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Trash2,
  Download,
  Users,
  Settings,
  ClipboardList,
  Save,
  RotateCcw,
  PlusCircle,
  FolderOpen,
  Edit2,
  CheckCircle,
  XCircle,
  HelpCircle,
  ListRestart
} from 'lucide-react';
import { Student, Activity, CompletionRecord, Classroom } from '../types';
import { playClickSound, playUndoSound, playSuccessSound } from '../utils/audio';

interface AdminPanelProps {
  classrooms: Classroom[];
  selectedClassroomId: string;
  onSelectClassroom: (id: string) => void;
  onCreateClassroom: (name: string) => void;
  onDeleteClassroom: (id: string) => void;
  onUpdateStudents: (classroomId: string, students: Student[]) => void;
  onUpdateActivities: (classroomId: string, activities: Activity[]) => void;
  onUpdateCompletions: (classroomId: string, completions: CompletionRecord[]) => void;
  onToggleCompletion: (studentId: string, activityId: string) => void;
  onUpdateTeacherMessage: (classroomId: string, message: string) => void;
}

export default function AdminPanel({
  classrooms,
  selectedClassroomId,
  onSelectClassroom,
  onCreateClassroom,
  onDeleteClassroom,
  onUpdateStudents,
  onUpdateActivities,
  onUpdateCompletions,
  onToggleCompletion,
  onUpdateTeacherMessage,
}: AdminPanelProps) {
  const currentClassroom = classrooms.find((c) => c.id === selectedClassroomId) || classrooms[0];

  // Component UI tab state
  const [activeTab, setActiveTab] = useState<'students' | 'activities' | 'overrides' | 'sessions'>('students');

  // Input states
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState<number | ''>('');
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [newActivityTitle, setNewActivityTitle] = useState('');

  // Editing student mode
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');
  const [editingStudentNumber, setEditingStudentNumber] = useState<number | ''>('');

  const playTabChange = (tab: typeof activeTab) => {
    playClickSound();
    setActiveTab(tab);
  };

  // --- CSV Excel Export ---
  const handleExportCSV = () => {
    if (!currentClassroom) return;
    playClickSound();

    const { name: className, students, activities, completions } = currentClassroom;
    
    // 1. Build CSV columns
    // CSV headers: 번호, 이름, [활동들...], 완료 활동 개수, 완료율(%)
    const activeActivities = activities;
    const headerRow = [
      '번호',
      '이름',
      ...activeActivities.map((act) => act.title.replace(/,/g, ' ')),
      '총 완료 개수',
      '완료율(%)',
    ];

    // 2. Build Rows for each student
    const dataRows = students.map((student) => {
      const studentCompletions = completions.filter((c) => c.studentId === student.id);
      
      const activityCells = activeActivities.map((act) => {
        const isCompleted = studentCompletions.some((c) => c.activityId === act.id);
        return isCompleted ? '완료' : '미완료';
      });

      const completedCount = studentCompletions.length;
      const totalActsCount = activeActivities.length;
      const completionRate = totalActsCount > 0 ? Math.round((completedCount / totalActsCount) * 100) : 0;

      return [
        student.number.toString(),
        student.name,
        ...activityCells,
        completedCount.toString(),
        `${completionRate}%`,
      ];
    });

    // 3. Add summary statistics row at the bottom
    const summaryRow = [
      '합계',
      `총 ${students.length}명`,
      ...activeActivities.map((act) => {
        const completedForThisAct = completions.filter((c) => c.activityId === act.id).length;
        const rate = students.length > 0 ? Math.round((completedForThisAct / students.length) * 100) : 0;
        return `${completedForThisAct}명 완료 (${rate}%)`;
      }),
      '-',
      '-',
    ];

    // Join with commas and newlines
    const csvContent = [
      [`다했어요 활동 기록표 (학급명: ${className})`],
      [`기록 출력 일시: ${new Date().toLocaleString()}`],
      [],
      headerRow,
      ...dataRows,
      summaryRow,
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Excel compatibility UTF-8 BOM
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${className}_다했어요_활동기록_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Student CRUD ---
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !currentClassroom) return;

    playSuccessSound();
    
    // Auto calculate next roll number if empty
    const nextNumber = typeof newStudentNumber === 'number' 
      ? newStudentNumber 
      : (currentClassroom.students.length > 0 
          ? Math.max(...currentClassroom.students.map((s) => s.number)) + 1 
          : 1);

    const newStudent: Student = {
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: newStudentName.trim(),
      number: nextNumber,
    };

    const updatedStudents = [...currentClassroom.students, newStudent].sort((a, b) => a.number - b.number);
    onUpdateStudents(currentClassroom.id, updatedStudents);

    setNewStudentName('');
    setNewStudentNumber('');
  };

  const handleBulkImportStudents = () => {
    if (!bulkStudentText.trim() || !currentClassroom) return;
    playSuccessSound();

    // Split by commas, spaces, or lines
    const parsedNames = bulkStudentText
      .split(/[\n,;]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    let startNum = currentClassroom.students.length > 0
      ? Math.max(...currentClassroom.students.map((s) => s.number)) + 1
      : 1;

    const newStudents: Student[] = parsedNames.map((name, index) => ({
      id: `st_bulk_${Date.now()}_${index}`,
      name,
      number: startNum + index,
    }));

    const updatedStudents = [...currentClassroom.students, ...newStudents].sort((a, b) => a.number - b.number);
    onUpdateStudents(currentClassroom.id, updatedStudents);
    setBulkStudentText('');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!currentClassroom) return;
    if (confirm('이 학생을 명단에서 삭제할까요? 완료 기록도 함께 정리됩니다.')) {
      playUndoSound();
      const updatedStudents = currentClassroom.students.filter((s) => s.id !== studentId);
      onUpdateStudents(currentClassroom.id, updatedStudents);

      // Clean up records for this student
      const updatedCompletions = currentClassroom.completions.filter((c) => c.studentId !== studentId);
      onUpdateCompletions(currentClassroom.id, updatedCompletions);
    }
  };

  const startEditStudent = (student: Student) => {
    playClickSound();
    setEditingStudentId(student.id);
    setEditingStudentName(student.name);
    setEditingStudentNumber(student.number);
  };

  const handleSaveStudentEdit = () => {
    if (!currentClassroom || !editingStudentId || !editingStudentName.trim()) return;
    playSuccessSound();

    const updatedStudents = currentClassroom.students.map((student) => {
      if (student.id === editingStudentId) {
        return {
          ...student,
          name: editingStudentName.trim(),
          number: Number(editingStudentNumber) || student.number,
        };
      }
      return student;
    }).sort((a, b) => a.number - b.number);

    onUpdateStudents(currentClassroom.id, updatedStudents);
    setEditingStudentId(null);
  };

  // --- Activity CRUD ---
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || !currentClassroom) return;

    playSuccessSound();
    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      title: newActivityTitle.trim(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedActivities = [...currentClassroom.activities, newActivity];
    onUpdateActivities(currentClassroom.id, updatedActivities);
    setNewActivityTitle('');
  };

  const handleToggleActivityStatus = (activityId: string) => {
    if (!currentClassroom) return;
    playClickSound();

    const updatedActivities = currentClassroom.activities.map((act) => {
      if (act.id === activityId) {
        return { ...act, isActive: !act.isActive };
      }
      return act;
    });
    onUpdateActivities(currentClassroom.id, updatedActivities);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!currentClassroom) return;
    if (confirm('이 활동을 삭제할까요? 학생들의 완료 기록도 영구 삭제됩니다.')) {
      playUndoSound();
      const updatedActivities = currentClassroom.activities.filter((a) => a.id !== activityId);
      onUpdateActivities(currentClassroom.id, updatedActivities);

      // Clean up completions
      const updatedCompletions = currentClassroom.completions.filter((c) => c.activityId !== activityId);
      onUpdateCompletions(currentClassroom.id, updatedCompletions);
    }
  };

  // --- Classroom Sessions ---
  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    playSuccessSound();
    onCreateClassroom(newClassName.trim());
    setNewClassName('');
  };

  const handleDeleteClassroom = (id: string, name: string) => {
    if (classrooms.length <= 1) {
      alert('최소 1개의 접속 환경(학급)은 존재해야 합니다.');
      return;
    }
    if (confirm(`'${name}' 접속 환경을 완전히 삭제할까요? 학생 명단과 모든 활동 내역이 지워집니다.`)) {
      playUndoSound();
      onDeleteClassroom(id);
    }
  };

  // --- Manual Override Grid Helper ---
  const handleToggleOverride = (studentId: string, activityId: string) => {
    if (!currentClassroom) return;
    playClickSound();
    onToggleCompletion(studentId, activityId);
  };

  const handleResetAllCompletions = () => {
    if (!currentClassroom) return;
    if (confirm('주의! 오늘 하루 모든 활동 완료 기록을 초기화할까요? (학생 명단은 그대로 유지됩니다)')) {
      playUndoSound();
      onUpdateCompletions(currentClassroom.id, []);
    }
  };

  return (
    <div className="space-y-6" id="teacher-admin-view">
      {/* Header Banner */}
      <div className="bg-slate-800 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-slate-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400 animate-spin" />
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              선생님 관리 도구 🛠️
            </h2>
          </div>
          <p className="text-slate-300 text-xs font-semibold">
            현재 관리 중인 접속 학급: <span className="text-amber-300 font-bold underline">{currentClassroom?.name}</span> (학생 {currentClassroom?.students.length}명)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="admin-csv-export-btn"
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>엑셀(CSV) 다운로드</span>
          </button>

          <button
            id="admin-reset-all-records-btn"
            onClick={handleResetAllCompletions}
            className="bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>기록 전체 초기화</span>
          </button>
        </div>
      </div>

      {/* 선생님의 따뜻한 한마디 수정 (Teacher's encouraging message) */}
      {currentClassroom && (
        <div className="bg-amber-50/60 border-2 border-amber-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-sm">
            <span>👩‍🏫 학생 보드판 - 선생님의 응원 메시지 수정</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="teacher-message-edit-input"
              type="text"
              placeholder="예: 오늘도 즐겁고 힘차게 도전하는 멋진 우리 반! 🌟"
              value={currentClassroom.teacherMessage || ''}
              onChange={(e) => onUpdateTeacherMessage(currentClassroom.id, e.target.value)}
              className="flex-1 bg-white border-2 border-amber-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent text-slate-700"
            />
            <button
              id="teacher-message-preset-btn-1"
              onClick={() => {
                playSuccessSound();
                onUpdateTeacherMessage(currentClassroom.id, '오늘도 즐겁고 힘차게 도전하는 멋진 우리 반! 🌟 다한 활동은 자기 이름을 눌러 체크해요!');
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              기본 문구 ↩️
            </button>
            <button
              id="teacher-message-preset-btn-2"
              onClick={() => {
                playSuccessSound();
                onUpdateTeacherMessage(currentClassroom.id, '포기하지 않고 한 걸음씩 나아가는 여러분이 최고예요! 👍🔥');
              }}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              힘찬 격려 💪
            </button>
          </div>
          <p className="text-[10px] text-amber-600 font-semibold">
            * 입력하는 즉시 학생들의 보드판 상단에 실시간으로 반영됩니다! 귀여운 스탬프들과 함께 기분 좋은 하루를 만들어 보아요.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-1">
        <button
          id="admin-tab-students"
          onClick={() => playTabChange('students')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>학생 명단 수정</span>
        </button>

        <button
          id="admin-tab-activities"
          onClick={() => playTabChange('activities')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'activities'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>활동 목록 수정</span>
        </button>

        <button
          id="admin-tab-overrides"
          onClick={() => playTabChange('overrides')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overrides'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>체크 관리자 수정</span>
        </button>

        <button
          id="admin-tab-sessions"
          onClick={() => playTabChange('sessions')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'sessions'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>접속 환경 (학급) 분리</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm">
        
        {/* TAB 1: STUDENTS MANAGEMENT */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form 1: Paste Bulk Text */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <ListRestart className="w-4 h-4 text-indigo-500" />
                    <span>간편 복사해서 넣기 (강력 추천!)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    쉼표나 줄바꿈으로 여러 이름을 적어 한 번에 싹 등록해 보세요! 
                  </p>
                </div>
                <textarea
                  id="bulk-student-textarea"
                  value={bulkStudentText}
                  onChange={(e) => setBulkStudentText(e.target.value)}
                  placeholder="예시: 강민준, 김영희, 서준우, 박아인, 이도윤, 정서연"
                  rows={4}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent font-mono"
                />
                <button
                  id="bulk-student-submit-btn"
                  onClick={handleBulkImportStudents}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  명단에 대량 추가하기
                </button>
              </div>

              {/* Form 2: Add Single Student */}
              <form onSubmit={handleAddStudent} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <span>학생 개별 등록</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-bold block">출석 번호</label>
                    <input
                      id="single-student-number-input"
                      type="number"
                      placeholder="비워두면 자동 계산"
                      value={newStudentNumber}
                      onChange={(e) => setNewStudentNumber(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 font-bold block">이름</label>
                    <input
                      id="single-student-name-input"
                      type="text"
                      placeholder="이름 입력"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                </div>

                <button
                  id="single-student-submit-btn"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  한 명 추가하기
                </button>
              </form>
            </div>

            {/* Students List Table */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm text-slate-700 block">
                우리 반 학생 목록 ({currentClassroom.students.length}명)
              </h3>
              
              <div className="border-2 border-slate-100 rounded-2xl overflow-hidden shadow-inner max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100 text-slate-500 font-bold">
                      <th className="p-3 w-20">번호</th>
                      <th className="p-3">이름</th>
                      <th className="p-3 w-32 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentClassroom.students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          {editingStudentId === student.id ? (
                            <input
                              id={`edit-student-number-${student.id}`}
                              type="number"
                              value={editingStudentNumber}
                              onChange={(e) => setEditingStudentNumber(Number(e.target.value))}
                              className="w-16 border rounded px-1.5 py-0.5"
                            />
                          ) : (
                            <span className="font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {student.number}번
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingStudentId === student.id ? (
                            <input
                              id={`edit-student-name-${student.id}`}
                              type="text"
                              value={editingStudentName}
                              onChange={(e) => setEditingStudentName(e.target.value)}
                              className="border rounded px-1.5 py-0.5 w-full max-w-xs font-bold"
                            />
                          ) : (
                            <span className="font-extrabold text-slate-800 text-sm">
                              {student.name}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {editingStudentId === student.id ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                id={`save-student-btn-${student.id}`}
                                onClick={handleSaveStudentEdit}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-1 rounded"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                id={`cancel-student-edit-btn-${student.id}`}
                                onClick={() => setEditingStudentId(null)}
                                className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold p-1 rounded"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <button
                                id={`start-edit-student-btn-${student.id}`}
                                onClick={() => startEditStudent(student)}
                                className="text-slate-400 hover:text-indigo-600 p-1"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                id={`delete-student-btn-${student.id}`}
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVITIES MANAGEMENT */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <form onSubmit={handleAddActivity} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>새로운 미션/활동 만들기</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="new-activity-title-input"
                  type="text"
                  placeholder="활동 타이틀 예: 받아쓰기 1과 연습 📖, 아침 줄넘기 50회 🏃‍♀️"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  id="new-activity-submit-btn"
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm transition-colors shrink-0 cursor-pointer"
                >
                  활동 만들기
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <h3 className="font-extrabold text-sm text-slate-700">활동 관리 목록</h3>
              <div className="space-y-2">
                {currentClassroom.activities.map((act) => (
                  <div
                    key={act.id}
                    id={`activity-item-${act.id}`}
                    className={`border-2 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                      act.isActive
                        ? 'bg-amber-50/50 border-amber-100'
                        : 'bg-slate-50/80 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-base text-slate-800">{act.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">생성일: {new Date(act.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button
                        id={`toggle-activity-active-btn-${act.id}`}
                        onClick={() => handleToggleActivityStatus(act.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          act.isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {act.isActive ? '체크 가동 중' : '체크 중단됨'}
                      </button>
                      <button
                        id={`delete-activity-btn-${act.id}`}
                        onClick={() => handleDeleteActivity(act.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 p-1.5 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OVERRIDES GRID (MANUAL OVERRIDE) */}
        {activeTab === 'overrides' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">체크 간편 수정 보드</p>
                <p className="mt-0.5">
                  학생들이 미처 직접 체크하지 못하고 들어갔을 때, 선생님이 수동으로 완료를 켜고 끌 수 있는 관리 바둑판입니다. 
                  동그라미나 엑스 모양을 클릭하면 즉시 반영됩니다.
                </p>
              </div>
            </div>

            <div className="border-2 border-slate-100 rounded-2xl overflow-x-auto shadow-inner max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100 text-slate-500 font-bold sticky top-0">
                    <th className="p-3 w-16">번호</th>
                    <th className="p-3 w-24">이름</th>
                    {currentClassroom.activities.map((act) => (
                      <th key={act.id} className="p-3 min-w-[120px] text-center max-w-[160px] truncate">
                        {act.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentClassroom.students.map((student) => {
                    const studentCompletions = currentClassroom.completions.filter((c) => c.studentId === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-500">{student.number}번</td>
                        <td className="p-3 font-extrabold text-slate-800">{student.name}</td>
                        {currentClassroom.activities.map((act) => {
                          const isCompleted = studentCompletions.some((c) => c.activityId === act.id);
                          return (
                            <td key={act.id} className="p-2 text-center">
                              <button
                                id={`override-btn-${student.id}-${act.id}`}
                                onClick={() => handleToggleOverride(student.id, act.id)}
                                className={`inline-flex items-center justify-center p-1.5 rounded-full transition-transform hover:scale-110 ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-50 text-rose-300'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="w-6 h-6" />
                                ) : (
                                  <XCircle className="w-6 h-6" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SESSIONS (접속 환경 분리) */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-2">
              <FolderOpen className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <p className="font-bold">접속 환경 (학급) 관리 및 분리 안내 💡</p>
                <p className="mt-0.5 leading-relaxed">
                  각 교실, 환경, 컴퓨터마다 학생 명단을 초기화해 사용하기 위해 <strong>새 학급</strong>을 독립적으로 만들 수 있습니다. 
                  예를 들어 &apos;아침 수학 교실&apos;이나 &apos;방과후 컴퓨터교실&apos;, 또는 옆 반 &apos;3학년 2반&apos;을 만들어 접속하면, 
                  기존 반의 데이터에 간섭을 주지 않고 별도로 활용할 수 있습니다.
                </p>
              </div>
            </div>

            {/* Create Classroom Session */}
            <form onSubmit={handleCreateClassroom} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-blue-500" />
                <span>새 접속 학급 추가하기</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="new-class-name-input"
                  type="text"
                  placeholder="예: 3학년 2반, 돌봄교실 A, 방과후 미술반"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  id="new-class-submit-btn"
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-sm transition-colors shrink-0 cursor-pointer"
                >
                  학급 생성 및 진입
                </button>
              </div>
            </form>

            {/* Classrooms List */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-sm text-slate-700">생성된 접속 환경 일람 ({classrooms.length}개)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {classrooms.map((classItem) => {
                  const isCurrent = classItem.id === selectedClassroomId;
                  return (
                    <div
                      key={classItem.id}
                      id={`classroom-item-${classItem.id}`}
                      className={`border-3 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          {classItem.name}
                          {isCurrent && (
                            <span className="bg-blue-200 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              사용 중
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          학생: {classItem.students.length}명 | 활동: {classItem.activities.length}개
                        </p>
                      </div>

                      <div className="flex gap-1 justify-end">
                        {!isCurrent && (
                          <button
                            id={`switch-classroom-btn-${classItem.id}`}
                            onClick={() => {
                              playClickSound();
                              onSelectClassroom(classItem.id);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                          >
                            진입하기
                          </button>
                        )}
                        <button
                          id={`delete-classroom-btn-${classItem.id}`}
                          onClick={() => handleDeleteClassroom(classItem.id, classItem.name)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
