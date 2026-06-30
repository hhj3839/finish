/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Star, RefreshCw, Volume2, Search, Smile, Trophy, AlertTriangle, HelpCircle } from 'lucide-react';
import { Student, Activity, CompletionRecord } from '../types';
import { playSuccessSound, playUndoSound, playClickSound, playCelebrateSound } from '../utils/audio';

interface StudentBoardProps {
  students: Student[];
  activities: Activity[];
  completions: CompletionRecord[];
  activeActivityId: string;
  onSetActiveActivityId: (id: string) => void;
  onToggleCompletion: (studentId: string, activityId: string) => void;
  onResetCompletionsForActivity: (activityId: string) => void;
  onCompleteAllForActivity: (activityId: string) => void;
  teacherMessage?: string;
}

// Sparkle interface for the burst animation
interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

export default function StudentBoard({
  students,
  activities,
  completions,
  activeActivityId,
  onSetActiveActivityId,
  onToggleCompletion,
  onResetCompletionsForActivity,
  onCompleteAllForActivity,
  teacherMessage,
}: StudentBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [numberFilter, setNumberFilter] = useState<'all' | '1-10' | '11-20' | '21+'>('all');
  
  // Selected student for celebration modal
  const [celebratingStudent, setCelebratingStudent] = useState<Student | null>(null);
  const [undoPromptStudent, setUndoPromptStudent] = useState<Student | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeActivity = activities.find((a) => a.id === activeActivityId) || activities[0];

  // Keep track of active completions
  const activeCompletions = completions.filter((c) => c.activityId === activeActivityId);
  const completedStudentIds = new Set(activeCompletions.map((c) => c.studentId));
  const isCompletedAll = students.length > 0 && completedStudentIds.size === students.length;

  // Handle play celebration on all completed
  useEffect(() => {
    if (isCompletedAll && students.length > 0) {
      playCelebrateSound();
    }
  }, [isCompletedAll, students.length]);

  // Clean up timeout
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
    };
  }, []);

  const generateSparkles = () => {
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F43', '#D6A2E8', '#FF4081'];
    const newSparkles: Sparkle[] = Array.from({ length: 45 }).map((_, i) => ({
      id: Date.now() + i,
      x: 0,
      y: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 12 + 6,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 8 + 4,
    }));
    setSparkles(newSparkles);
  };

  const handleStudentClick = (student: Student) => {
    const isCompleted = completedStudentIds.has(student.id);
    
    if (!isCompleted) {
      // Mark as complete
      onToggleCompletion(student.id, activeActivityId);
      playSuccessSound();
      setCelebratingStudent(student);
      generateSparkles();
      
      // Auto close modal after 2.5 seconds
      if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = setTimeout(() => {
        setCelebratingStudent(null);
      }, 2500);
    } else {
      // If already complete, open confirmation modal to undo (for accidental taps)
      playClickSound();
      setUndoPromptStudent(student);
    }
  };

  const handleConfirmUndo = () => {
    if (undoPromptStudent) {
      onToggleCompletion(undoPromptStudent.id, activeActivityId);
      playUndoSound();
      setUndoPromptStudent(null);
    }
  };

  // Filter student list
  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.name.includes(searchTerm) ||
      student.number.toString().includes(searchTerm);
    
    // Number group filter
    if (!matchesSearch) return false;
    if (numberFilter === '1-10') return student.number >= 1 && student.number <= 10;
    if (numberFilter === '11-20') return student.number >= 11 && student.number <= 20;
    if (numberFilter === '21+') return student.number >= 21;
    return true;
  });

  // Calculate stats
  const totalCount = students.length;
  const completedCount = completedStudentIds.size;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6" id="student-board-view">
      {/* Top Banner / Activity Selector */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-amber-200 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-[-10px] right-[-10px] w-24 h-24 bg-amber-100/40 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-[-10px] left-[-10px] w-32 h-32 bg-orange-100/40 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
                오늘의 활동 🎯
              </span>
              <span className="text-xs text-amber-600 font-semibold font-mono">
                완료 현황: {completedCount}/{totalCount}명 ({percentage}%)
              </span>
            </div>
            
            <div className="relative">
              <select
                id="activity-selector"
                value={activeActivityId}
                onChange={(e) => {
                  playClickSound();
                  onSetActiveActivityId(e.target.value);
                }}
                className="w-full text-lg md:text-2xl font-bold text-slate-800 bg-white border-2 border-amber-300 rounded-2xl px-4 py-2.5 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
              >
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.title} {!act.isActive ? ' (종료됨)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-amber-600">
                ▼
              </div>
            </div>
          </div>

          {/* Large Progress Bar */}
          <div className="flex-1 max-w-md bg-white border-2 border-amber-200 rounded-2xl p-3 shadow-inner">
            <div className="flex justify-between items-center mb-1 text-xs font-bold text-amber-800">
              <div className="flex items-center gap-1">
                <Smile className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>우리는 해낼 수 있어요!</span>
              </div>
              <span>{percentage}%</span>
            </div>
            <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: 'spring', damping: 15 }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 drop-shadow-sm pointer-events-none">
                {completedCount}명 완료 / {totalCount}명 대기 중
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 선생님의 따뜻한 한마디 */}
      {teacherMessage && (
        <motion.div
          id="teacher-message-card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-amber-100 rounded-3xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden"
        >
          <div className="bg-amber-100 p-3 rounded-2xl shrink-0 flex items-center justify-center">
            <span className="text-2xl">👩‍🏫</span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <span>선생님의 따뜻한 한마디 💬</span>
            </h4>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              "{teacherMessage}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Control Rail & Filters */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 h-4 text-slate-400" />
          </div>
          <input
            id="student-search-input"
            type="text"
            placeholder="이름 또는 번호 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
          />
        </div>

        {/* Number Filters */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-center">
          <button
            id="filter-btn-all"
            onClick={() => { playClickSound(); setNumberFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              numberFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 번호
          </button>
          <button
            id="filter-btn-1-10"
            onClick={() => { playClickSound(); setNumberFilter('1-10'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              numberFilter === '1-10'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1 ~ 10번
          </button>
          <button
            id="filter-btn-11-20"
            onClick={() => { playClickSound(); setNumberFilter('11-20'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              numberFilter === '11-20'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            11 ~ 20번
          </button>
          <button
            id="filter-btn-21"
            onClick={() => { playClickSound(); setNumberFilter('21+'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              numberFilter === '21+'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            21번 이상
          </button>
        </div>

        {/* Helper Instructions */}
        <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>활동을 마친 친구는 자기 이름을 누르세요!</span>
        </div>
      </div>

      {/* Bulk actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-2 border-slate-150 rounded-2xl p-4 text-xs shadow-sm">
        <div className="flex items-center gap-1.5 text-slate-500 font-extrabold text-sm">
          <span>일괄 활동 체크 (교사용) ⚙️</span>
        </div>
        <div className="flex gap-2">
          <button
            id="bulk-complete-all-btn"
            onClick={() => {
              if (confirm('현재 반의 모든 학생을 완료 처리할까요?')) {
                onCompleteAllForActivity(activeActivityId);
                playSuccessSound();
              }
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-4 py-2 rounded-xl border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer text-xs"
          >
            <span>모두 선택 (전체 완료) 👍</span>
          </button>
          <button
            id="bulk-reset-all-btn"
            onClick={() => {
              if (confirm('현재 활동의 모든 학생 완료 상태를 대기 중으로 되돌릴까요?')) {
                onResetCompletionsForActivity(activeActivityId);
                playUndoSound();
              }
            }}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold px-4 py-2 rounded-xl border border-rose-200 transition-all flex items-center gap-1 cursor-pointer text-xs"
          >
            <span>모두 해제 (전체 취소) 🔄</span>
          </button>
        </div>
      </div>

      {/* Students grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <Smile className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-500 animate-pulse" />
          <p className="text-base font-bold">일치하는 학생이 없습니다.</p>
          <p className="text-xs mt-1">이름이나 번호를 다시 확인해 주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
          {filteredStudents.map((student) => {
            const isDone = completedStudentIds.has(student.id);
            const completionRecord = isDone ? activeCompletions.find((c) => c.studentId === student.id) : null;
            const stampEmoji = completionRecord?.stampType || '⭐';
            
            return (
              <motion.button
                key={student.id}
                id={`student-button-${student.id}`}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleStudentClick(student)}
                className={`relative aspect-[4/3] rounded-2xl border-3 flex flex-col items-center justify-center p-4 transition-all duration-200 select-none shadow-sm ${
                  isDone
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 text-emerald-800 shadow-inner'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                {/* Roll number */}
                <span className={`absolute top-2.5 left-3 text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${
                  isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {student.number}
                </span>

                {/* Name */}
                <span className="text-xl md:text-2xl font-bold tracking-wide mt-1">
                  {student.name}
                </span>

                {/* Checked layout/stamp */}
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: -8 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="absolute bottom-2 right-2 bg-rose-500 text-white text-[10px] md:text-xs font-extrabold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-1 select-none border border-rose-400 rotate-[-8deg] pointer-events-none"
                  >
                    <span className="text-xs md:text-sm">{stampEmoji}</span>
                    <span>다했어요!</span>
                  </motion.div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 mt-1 hover:text-amber-500">
                    대기 중 💤
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Celebration animation screen or message for total class completion */}
      {isCompletedAll && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-3xl p-8 text-center shadow-lg border-4 border-emerald-300 mt-6 relative overflow-hidden"
        >
          {/* Confetti simulation behind */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-4 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-white animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>

          <div className="relative z-10 space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-amber-300 animate-bounce" />
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              축하합니다! 우리 반 모두 완료했어요! 🏆
            </h3>
            <p className="text-sm md:text-base text-teal-50 font-medium max-w-lg mx-auto">
              정말 훌륭해요! 한 명도 빠짐없이 모두 힘을 합쳐 오늘 활동을 다 마쳤습니다. 
              선생님께 칭찬 스티커를 받으러 가볼까요? 🌟
            </p>
            <div className="pt-2">
              <button
                id="reset-classroom-completions-btn"
                onClick={() => {
                  if (confirm('오늘 활동 완료 기록을 초기화할까요?')) {
                    onResetCompletionsForActivity(activeActivityId);
                    playUndoSound();
                  }
                }}
                className="bg-emerald-700/60 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl border border-emerald-400 inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>오늘 활동 초기화하기</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sparkly Celebration overlay modal when a child clicks their name */}
      <AnimatePresence>
        {celebratingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            {/* Sparkle bursts */}
            <div className="absolute pointer-events-none overflow-hidden inset-0">
              {sparkles.map((sparkle) => (
                <motion.div
                  key={sparkle.id}
                  initial={{ x: window.innerWidth / 2, y: window.innerHeight / 2, opacity: 1, scale: 0 }}
                  animate={{
                    x: window.innerWidth / 2 + Math.cos(sparkle.angle) * (sparkle.speed * 40),
                    y: window.innerHeight / 2 + Math.sin(sparkle.angle) * (sparkle.speed * 40) - 100,
                    opacity: 0,
                    scale: [0, 1.2, 0.4, 0],
                  }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  className="absolute rounded-full"
                  style={{
                    backgroundColor: sparkle.color,
                    width: sparkle.size,
                    height: sparkle.size,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white border-6 border-amber-300 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              {/* Star graphics */}
              <div className="absolute top-3 left-4 text-amber-400 animate-spin"><Star className="w-5 h-5 fill-amber-300" /></div>
              <div className="absolute bottom-3 right-4 text-amber-400 animate-bounce"><Star className="w-6 h-6 fill-amber-300" /></div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-amber-200">
                  <Star className="w-10 h-10 text-amber-500 fill-amber-300 animate-pulse" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm font-mono font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {celebratingStudent.number}번 학생
                  </span>
                  <h4 className="text-3xl font-extrabold text-slate-800 tracking-wide pt-1">
                    {celebratingStudent.name}!
                  </h4>
                </div>

                <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-3">
                  <p className="text-emerald-800 text-base font-bold">
                    축하합니다! 🥳🎉
                  </p>
                  <p className="text-emerald-700 text-xs font-semibold mt-1">
                    &quot;{activeActivity.title}&quot;<br />활동을 성공적으로 완료했어요!
                  </p>
                </div>

                <p className="text-xs text-slate-400 font-medium">
                  (2초 뒤에 이 창이 자동으로 닫힙니다)
                </p>

                <button
                  id="celebration-close-btn"
                  onClick={() => setCelebratingStudent(null)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
                >
                  참 잘했어요! 확인 👍
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Undo verification modal */}
      <AnimatePresence>
        {undoPromptStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-rose-300 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    활동 완료 취소하기
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    실수로 이름을 눌렀나요? <strong>{undoPromptStudent.name}</strong> 학생의 이번 활동 완료 체크를 취소하시겠습니까?
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    id="undo-cancel-btn"
                    onClick={() => { playClickSound(); setUndoPromptStudent(null); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition-colors"
                  >
                    아니요, 그대로 둘게요
                  </button>
                  <button
                    id="undo-confirm-btn"
                    onClick={handleConfirmUndo}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    네, 취소할게요
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
