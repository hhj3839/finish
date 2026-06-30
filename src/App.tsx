/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Users,
  Award,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  School,
  ArrowRight,
  Smile,
  LogOut
} from 'lucide-react';
import { Student, Activity, CompletionRecord, Classroom } from './types';
import { createDefaultClassroom, CUTE_STAMPS } from './utils/defaultData';
import StudentBoard from './components/StudentBoard';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { playClickSound, playUndoSound, playSuccessSound } from './utils/audio';

const STORAGE_KEY = 'dahayeosso_classrooms_v2';
const ACTIVE_CLASS_KEY = 'dahayeosso_active_class_id_v2';
const SOUND_ENABLED_KEY = 'dahayeosso_sound_enabled';

export default function App() {
  // Load classrooms from localStorage or initialize with default
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse classrooms from storage, resetting', e);
        }
      }
    }
    // Default pre-populated classroom so the app works instantly!
    const defaultId = 'class_seed';
    const defaultClass = createDefaultClassroom(defaultId, '새싹반 🌱');
    return [defaultClass];
  });

  // Selected classroom ID state
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedActive = localStorage.getItem(ACTIVE_CLASS_KEY);
      if (savedActive) {
        return savedActive;
      }
    }
    return classrooms[0]?.id || 'class_seed';
  });

  // Sound enabled state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SOUND_ENABLED_KEY);
      return saved !== 'false'; // Default to true
    }
    return true;
  });

  // Active view tab state: 'board' | 'dashboard' | 'admin'
  const [activeTab, setActiveTab] = useState<'board' | 'dashboard' | 'admin'>('board');

  // Currently selected activity for checking-in (defaults to the first active activity of current class)
  const currentClassroom = classrooms.find((c) => c.id === selectedClassroomId) || classrooms[0] || null;
  const [activeActivityId, setActiveActivityId] = useState<string>('');

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_CLASS_KEY, selectedClassroomId);
  }, [selectedClassroomId]);

  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, soundEnabled.toString());
  }, [soundEnabled]);

  // Update activeActivityId when current classroom changes or activities change
  useEffect(() => {
    if (currentClassroom && currentClassroom.activities.length > 0) {
      // Prefer the first active activity, otherwise the first activity in general
      const activeAct = currentClassroom.activities.find((a) => a.isActive);
      if (activeAct) {
        setActiveActivityId(activeAct.id);
      } else {
        setActiveActivityId(currentClassroom.activities[0].id);
      }
    } else {
      setActiveActivityId('');
    }
  }, [selectedClassroomId, currentClassroom?.activities]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    // Directly play sound to confirm if switching to on
    if (nextVal) {
      setTimeout(() => playSuccessSound(), 50);
    }
  };

  const switchTab = (tab: typeof activeTab) => {
    playClickSound();
    setActiveTab(tab);
  };

  // --- Core State Mutators ---

  /**
   * Toggles completion status for a student on an activity.
   */
  const handleToggleCompletion = (studentId: string, activityId: string) => {
    setClassrooms((prevClassrooms) =>
      prevClassrooms.map((cl) => {
        if (cl.id !== selectedClassroomId) return cl;

        const alreadyCompleted = cl.completions.some(
          (c) => c.studentId === studentId && cl.activities.find(a => a.id === activityId)?.id === c.activityId
        );

        let newCompletions: CompletionRecord[];
        if (alreadyCompleted) {
          // Remove (Undo)
          newCompletions = cl.completions.filter(
            (c) => !(c.studentId === studentId && c.activityId === activityId)
          );
        } else {
          // Add completion with dynamic stamp emoji
          const randomStamp = CUTE_STAMPS[Math.floor(Math.random() * CUTE_STAMPS.length)];
          const newRec: CompletionRecord = {
            studentId,
            activityId,
            completedAt: new Date().toISOString(),
            stampType: randomStamp,
          };
          newCompletions = [...cl.completions, newRec];
        }

        return {
          ...cl,
          completions: newCompletions,
        };
      })
    );
  };

  /**
   * Resets all completion records for a specific activity in the active classroom.
   */
  const handleResetCompletionsForActivity = (activityId: string) => {
    setClassrooms((prev) =>
      prev.map((cl) => {
        if (cl.id !== selectedClassroomId) return cl;
        return {
          ...cl,
          completions: cl.completions.filter((c) => c.activityId !== activityId),
        };
      })
    );
  };

  /**
   * Completes all students for a specific activity in the active classroom.
   */
  const handleCompleteAllForActivity = (activityId: string) => {
    setClassrooms((prev) =>
      prev.map((cl) => {
        if (cl.id !== selectedClassroomId) return cl;
        
        const currentCompletions = cl.completions.filter((c) => c.activityId === activityId);
        const completedStudentIds = new Set(currentCompletions.map((c) => c.studentId));
        
        const newCompletionsToAdd = cl.students
          .filter((s) => !completedStudentIds.has(s.id))
          .map((s) => {
            const randomStamp = CUTE_STAMPS[Math.floor(Math.random() * CUTE_STAMPS.length)];
            return {
              studentId: s.id,
              activityId,
              completedAt: new Date().toISOString(),
              stampType: randomStamp,
            };
          });
          
        return {
          ...cl,
          completions: [...cl.completions, ...newCompletionsToAdd],
        };
      })
    );
  };

  /**
   * Updates teacherMessage in active classroom.
   */
  const handleUpdateTeacherMessage = (classroomId: string, message: string) => {
    setClassrooms((prev) =>
      prev.map((cl) => (cl.id === classroomId ? { ...cl, teacherMessage: message } : cl))
    );
  };

  /**
   * Creates a new Classroom environment.
   */
  const handleCreateClassroom = (name: string) => {
    const newId = `class_${Date.now()}`;
    const newClass = createDefaultClassroom(newId, name);
    setClassrooms((prev) => [...prev, newClass]);
    setSelectedClassroomId(newId);
    setActiveTab('admin'); // switch to admin to let them review/add students
  };

  /**
   * Deletes a Classroom environment.
   */
  const handleDeleteClassroom = (id: string) => {
    const remaining = classrooms.filter((c) => c.id !== id);
    setClassrooms(remaining);
    if (selectedClassroomId === id && remaining.length > 0) {
      setSelectedClassroomId(remaining[0].id);
    }
  };

  /**
   * Updates student list in active classroom.
   */
  const handleUpdateStudents = (classroomId: string, updatedStudents: Student[]) => {
    setClassrooms((prev) =>
      prev.map((cl) => (cl.id === classroomId ? { ...cl, students: updatedStudents } : cl))
    );
  };

  /**
   * Updates activity list in active classroom.
   */
  const handleUpdateActivities = (classroomId: string, updatedActivities: Activity[]) => {
    setClassrooms((prev) =>
      prev.map((cl) => (cl.id === classroomId ? { ...cl, activities: updatedActivities } : cl))
    );
  };

  /**
   * Overrides completions roster in active classroom.
   */
  const handleUpdateCompletions = (classroomId: string, updatedCompletions: CompletionRecord[]) => {
    setClassrooms((prev) =>
      prev.map((cl) => (cl.id === classroomId ? { ...cl, completions: updatedCompletions } : cl))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Visual Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-100 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center border-2 border-amber-300 shadow-md">
              <School className="w-5 h-5 text-slate-800 animate-bounce" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1">
                다했어요! <span className="text-amber-500">🌟</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                초등학교 활동 체크 메이트
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 shadow-inner gap-1">
            <button
              id="tab-btn-board"
              onClick={() => switchTab('board')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'board'
                  ? 'bg-white text-slate-800 shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smile className="w-4 h-4 text-amber-500" />
              <span>다했어요 보드</span>
            </button>

            <button
              id="tab-btn-dashboard"
              onClick={() => switchTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-800 shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-500" />
              <span>활동 대시보드</span>
            </button>

            <button
              id="tab-btn-admin"
              onClick={() => switchTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-800 shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-500" />
              <span>선생님 관리실</span>
            </button>
          </div>

          {/* Sound & Classroom indicators */}
          <div className="flex items-center gap-2">
            {/* Classroom label */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">접속: {currentClassroom?.name}</span>
            </div>

            {/* Sound Toggle Button */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer shadow-sm hover:scale-105 ${
                soundEnabled
                  ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
              }`}
              title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8">
        {currentClassroom ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + selectedClassroomId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'board' && (
                <StudentBoard
                  students={currentClassroom.students}
                  activities={currentClassroom.activities}
                  completions={currentClassroom.completions}
                  activeActivityId={activeActivityId}
                  onSetActiveActivityId={setActiveActivityId}
                  onToggleCompletion={handleToggleCompletion}
                  onResetCompletionsForActivity={handleResetCompletionsForActivity}
                  onCompleteAllForActivity={handleCompleteAllForActivity}
                  teacherMessage={currentClassroom.teacherMessage}
                />
              )}

              {activeTab === 'dashboard' && (
                <Dashboard
                  students={currentClassroom.students}
                  activities={currentClassroom.activities}
                  completions={currentClassroom.completions}
                />
              )}

              {activeTab === 'admin' && (
                <AdminPanel
                  classrooms={classrooms}
                  selectedClassroomId={selectedClassroomId}
                  onSelectClassroom={setSelectedClassroomId}
                  onCreateClassroom={handleCreateClassroom}
                  onDeleteClassroom={handleDeleteClassroom}
                  onUpdateStudents={handleUpdateStudents}
                  onUpdateActivities={handleUpdateActivities}
                  onUpdateCompletions={handleUpdateCompletions}
                  onToggleCompletion={handleToggleCompletion}
                  onUpdateTeacherMessage={handleUpdateTeacherMessage}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
            <School className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800">접속 환경이 생성되지 않았습니다.</h3>
            <p className="text-xs text-slate-500">
              아래 버튼을 눌러 첫 번째 학급을 초기화하고 다했어요 앱을 시작해 보세요!
            </p>
            <button
              id="initialize-first-class-btn"
              onClick={() => handleCreateClassroom('1학년 1반 🌱')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-800 font-bold py-2 px-6 rounded-xl text-sm shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>기본 학급 생성하고 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Decorative footer */}
      <footer className="bg-white border-t-2 border-slate-100 py-6 text-center text-[11px] text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="flex items-center justify-center gap-1 text-slate-500 font-bold">
            <span>다했어요! 🌟</span>
            <span className="text-slate-300">|</span>
            <span>아이들의 성장을 함께하는 참 쉬운 보드</span>
          </p>
          <p>
            각 접속 환경마다 다른 브라우저의 로컬 저장소(localStorage)를 활용하여 데이터가 안전하게 구분 및 독립 보관됩니다. 
            서버 전송이 없어 개인정보 유출 걱정 없이 안심하고 교실에서 바로 배포해 사용해 보세요.
          </p>
        </div>
      </footer>
    </div>
  );
}
