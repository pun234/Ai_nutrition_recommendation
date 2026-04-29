 import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Home,
  Calculator,
  Camera,
  Activity,
  Dumbbell,
  HeartPulse,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  User,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  BrainCircuit,
  Stethoscope,
  Calendar,
  AlertCircle,
  Leaf,
  Beef
} from 'lucide-react';

// ─── Firebase Config from .env (Vite) ────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── App ID (sanitized — no slashes) ─────────────────────────────────────────
const rawAppId =
  typeof __app_id !== 'undefined' ? __app_id : (import.meta.env.VITE_APP_ID || 'gym-buddy-neural');
const appId = rawAppId.replace(/\//g, '_');

// ─── Gemini Config from .env ──────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
// ─── Gemini Helper ────────────────────────────────────────────────────────────
// In App.jsx
const GEN_MODEL = 'gemini-2.0-flash'; // Update the model name here first!

// 1. Define the missing OpenRouter helper
async function callOpenRouter(prompt, systemInstruction = '') {
  if (!OPENROUTER_KEY) throw new Error('OpenRouter API Key is missing in .env');

  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'http://localhost:5173', 
      'X-Title': 'Gym Buddy Neural',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001', // OpenRouter model ID
      messages: messages,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter Error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// 2. Updated Gemini helper with the fallback connection
async function callGemini(prompt, systemInstruction = '', imageData = null, isJson = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{ 
      parts: [{ text: prompt }] 
    }],
    ...(systemInstruction && { 
      system_instruction: { parts: [{ text: systemInstruction }] } 
    }), 
    generationConfig: {
      ...(isJson && { response_mime_type: 'application/json' }), 
      temperature: 0.4,
    },
  };

  const fetchWithRetry = async (retries = 0) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Handle Rate Limit (429) by switching to OpenRouter
      if (response.status === 429) {
        console.warn("Gemini limit reached. Switching to OpenRouter...");
        return await callOpenRouter(prompt, systemInstruction);
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error('Empty response from Gemini');
      if (isJson) text = text.replace(/```json|```/g, '').trim();
      
      return text;
    } catch (err) {
      // If it's a simple network error, retry a few times
      if (retries < 2 && !err.message.includes('429')) {
        await new Promise(r => setTimeout(r, 2000));
        return fetchWithRetry(retries + 1);
      }
      throw err;
    }
  };

  return fetchWithRetry();
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
const NavBar = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'home',      icon: Home,         label: 'Home'       },
    { id: 'dietetics', icon: Calculator,   label: 'Dietetics'  },
    { id: 'scanner',   icon: Camera,       label: 'Food Vision'},
    { id: 'workout',   icon: Dumbbell,     label: 'Workouts'   },
    { id: 'rehab',     icon: Stethoscope,  label: 'Rehab'      },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard'},
  ];

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight italic">
            Nutri Track{' '}
            <span className="text-[10px] bg-green-100 text-red-600 px-2 py-0.5 rounded-full align-top ml-1 uppercase font-bold tracking-widest italic">
              Ai 
            </span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="text-slate-400 hover:text-red-500 text-xs font-bold px-4 py-2 flex items-center gap-2 transition-colors"
        >
          <LogOut size={16} /> LOGOUT
        </button>
      </div>
    </nav>
  );
};

// ─── DashboardTab ─────────────────────────────────────────────────────────────
const DashboardTab = ({ workouts, userIsAnonymous }) => {
  const weeklyIntensity = workouts.reduce(
    (acc, curr) => acc + (Number(curr.weight) || 0) * (Number(curr.reps) || 0),
    0
  );

  const calculate1RM = () => {
    if (!workouts.length) return '--';
    const { weight: w, reps: r } = workouts[0];
    const wn = Number(w) || 0;
    const rn = Number(r) || 0;
    if (rn === 0) return wn;
    return Math.round(wn * (1 + rn / 30));
  };

  const formatDate = ts => {
    if (!ts?.seconds) return 'N/A';
    return new Date(ts.seconds * 1000).toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[40px] p-10 border border-slate-100 mb-8 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
            <User size={48} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-1">
              Welcome, {userIsAnonymous ? 'Guest' : 'Athlete'}! 👋
            </h2>
            <p className="text-slate-500 font-medium">Your next level starts today.</p>
          </div>
        </div>
        <div className="hidden lg:block bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Predicted</p>
          <p className="text-2xl font-black text-slate-900">{calculate1RM()} kg</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Volume', value: `${weeklyIntensity} kg` },
          { label: 'Total Lifts',  value: workouts.length },
          { label: 'Status',       value: userIsAnonymous ? 'Guest' : 'Member', green: true },
          { label: 'Last Activity',value: formatDate(workouts[0]?.timestamp) },
        ].map(({ label, value, green }) => (
          <div key={label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${green ? 'text-green-500' : 'text-slate-900'}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DietPlan Display ─────────────────────────────────────────────────────────
const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS  = ['Breakfast','Morning Snack','Lunch','Afternoon Snack','Dinner','Supper'];

const DietPlanGrid = ({ dietPlan, dietPreference }) => (
  <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm overflow-x-auto mt-12">
    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
      <Calendar className="text-green-500" />
      Weekly {dietPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} Meal Plan
    </h3>
    <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
      {DAYS.map(day => {
        const dayData = dietPlan[day] || {};
        return (
          <div key={day} className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
            <p className="text-xs font-black text-green-600 uppercase mb-4 border-b border-green-100 pb-1">{day}</p>
            {MEALS.map(meal => {
              // Accept both exact key match and lowercase/snake_case variants
              const value =
                dayData[meal] ||
                dayData[meal.toLowerCase()] ||
                dayData[meal.replace(' ', '_')] ||
                dayData[meal.toLowerCase().replace(' ', '_')] ||
                dayData[meal.replace(' ', '')] ||
                '';
              if (!value) return null;
              const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
              return (
                <div key={meal} className="mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">{meal}</p>
                  <p className="text-[11px] text-slate-700 leading-tight">{text}</p>
                </div>
              );
            })}
            {/* Render any extra keys the model returned */}
            {Object.entries(dayData)
              .filter(([k]) =>
                !MEALS.some(m =>
                  k === m ||
                  k === m.toLowerCase() ||
                  k === m.replace(' ', '_') ||
                  k === m.toLowerCase().replace(' ', '_') ||
                  k === m.replace(' ', '')
                )
              )
              .map(([k, v]) => (
                <div key={k} className="mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase">{k}</p>
                  <p className="text-[11px] text-slate-700 leading-tight">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </p>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  </div>
);

// ─── HealthTab ────────────────────────────────────────────────────────────────

const HealthTab = ({
  bmiHeight, setBmiHeight, bmiWeight, setBmiWeight,
  age, setAge, pal, setPal,
  conditions, setConditions,
  dietPreference, setDietPreference,
  calculateBMI, bmiResult,
  generateWeeklyDiet, isGeneratingDiet, dietPlan,
  dietError,
}) => (
  <div className="max-w-6xl mx-auto px-4 py-12">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-extrabold text-slate-900 mb-4 uppercase italic">Diet Synthesis</h2>
      <p className="text-slate-500">Mapping user biometrics to optimized meal sequences.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-8 mb-4">
      {/* Left Card */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <User size={20} className="text-green-500" />Profile Input
        </h3>

        {/* Diet preference */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
            Dietary Preference
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: 'veg',     label: 'Vegetarian',     Icon: Leaf, active: 'bg-green-500 border-green-500' },
              { val: 'non-veg', label: 'Non-Vegetarian', Icon: Beef, active: 'bg-red-500 border-red-500'   },
            ].map(({ val, label, Icon, active }) => (
              <button
                key={val}
                onClick={() => setDietPreference(val)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
                  dietPreference === val ? `${active} text-white shadow-lg` : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Numeric inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Height (cm)', val: bmiHeight, set: setBmiHeight, type: 'number' },
            { label: 'Weight (kg)', val: bmiWeight, set: setBmiWeight, type: 'number' },
            { label: 'Age',         val: age,       set: setAge,       type: 'number' },
          ].map(({ label, val, set, type }) => (
            <div key={label}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</label>
              <input
                type={type}
                value={val}
                onChange={e => set(e.target.value)}
                className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Activity (PAL)</label>
            <select
              value={pal}
              onChange={e => setPal(e.target.value)}
              className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1.2">Sedentary (1.2)</option>
              <option value="1.375">Light (1.375)</option>
              <option value="1.55">Moderate (1.55)</option>
              <option value="1.725">Very Active (1.725)</option>
            </select>
          </div>
        </div>

        {/* Clinical conditions */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Clinical Conditions</label>
          <div className="flex flex-wrap gap-2">
            {['CVD', 'T2D', 'Iron Deficiency', 'Hyperthyroid'].map(c => (
              <button
                key={c}
                onClick={() =>
                  setConditions(prev =>
                    prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                  )
                }
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  conditions.includes(c)
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={calculateBMI}
          className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-600 transition-all"
        >
          Calculate
        </button>
      </div>

      {/* Right Card */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl flex flex-col justify-center">
        {bmiResult ? (
          <div className="text-center">
            <div className="flex justify-center gap-8 mb-8">
              <div>
                <p className="text-5xl font-black text-green-400">{bmiResult.bmi}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">BMI Index</p>
              </div>
              <div>
                <p className="text-5xl font-black text-blue-400">{bmiResult.tdee}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Target kcal</p>
              </div>
            </div>
            <p className="text-xl font-bold mb-2 text-slate-300">
              Status: <span className="text-white">{bmiResult.category}</span>
            </p>
            <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">
              Preference: {dietPreference.toUpperCase()}
            </p>
            {dietError && (
              <p className="text-red-400 text-xs font-bold mb-4 bg-red-900/30 p-3 rounded-xl">
                ⚠ {dietError}
              </p>
            )}
            <button
              onClick={generateWeeklyDiet}
              disabled={isGeneratingDiet}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingDiet ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Synthesizing Plan...
                </span>
              ) : (
                <><Sparkles size={20} /> Generate Weekly Plan</>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center opacity-50">
            <BrainCircuit size={64} className="mx-auto mb-4 text-green-500" />
            <p className="uppercase font-bold tracking-widest text-xs">Awaiting Biometric Encoding</p>
          </div>
        )}
      </div>
    </div>

    {/* Diet Plan Grid */}
    {dietPlan && <DietPlanGrid dietPlan={dietPlan} dietPreference={dietPreference} />}
  </div>
);

// ─── ScannerTab ───────────────────────────────────────────────────────────────
const ScannerTab = ({ analyzeMealImage, isMealAnalyzing, mealAnalysis }) => (
  <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm text-center">
    <h2 className="text-3xl font-black text-slate-900 mb-4 flex items-center justify-center gap-3 italic uppercase">
      <Camera className="text-green-500" /> Vision Intake
    </h2>
    <p className="text-slate-400 text-sm mb-12">Extracting nutritional tensors from raw image data.</p>
    <label className="block w-full cursor-pointer bg-slate-50 p-24 rounded-[40px] border-4 border-dashed border-slate-100 hover:border-green-500 transition-all group">
      <input type="file" accept="image/*" onChange={analyzeMealImage} className="hidden" />
      <div className="flex flex-col items-center">
        <Camera size={64} className="text-slate-200 group-hover:text-green-500 transition-colors mb-6" />
        <p className="font-black text-slate-400 group-hover:text-green-600 uppercase text-xs tracking-widest">
          {isMealAnalyzing ? 'Analyzing Neural Tensors...' : 'Upload Image for Computer Vision Extraction'}
        </p>
      </div>
    </label>
    {mealAnalysis && (
      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        <div className="bg-green-50 p-8 rounded-[30px] border border-green-100">
          <p className="text-4xl font-black text-green-600">{mealAnalysis.calories || 0}</p>
          <p className="text-[10px] font-black uppercase text-green-400 tracking-widest mt-1">Calories</p>
        </div>
        <div className="bg-blue-50 p-8 rounded-[30px] border border-blue-100">
          <p className="text-4xl font-black text-blue-600">{mealAnalysis.protein || 0}g</p>
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mt-1">Protein</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-100">
          <p className="text-lg font-bold text-slate-900 truncate uppercase">{mealAnalysis.dish || 'Unknown'}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Classification</p>
        </div>
      </div>
    )}
  </div>
);

// ─── RehabTab ─────────────────────────────────────────────────────────────────
const RehabTab = ({ analyzeFormVision, isFormAnalyzing, formFeedback }) => (
  <div className="max-w-4xl mx-auto px-4">
    <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm">
      <h2 className="text-3xl font-black text-slate-900 mb-4 flex items-center gap-3 italic uppercase">
        <Stethoscope className="text-green-500" /> AI Form Expert
      </h2>
      <p className="text-slate-400 text-sm mb-12">Biomechanical analysis using multi-modal visual reasoning.</p>
      <label className="block w-full cursor-pointer bg-slate-50 p-24 rounded-[40px] border-4 border-dashed border-slate-100 hover:border-green-500 transition-all group mb-12">
        <input type="file" accept="image/*" onChange={analyzeFormVision} className="hidden" />
        <div className="flex flex-col items-center">
          <Activity size={64} className="text-slate-200 group-hover:text-green-500 mb-6 transition-colors" />
          <p className="font-black text-slate-400 group-hover:text-green-600 uppercase text-xs tracking-widest">
            {isFormAnalyzing ? 'Analyzing Biomechanics...' : 'Upload Form Snapshot'}
          </p>
        </div>
      </label>
      {formFeedback && (
        <div className="bg-blue-50 p-10 rounded-[35px] text-sm text-blue-800 border border-blue-100 leading-relaxed shadow-inner">
          <h4 className="font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Kinesiological Insight
          </h4>
          <div className="whitespace-pre-wrap">{formFeedback}</div>
        </div>
      )}
    </div>
  </div>
);

// ─── WorkoutTab ───────────────────────────────────────────────────────────────
const WorkoutTab = ({
  handleWorkoutSubmit, exerciseName, setExerciseName,
  bodyPart, setBodyPart, weight, setWeight, reps, setReps, sets, setSets, workouts,
}) => (
  <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm">
    <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-3 italic uppercase">
      <Dumbbell className="text-green-500" /> Record Session
    </h2>
    <form onSubmit={handleWorkoutSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <select
          value={bodyPart}
          onChange={e => setBodyPart(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none font-bold focus:ring-2 focus:ring-green-500"
        >
          <option value="">Muscle Target</option>
          {['Chest','Back','Legs','Shoulders','Arms','Core'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          required
          value={exerciseName}
          onChange={e => setExerciseName(e.target.value)}
          placeholder="Exercise Name"
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none font-bold focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Kg',   val: weight, set: setWeight },
          { label: 'Reps', val: reps,   set: setReps   },
          { label: 'Sets', val: sets,   set: setSets   },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">{label}</label>
            <input
              type="number"
              value={val}
              onChange={e => set(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center font-black text-xl outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="w-full py-6 bg-green-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
      >
        Synchronize Session
      </button>
    </form>

    <div className="mt-16 space-y-4">
      <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.5em] mb-6">Recent Lift Data</h3>
      {workouts.slice(0, 4).map(w => (
        <div
          key={w.id}
          className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-green-300 transition-all"
        >
          <div>
            <p className="font-black text-slate-900 uppercase text-sm tracking-tighter">{w.exercise || 'Unnamed Exercise'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{w.bodyPart || 'Unspecified'}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-white px-4 py-2 rounded-xl text-xs font-black text-slate-900 border border-slate-100">
              {w.weight || 0} KG
            </span>
            <span className="bg-green-500 px-4 py-2 rounded-xl text-xs font-black text-white">
              {w.reps || 0} R
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);
  const [db, setDb]               = useState(null);
  const [auth, setAuth]           = useState(null);
  const [workouts, setWorkouts]   = useState([]);
  const [initError, setInitError] = useState('');

  // Auth
  const [authView, setAuthView]   = useState('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [authError, setAuthError] = useState('');

  // Dietetics
  const [bmiHeight, setBmiHeight]           = useState('180');
  const [bmiWeight, setBmiWeight]           = useState('78');
  const [age, setAge]                       = useState('22');
  const [pal, setPal]                       = useState('1.55');
  const [conditions, setConditions]         = useState([]);
  const [dietPreference, setDietPreference] = useState('veg');
  const [bmiResult, setBmiResult]           = useState(null);
  const [weeklyDietPlan, setWeeklyDietPlan] = useState(null);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  const [dietError, setDietError]           = useState('');

  // Workout
  const [exerciseName, setExerciseName] = useState('');
  const [bodyPart, setBodyPart]         = useState('');
  const [weight, setWeight]             = useState('');
  const [reps, setReps]                 = useState('');
  const [sets, setSets]                 = useState('');

  // Rehab
  const [formFeedback, setFormFeedback]     = useState('');
  const [isFormAnalyzing, setIsFormAnalyzing] = useState(false);

  // Scanner
  const [isMealAnalyzing, setIsMealAnalyzing] = useState(false);
  const [mealAnalysis, setMealAnalysis]       = useState(null);

  // ── Firebase init ──────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribeAuth = () => {};

    const initApp = async () => {
      try {
        // Prevent duplicate Firebase app init
        const isFirstInit = getApps().length === 0;
        const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

        const firebaseAuth = getAuth(app);
        // Use new persistent cache API (replaces deprecated enableIndexedDbPersistence)
        const firestore = isFirstInit
          ? initializeFirestore(app, {
              localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
              }),
            })
          : getFirestore(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        // Sign in with custom token if available, else anonymous
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          // Don't auto-sign-in here — let user choose email or guest
          // Remove this block if you DON'T want auto-anonymous on load:
          // await signInAnonymously(firebaseAuth);
        }

        unsubscribeAuth = onAuthStateChanged(firebaseAuth, u => {
          setUser(u);
          setLoading(false);
        });
      } catch (err) {
        console.error('Firebase Init Error:', err);
        setInitError(err.message);
        setLoading(false);
      }
    };

    initApp();
    return () => unsubscribeAuth();
  }, []);

  // ── Firestore listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!db || !user) return;

    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'workouts');
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setWorkouts(list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      },
      err => {
        // Only log — don't crash the UI for network errors
        console.warn('Firestore snapshot error:', err.code, err.message);
      }
    );
    return () => unsubscribe();
  }, [db, user]);

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleAuth = async e => {
    e.preventDefault();
    setAuthError('');
    if (!auth) return;
    try {
      if (authView === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError("Enable 'Email/Password' auth in Firebase Console.");
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError('Network error. Check your internet connection.');
      } else {
        setAuthError(err.message);
      }
    }
  };

  const handleGuestLogin = async () => {
    if (!auth) return;
    setAuthError('');
    try {
      await signInAnonymously(auth);
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError("Enable 'Anonymous' sign-in in Firebase Console.");
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError('Network error. Check your internet connection.');
      } else {
        setAuthError('Guest login failed.');
      }
    }
  };

  // ── BMI / TDEE ─────────────────────────────────────────────────────────────
  const calculateBMI = useCallback(() => {
    const h = Number(bmiHeight) / 100;
    const w = Number(bmiWeight);
    const a = Number(age);
    if (!h || !w || !a) return;
    const bmiVal     = (w / (h * h)).toFixed(1);
    const bmrVal     = Math.round(10 * w + 6.25 * Number(bmiHeight) - 5 * a + 5);
    const tdeeVal    = Math.round(bmrVal * Number(pal));
    let categoryVal  = bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese';
    setBmiResult({ bmi: bmiVal, category: categoryVal, bmr: bmrVal, tdee: tdeeVal });
  }, [bmiHeight, bmiWeight, age, pal]);

  // ── Diet generation ────────────────────────────────────────────────────────
  const generateWeeklyDiet = async () => {
    if (!bmiResult) return;
    setIsGeneratingDiet(true);
    setWeeklyDietPlan(null);
    setDietError('');
    try {
      const condStr = conditions.length ? conditions.join(', ') : 'None';
      const prompt = `
You are a certified Indian dietitian.
Generate a STRICTLY ${dietPreference === 'veg' ? 'VEGETARIAN (no meat, no eggs, no fish)' : 'NON-VEGETARIAN'} 7-day Indian meal plan.

User stats:
- Weight: ${bmiWeight} kg
- Height: ${bmiHeight} cm
- Age: ${age} years
- Activity Level (PAL): ${pal}
- Target TDEE: ${bmiResult.tdee} kcal/day
- BMI: ${bmiResult.bmi} (${bmiResult.category})
- Medical conditions: ${condStr}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "Monday": {
    "Breakfast": "...",
    "Morning Snack": "...",
    "Lunch": "...",
    "Afternoon Snack": "...",
    "Dinner": "...",
    "Supper": "..."
  },
  "Tuesday": { ... },
  "Wednesday": { ... },
  "Thursday": { ... },
  "Friday": { ... },
  "Saturday": { ... },
  "Sunday": { ... }
}

Each meal value should be a short 1–2 sentence description including approximate calories.
`.trim();

      const raw      = await callGemini(prompt, '', null, true);
      const cleaned  = raw.replace(/```json|```/g, '').trim();
      const parsed   = JSON.parse(cleaned);
      setWeeklyDietPlan(parsed);
    } catch (err) {
      console.error('Diet generation error:', err);
      setDietError(`Failed: ${err.message}. Please retry.`);
    } finally {
      setIsGeneratingDiet(false);
    }
  };

  // ── Form vision ────────────────────────────────────────────────────────────
  const analyzeFormVision = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setIsFormAnalyzing(true);
    setFormFeedback('');
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const result = await callGemini(
          'Analyze this exercise form image. Identify the exercise, evaluate posture, joint alignment, and give specific correction tips.',
          'You are an expert kinesiologist and personal trainer.',
          { mimeType: file.type, data: base64Data }
        );
        setFormFeedback(result);
      } catch (err) {
        setFormFeedback(`Analysis failed: ${err.message}`);
      } finally {
        setIsFormAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Workout submit ─────────────────────────────────────────────────────────
  const handleWorkoutSubmit = async e => {
    e.preventDefault();
    if (!user || !db || !exerciseName) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workouts'), {
        exercise: String(exerciseName),
        bodyPart: String(bodyPart),
        weight:   Number(weight),
        reps:     Number(reps),
        sets:     Number(sets),
        timestamp: serverTimestamp(),
      });
      setExerciseName('');
      setWeight('');
      setReps('');
      setSets('');
    } catch (err) {
      console.error('Firestore write error:', err);
    }
  };

  // ── Meal scanner ───────────────────────────────────────────────────────────
  const analyzeMealImage = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setIsMealAnalyzing(true);
    setMealAnalysis(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const prompt = `
Analyze this meal image and return ONLY a valid JSON object (no markdown) with:
{
  "dish": "Name of the dish",
  "calories": estimated_integer_calories,
  "protein": estimated_grams_protein_integer,
  "carbs": estimated_grams_carbs_integer,
  "fat": estimated_grams_fat_integer
}
`.trim();
        const raw     = await callGemini(prompt, 'You are a professional nutritionist.', { mimeType: file.type, data: base64Data }, true);
        const cleaned = raw.replace(/```json|```/g, '').trim();
        setMealAnalysis(JSON.parse(cleaned));
      } catch (err) {
        console.error('Meal analysis error:', err);
        setMealAnalysis({ dish: 'Error', calories: 0, protein: 0 });
      } finally {
        setIsMealAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BrainCircuit size={48} className="text-green-500 animate-pulse mx-auto mb-4" />
          <p className="text-green-500 font-black animate-pulse uppercase tracking-widest">GYM BUDDY NEURAL</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-100">
              <BrainCircuit className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Gym Buddy</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Next-Gen AI Partner</p>
          </div>

          {initError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-xs text-red-500 font-bold">⚠ Init Error: {initError}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
            />
            <input
              type="password"
              placeholder="Access Key"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
            />
            {authError && (
              <p className="text-[10px] text-red-500 text-center font-bold px-2 uppercase">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
              {authView === 'login' ? 'Proceed to System' : 'Create Profile'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setAuthView(v => v === 'login' ? 'signup' : 'login'); setAuthError(''); }}
              className="text-xs text-slate-400 hover:text-green-500 font-bold transition-all"
            >
              {authView === 'login' ? 'New here? Register Profile' : 'Have account? Sign In'}
            </button>
            <div className="flex items-center gap-4 py-6">
              <div className="flex-1 h-[1px] bg-slate-100" />
              <span className="text-[10px] text-slate-300 font-bold">OR</span>
              <div className="flex-1 h-[1px] bg-slate-100" />
            </div>
            <button
              onClick={handleGuestLogin}
              className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-green-600 transition-all"
            >
              Explore in Guest Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => signOut(auth)} />
      <main className="pb-20">
        {activeTab === 'home' && (
          <div className="max-w-7xl mx-auto px-4 py-32 text-center">
            <h1 className="text-8xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
              Hyper-Fitness <span className="text-green-500">by Intelligence</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Harnessing cutting‑edge ML logic to transform nutrition insights into peak performance outcomes..
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setActiveTab('workout')}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
              >
                Start Session <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setActiveTab('dietetics')}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Activity size={20} /> Build  Diet
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dietetics' && (
          <HealthTab
            bmiHeight={bmiHeight} setBmiHeight={setBmiHeight}
            bmiWeight={bmiWeight} setBmiWeight={setBmiWeight}
            age={age} setAge={setAge}
            pal={pal} setPal={setPal}
            conditions={conditions} setConditions={setConditions}
            dietPreference={dietPreference} setDietPreference={setDietPreference}
            calculateBMI={calculateBMI} bmiResult={bmiResult}
            generateWeeklyDiet={generateWeeklyDiet}
            isGeneratingDiet={isGeneratingDiet}
            dietPlan={weeklyDietPlan}
            dietError={dietError}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab workouts={workouts} userIsAnonymous={user.isAnonymous} />
        )}

        {activeTab === 'workout' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <WorkoutTab
              handleWorkoutSubmit={handleWorkoutSubmit}
              exerciseName={exerciseName} setExerciseName={setExerciseName}
              bodyPart={bodyPart} setBodyPart={setBodyPart}
              weight={weight} setWeight={setWeight}
              reps={reps} setReps={setReps}
              sets={sets} setSets={setSets}
              workouts={workouts}
            />
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <ScannerTab analyzeMealImage={analyzeMealImage} isMealAnalyzing={isMealAnalyzing} mealAnalysis={mealAnalysis} />
          </div>
        )}

        {activeTab === 'rehab' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <RehabTab analyzeFormVision={analyzeFormVision} isFormAnalyzing={isFormAnalyzing} formFeedback={formFeedback} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;







