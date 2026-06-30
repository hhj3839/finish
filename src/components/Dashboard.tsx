/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Users,
  Award,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Flame,
  Search,
  Activity,
  User,
  Heart,
  Smile
} from 'lucide-react';
import { Student, Activity as AppActivity, CompletionRecord } from '../types';
import { playClickSound } from '../utils/audio';

interface DashboardProps {
  students: Student[];
  activities: AppActivity[];
  completions: CompletionRecord[];
}

export default function Dashboard({ students, activities, completions }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'perfect' | 'inprogress'>('all');
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);

  // Stats calculation
  const totalStudents = students.length;
  const totalActivities = activities.length;
  const totalCompletions = completions.length;
  const maxPossibleCompletions = totalStudents * totalActivities;
  const classCompletionRate = maxPossibleCompletions > 0 
    ? Math.round((totalCompletions / maxPossibleCompletions) * 100) 
    : 0;

  // 1. Completion rate per Activity
  const activityStats = activities.map((act) => {
    const completedCount = completions.filter((c) => c.activityId === act.id).length;
    const rate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
    return {
      ...act,
      completedCount,
      rate,
    };
  });

  // 2. Student individual completion stats
  const studentStats = students.map((student) => {
    const studentCompletions = completions.filter((c) => c.studentId === student.id);
    const completedCount = studentCompletions.length;
    const rate = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;
    
    // Last completed activity time
    const lastCompletion = [...studentCompletions].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];

    return {
      student,
      completedCount,
      rate,
      lastCompletionTime: lastCompletion ? new Date(lastCompletion.completedAt).toLocaleTimeString() : '-',
      isPerfect: completedCount === totalActivities && totalActivities > 0,
    };
  });

  // Filter students based on state
  const filteredStudentStats = studentStats.filter((stat) => {
    const matchesSearch = stat.student.name.includes(searchTerm) || stat.student.number.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    if (completionFilter === 'perfect') return stat.isPerfect;
    if (completionFilter === 'inprogress') return !stat.isPerfect;
    return true;
  });

  // Perfect students count
  const perfectStudents = studentStats.filter((s) => s.isPerfect);

  // Sort and pick recent completions
  const recentCompletions = [...completions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)
    .map((record) => {
      const student = students.find((s) => s.id === record.studentId);
      const activity = activities.find((a) => a.id === record.activityId);
      return {
        ...record,
        studentName: student ? student.name : '알 수 없음',
        studentNumber: student ? student.number : 0,
        activityTitle: activity ? activity.title : '활동',
      };
    });

  // Helper to open a student's certificate modal
  const openReportCard = (student: Student) => {
    playClickSound();
    setSelectedReportStudent(student);
  };

  return (
    <div className="space-y-6" id="dashboard-stats-view">
      {/* Overview Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Class Completion Rate */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-3 border-amber-200 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">우리 반 평균 완료율 📈</span>
            <div className="bg-amber-100 p-1.5 rounded-xl text-amber-600"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-amber-900">{classCompletionRate}</span>
            <span className="text-sm font-bold text-amber-700">%</span>
          </div>
          <p className="text-[10px] text-amber-600 mt-2 font-semibold">
            전체 미션 중 {totalCompletions}건 체크 완료
          </p>
        </div>

        {/* Card 2: Perfect Students */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-3 border-emerald-200 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">다했어요 대장들 🏆</span>
            <div className="bg-emerald-100 p-1.5 rounded-xl text-emerald-600"><Trophy className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-900">{perfectStudents.length}</span>
            <span className="text-sm font-bold text-emerald-700">명</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-2 font-semibold">
            전체 미션을 완벽히 수정한 친구들
          </p>
        </div>

        {/* Card 3: Total Students */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-3 border-indigo-200 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">등록된 학생 수 🎒</span>
            <div className="bg-indigo-100 p-1.5 rounded-xl text-indigo-600"><Users className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-indigo-900">{totalStudents}</span>
            <span className="text-sm font-bold text-indigo-700">명</span>
          </div>
          <p className="text-[10px] text-indigo-600 mt-2 font-semibold">
            활성화된 학습 접속 명단
          </p>
        </div>

        {/* Card 4: Current Activities */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-3 border-purple-200 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">등록된 활동 수 📋</span>
            <div className="bg-purple-100 p-1.5 rounded-xl text-purple-600"><Activity className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-purple-900">{totalActivities}</span>
            <span className="text-sm font-bold text-purple-700">개</span>
          </div>
          <p className="text-[10px] text-purple-600 mt-2 font-semibold font-mono">
            활성 {activities.filter(a => a.isActive).length}개 | 대기 {activities.filter(a => !a.isActive).length}개
          </p>
        </div>
      </div>

      {/* Visual Activity Charts & Recent Completions Timeline (Double Column Bento Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bar Charts */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span>활동별 학생 완료 현황 시각화</span>
          </h3>

          {activityStats.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">등록된 활동이 없습니다. 관리자 탭에서 만들어 보세요!</p>
          ) : (
            <div className="space-y-4">
              {activityStats.map((act) => (
                <div key={act.id} className="space-y-1.5" id={`dashboard-activity-progress-${act.id}`}>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="truncate max-w-[70%]">{act.title}</span>
                    <span className="text-slate-500 font-mono">
                      {act.completedCount}명 완료 ({act.rate}%)
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="h-5 w-full bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${act.rate}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-xl ${
                        act.rate >= 90
                          ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                          : act.rate >= 50
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                          : 'bg-gradient-to-r from-rose-400 to-pink-400'
                      }`}
                    />
                    {/* Highlight star inside the progress bar if it's high */}
                    {act.rate === 100 && (
                      <div className="absolute inset-y-0 right-3 flex items-center text-amber-200 animate-bounce text-[10px] font-bold">
                        ★ Perfect
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Completions Feed (Timeline) */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span>최근 다했어요 타임라인 ⏱️</span>
            </h3>

            {recentCompletions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Smile className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
                <p className="text-xs font-bold">아직 완료한 학생이 없습니다.</p>
                <p className="text-[10px]">학생들이 활동을 체크하면 여기에 나타나요!</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-indigo-100 ml-2.5 pl-4 space-y-4">
                {recentCompletions.map((rec, index) => {
                  const stamp = rec.stampType || '⭐';
                  const timeStr = new Date(rec.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <motion.div
                      key={rec.studentId + '-' + rec.activityId + '-' + rec.completedAt}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative text-xs"
                    >
                      {/* Timeline dot */}
                      <span className="absolute left-[-23px] top-1.5 bg-indigo-500 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white shadow-sm font-bold">
                        {index + 1}
                      </span>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800 text-sm">{rec.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">({rec.studentNumber}번)</span>
                          <span className="ml-auto text-[10px] text-slate-400 font-mono font-bold">{timeStr}</span>
                        </div>
                        <p className="text-slate-600 truncate text-[11px] font-medium bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center gap-1.5">
                          <span>{stamp}</span>
                          <span className="truncate">{rec.activityTitle}</span>
                          <span className="text-emerald-600 font-extrabold shrink-0 ml-auto">완료!</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3 mt-4 text-center">
            * 방금 완료한 따끈따끈한 기록들이 위에서부터 차례대로 표시됩니다. 🎉
          </div>
        </div>
      </div>

      {/* Student List Stats & Gamified Badging */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-emerald-500" />
            <span>개인별 달성 현황판 🌟</span>
          </h3>

          {/* Filters and search */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Local Search */}
            <input
              id="dashboard-student-search"
              type="text"
              placeholder="이름/번호로 찾기..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border-2 border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 w-full sm:w-40"
            />
            
            {/* Filter buttons */}
            <div className="flex gap-1">
              <button
                id="dash-filter-all"
                onClick={() => { playClickSound(); setCompletionFilter('all'); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  completionFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                전체
              </button>
              <button
                id="dash-filter-perfect"
                onClick={() => { playClickSound(); setCompletionFilter('perfect'); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  completionFilter === 'perfect'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                다한 친구 👑
              </button>
              <button
                id="dash-filter-inprogress"
                onClick={() => { playClickSound(); setCompletionFilter('inprogress'); }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  completionFilter === 'inprogress'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                도전 중인 친구 🏃‍♂️
              </button>
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[450px] overflow-y-auto pr-1">
          {filteredStudentStats.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              선택한 조건의 학생이 없습니다.
            </div>
          ) : (
            filteredStudentStats.map((stat) => (
              <div
                key={stat.student.id}
                id={`student-dash-card-${stat.student.id}`}
                onClick={() => openReportCard(stat.student)}
                className={`border-2 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 ${
                  stat.isPerfect
                    ? 'bg-gradient-to-br from-emerald-50/40 to-teal-50/40 border-emerald-200'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {stat.student.number}번
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base mt-1 flex items-center gap-1">
                      {stat.student.name}
                      {stat.isPerfect && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      stat.isPerfect
                        ? 'bg-emerald-100 text-emerald-800'
                        : stat.completedCount > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {stat.completedCount} / {totalActivities} 완료
                    </span>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${stat.rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{stat.rate}% 완료</span>
                    {stat.lastCompletionTime !== '-' && (
                      <span className="flex items-center gap-0.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {stat.lastCompletionTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stars/Stamps Visual awards */}
                <div className="flex gap-0.5 flex-wrap">
                  {Array.from({ length: totalActivities }).map((_, index) => {
                    const hasStar = index < stat.completedCount;
                    return (
                      <span key={index}>
                        {hasStar ? (
                          <span className="text-sm">⭐</span>
                        ) : (
                          <span className="text-sm grayscale opacity-30">⭐</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Student Personal Certificate Modal */}
      <AnimatePresence>
        {selectedReportStudent && (() => {
          const stats = studentStats.find((s) => s.student.id === selectedReportStudent.id);
          if (!stats) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-amber-50 border-8 border-amber-300 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
              >
                {/* Certificate Visual Elements */}
                <div className="absolute inset-4 border-2 border-dashed border-amber-200 pointer-events-none rounded-2xl" />
                
                <div className="space-y-6 relative z-10 py-2">
                  <Award className="w-16 h-16 mx-auto text-amber-500 fill-amber-200 animate-bounce" />
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-amber-950 tracking-tight">참 잘했어요 상장 🏆</h3>
                    <div className="w-24 h-1 bg-amber-300 mx-auto" />
                  </div>

                  <div className="space-y-1.5 text-amber-900 text-sm font-medium leading-relaxed">
                    <p className="text-base font-bold bg-white/60 border border-amber-200 rounded-lg py-1 px-4 max-w-max mx-auto">
                      제 {selectedReportStudent.number}번 {selectedReportStudent.name}
                    </p>
                    <p className="pt-3">
                      위 학생은 오늘 마련된 다했어요 미션들을 성실하고 정성껏 수행하여 
                      총 <strong>{stats.completedCount}개</strong>의 미션 중 <strong>{stats.rate}%</strong>를 완료하였기에 
                      이 참 잘했어요 스티커와 상장을 수여합니다.
                    </p>
                  </div>

                  {/* Stamp Graphic */}
                  <div className="flex justify-center items-center gap-6 pt-4">
                    <div className="text-left text-[11px] text-amber-700/80 font-bold font-mono">
                      <p>출력: 다했어요 프로그램</p>
                      <p>일시: {new Date().toLocaleDateString()}</p>
                    </div>
                    {stats.isPerfect ? (
                      <div className="w-16 h-16 border-4 border-rose-500 rounded-full flex flex-col items-center justify-center text-rose-500 font-extrabold text-[10px] uppercase rotate-[-12deg] tracking-tighter select-none shadow-sm fill-rose-50">
                        <Smile className="w-5 h-5 animate-spin" />
                        <span>완벽 완료</span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-4 border-amber-600 rounded-full flex flex-col items-center justify-center text-amber-700 font-extrabold text-[10px] uppercase rotate-[-12deg] tracking-tighter select-none shadow-sm">
                        <Flame className="w-5 h-5" />
                        <span>노력 중!</span>
                      </div>
                    )}
                  </div>

                  <button
                    id="close-report-card-btn"
                    onClick={() => setSelectedReportStudent(null)}
                    className="w-full bg-slate-800 hover:bg-slate-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm mt-4"
                  >
                    상장 닫기 👍
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
