// import React, { useState, useEffect, useCallback } from 'react';
// import { initializeApp, getApps } from 'firebase/app';
// import {
//   getAuth,
//   signInWithCustomToken,
//   signInAnonymously,
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut
// } from 'firebase/auth';
// import {
//   getFirestore,
//   initializeFirestore,
//   persistentLocalCache,
//   persistentMultipleTabManager,
//   collection,
//   onSnapshot,
//   addDoc,
//   serverTimestamp,
// } from 'firebase/firestore';
// import {
//   Home,
//   Calculator,
//   Camera,
//   Activity,
//   Dumbbell,
//   HeartPulse,
//   ClipboardList,
//   LayoutDashboard,
//   LogOut,
//   User,
//   CheckCircle2,
//   ChevronRight,
//   Sparkles,
//   Zap,
//   BrainCircuit,
//   Stethoscope,
//   Calendar,
//   AlertCircle,
//   Leaf,
//   Beef
// } from 'lucide-react';

// // ─── Firebase Config from .env (Vite) ────────────────────────────────────────
// const firebaseConfig = {
//   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId:             import.meta.env.VITE_FIREBASE_APP_ID,
// };

// // ─── App ID (sanitized — no slashes) ─────────────────────────────────────────
// const rawAppId =
//   typeof __app_id !== 'undefined' ? __app_id : (import.meta.env.VITE_APP_ID || 'gym-buddy-neural');
// const appId = rawAppId.replace(/\//g, '_');

// // ─── Gemini Config from .env ──────────────────────────────────────────────────
// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
// // ─── Gemini Helper ────────────────────────────────────────────────────────────
// // In App.jsx
// const GEN_MODEL = 'gemini-2.0-flash'; // Update the model name here first!

// // 1. Define the missing OpenRouter helper
// async function callOpenRouter(prompt, systemInstruction = '') {
//   if (!OPENROUTER_KEY) throw new Error('OpenRouter API Key is missing in .env');

//   const messages = [];
//   if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
//   messages.push({ role: 'user', content: prompt });

//   const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${OPENROUTER_KEY}`,
//       'HTTP-Referer': 'http://localhost:5173', 
//       'X-Title': 'Gym Buddy Neural',
//     },
//     body: JSON.stringify({
//       model: 'google/gemini-2.0-flash-001', // OpenRouter model ID
//       messages: messages,
//     }),
//   });

//   if (!res.ok) throw new Error(`OpenRouter Error: ${res.status}`);
//   const data = await res.json();
//   return data.choices?.[0]?.message?.content || '';
// }

// // 2. Updated Gemini helper with the fallback connection
// async function callGemini(prompt, systemInstruction = '', imageData = null, isJson = false) {
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
//   const payload = {
//     contents: [{ 
//       parts: [{ text: prompt }] 
//     }],
//     ...(systemInstruction && { 
//       system_instruction: { parts: [{ text: systemInstruction }] } 
//     }), 
//     generationConfig: {
//       ...(isJson && { response_mime_type: 'application/json' }), 
//       temperature: 0.4,
//     },
//   };

//   const fetchWithRetry = async (retries = 0) => {
//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       // Handle Rate Limit (429) by switching to OpenRouter
//       if (response.status === 429) {
//         console.warn("Gemini limit reached. Switching to OpenRouter...");
//         return await callOpenRouter(prompt, systemInstruction);
//       }

//       if (!response.ok) {
//         const errText = await response.text();
//         throw new Error(`Gemini API Error ${response.status}: ${errText}`);
//       }

//       const data = await response.json();
//       let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
//       if (!text) throw new Error('Empty response from Gemini');
//       if (isJson) text = text.replace(/```json|```/g, '').trim();
      
//       return text;
//     } catch (err) {
//       // If it's a simple network error, retry a few times
//       if (retries < 2 && !err.message.includes('429')) {
//         await new Promise(r => setTimeout(r, 2000));
//         return fetchWithRetry(retries + 1);
//       }
//       throw err;
//     }
//   };

//   return fetchWithRetry();
// }

// // ─── NavBar ───────────────────────────────────────────────────────────────────
// const NavBar = ({ activeTab, setActiveTab, onLogout }) => {
//   const navItems = [
//     { id: 'home',      icon: Home,         label: 'Home'       },
//     { id: 'dietetics', icon: Calculator,   label: 'Dietetics'  },
//     { id: 'scanner',   icon: Camera,       label: 'Food Vision'},
//     { id: 'workout',   icon: Dumbbell,     label: 'Workouts'   },
//     { id: 'rehab',     icon: Stethoscope,  label: 'Rehab'      },
//     { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard'},
//   ];

//   return (
//     <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
//             <BrainCircuit className="text-white w-5 h-5" />
//           </div>
//           <span className="text-xl font-bold text-slate-900 tracking-tight italic">
//             Nutri Track{' '}
//             <span className="text-[10px] bg-green-100 text-red-600 px-2 py-0.5 rounded-full align-top ml-1 uppercase font-bold tracking-widest italic">
//               Ai 
//             </span>
//           </span>
//         </div>

//         <div className="hidden md:flex items-center gap-1">
//           {navItems.map(({ id, icon: Icon, label }) => (
//             <button
//               key={id}
//               onClick={() => setActiveTab(id)}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 activeTab === id ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'
//               }`}
//             >
//               <Icon size={16} />
//               {label}
//             </button>
//           ))}
//         </div>

//         <button
//           onClick={onLogout}
//           className="text-slate-400 hover:text-red-500 text-xs font-bold px-4 py-2 flex items-center gap-2 transition-colors"
//         >
//           <LogOut size={16} /> LOGOUT
//         </button>
//       </div>
//     </nav>
//   );
// };

// // ─── DashboardTab ─────────────────────────────────────────────────────────────
// const DashboardTab = ({ workouts, userIsAnonymous }) => {
//   const weeklyIntensity = workouts.reduce(
//     (acc, curr) => acc + (Number(curr.weight) || 0) * (Number(curr.reps) || 0),
//     0
//   );

//   const calculate1RM = () => {
//     if (!workouts.length) return '--';
//     const { weight: w, reps: r } = workouts[0];
//     const wn = Number(w) || 0;
//     const rn = Number(r) || 0;
//     if (rn === 0) return wn;
//     return Math.round(wn * (1 + rn / 30));
//   };

//   const formatDate = ts => {
//     if (!ts?.seconds) return 'N/A';
//     return new Date(ts.seconds * 1000).toLocaleDateString();
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="bg-white rounded-[40px] p-10 border border-slate-100 mb-8 shadow-sm flex items-center justify-between">
//         <div className="flex items-center gap-6">
//           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
//             <User size={48} className="text-green-500" />
//           </div>
//           <div>
//             <h2 className="text-4xl font-extrabold text-slate-900 mb-1">
//               Welcome, {userIsAnonymous ? 'Guest' : 'Athlete'}! 👋
//             </h2>
//             <p className="text-slate-500 font-medium">Your next level starts today.</p>
//           </div>
//         </div>
//         <div className="hidden lg:block bg-slate-50 p-6 rounded-3xl border border-slate-100">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Predicted</p>
//           <p className="text-2xl font-black text-slate-900">{calculate1RM()} kg</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         {[
//           { label: 'Total Volume', value: `${weeklyIntensity} kg` },
//           { label: 'Total Lifts',  value: workouts.length },
//           { label: 'Status',       value: userIsAnonymous ? 'Guest' : 'Member', green: true },
//           { label: 'Last Activity',value: formatDate(workouts[0]?.timestamp) },
//         ].map(({ label, value, green }) => (
//           <div key={label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
//             <p className={`text-2xl font-black ${green ? 'text-green-500' : 'text-slate-900'}`}>{value}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // ─── DietPlan Display ─────────────────────────────────────────────────────────
// const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
// const MEALS  = ['Breakfast','Morning Snack','Lunch','Afternoon Snack','Dinner','Supper'];

// const DietPlanGrid = ({ dietPlan, dietPreference }) => (
//   <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm overflow-x-auto mt-12">
//     <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
//       <Calendar className="text-green-500" />
//       Weekly {dietPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} Meal Plan
//     </h3>
//     <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
//       {DAYS.map(day => {
//         const dayData = dietPlan[day] || {};
//         return (
//           <div key={day} className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
//             <p className="text-xs font-black text-green-600 uppercase mb-4 border-b border-green-100 pb-1">{day}</p>
//             {MEALS.map(meal => {
//               // Accept both exact key match and lowercase/snake_case variants
//               const value =
//                 dayData[meal] ||
//                 dayData[meal.toLowerCase()] ||
//                 dayData[meal.replace(' ', '_')] ||
//                 dayData[meal.toLowerCase().replace(' ', '_')] ||
//                 dayData[meal.replace(' ', '')] ||
//                 '';
//               if (!value) return null;
//               const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
//               return (
//                 <div key={meal} className="mb-3">
//                   <p className="text-[9px] font-black text-slate-400 uppercase">{meal}</p>
//                   <p className="text-[11px] text-slate-700 leading-tight">{text}</p>
//                 </div>
//               );
//             })}
//             {/* Render any extra keys the model returned */}
//             {Object.entries(dayData)
//               .filter(([k]) =>
//                 !MEALS.some(m =>
//                   k === m ||
//                   k === m.toLowerCase() ||
//                   k === m.replace(' ', '_') ||
//                   k === m.toLowerCase().replace(' ', '_') ||
//                   k === m.replace(' ', '')
//                 )
//               )
//               .map(([k, v]) => (
//                 <div key={k} className="mb-3">
//                   <p className="text-[9px] font-black text-slate-400 uppercase">{k}</p>
//                   <p className="text-[11px] text-slate-700 leading-tight">
//                     {typeof v === 'object' ? JSON.stringify(v) : String(v)}
//                   </p>
//                 </div>
//               ))}
//           </div>
//         );
//       })}
//     </div>
//   </div>
// );

// // ─── HealthTab ────────────────────────────────────────────────────────────────

// const HealthTab = ({
//   bmiHeight, setBmiHeight, bmiWeight, setBmiWeight,
//   age, setAge, pal, setPal,
//   conditions, setConditions,
//   dietPreference, setDietPreference,
//   calculateBMI, bmiResult,
//   generateWeeklyDiet, isGeneratingDiet, dietPlan,
//   dietError,
// }) => (
//   <div className="max-w-6xl mx-auto px-4 py-12">
//     <div className="text-center mb-12">
//       <h2 className="text-4xl font-extrabold text-slate-900 mb-4 uppercase italic">Diet Synthesis</h2>
//       <p className="text-slate-500">Mapping user biometrics to optimized meal sequences.</p>
//     </div>

//     <div className="grid md:grid-cols-2 gap-8 mb-4">
//       {/* Left Card */}
//       <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
//         <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
//           <User size={20} className="text-green-500" />Profile Input
//         </h3>

//         {/* Diet preference */}
//         <div className="mb-6">
//           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
//             Dietary Preference
//           </label>
//           <div className="grid grid-cols-2 gap-4">
//             {[
//               { val: 'veg',     label: 'Vegetarian',     Icon: Leaf, active: 'bg-green-500 border-green-500' },
//               { val: 'non-veg', label: 'Non-Vegetarian', Icon: Beef, active: 'bg-red-500 border-red-500'   },
//             ].map(({ val, label, Icon, active }) => (
//               <button
//                 key={val}
//                 onClick={() => setDietPreference(val)}
//                 className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
//                   dietPreference === val ? `${active} text-white shadow-lg` : 'bg-slate-50 text-slate-400 border-slate-100'
//                 }`}
//               >
//                 <Icon size={18} /> {label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Numeric inputs */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           {[
//             { label: 'Height (cm)', val: bmiHeight, set: setBmiHeight, type: 'number' },
//             { label: 'Weight (kg)', val: bmiWeight, set: setBmiWeight, type: 'number' },
//             { label: 'Age',         val: age,       set: setAge,       type: 'number' },
//           ].map(({ label, val, set, type }) => (
//             <div key={label}>
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</label>
//               <input
//                 type={type}
//                 value={val}
//                 onChange={e => set(e.target.value)}
//                 className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 outline-none focus:ring-2 focus:ring-green-500"
//               />
//             </div>
//           ))}
//           <div>
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Activity (PAL)</label>
//             <select
//               value={pal}
//               onChange={e => setPal(e.target.value)}
//               className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 outline-none focus:ring-2 focus:ring-green-500"
//             >
//               <option value="1.2">Sedentary (1.2)</option>
//               <option value="1.375">Light (1.375)</option>
//               <option value="1.55">Moderate (1.55)</option>
//               <option value="1.725">Very Active (1.725)</option>
//             </select>
//           </div>
//         </div>

//         {/* Clinical conditions */}
//         <div className="mb-6">
//           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Clinical Conditions</label>
//           <div className="flex flex-wrap gap-2">
//             {['CVD', 'T2D', 'Iron Deficiency', 'Hyperthyroid'].map(c => (
//               <button
//                 key={c}
//                 onClick={() =>
//                   setConditions(prev =>
//                     prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
//                   )
//                 }
//                 className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
//                   conditions.includes(c)
//                     ? 'bg-red-500 text-white shadow-lg'
//                     : 'bg-slate-50 text-slate-400 border border-slate-100'
//                 }`}
//               >
//                 {c}
//               </button>
//             ))}
//           </div>
//         </div>

//         <button
//           onClick={calculateBMI}
//           className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-600 transition-all"
//         >
//           Calculate
//         </button>
//       </div>

//       {/* Right Card */}
//       <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl flex flex-col justify-center">
//         {bmiResult ? (
//           <div className="text-center">
//             <div className="flex justify-center gap-8 mb-8">
//               <div>
//                 <p className="text-5xl font-black text-green-400">{bmiResult.bmi}</p>
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">BMI Index</p>
//               </div>
//               <div>
//                 <p className="text-5xl font-black text-blue-400">{bmiResult.tdee}</p>
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Target kcal</p>
//               </div>
//             </div>
//             <p className="text-xl font-bold mb-2 text-slate-300">
//               Status: <span className="text-white">{bmiResult.category}</span>
//             </p>
//             <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">
//               Preference: {dietPreference.toUpperCase()}
//             </p>
//             {dietError && (
//               <p className="text-red-400 text-xs font-bold mb-4 bg-red-900/30 p-3 rounded-xl">
//                 ⚠ {dietError}
//               </p>
//             )}
//             <button
//               onClick={generateWeeklyDiet}
//               disabled={isGeneratingDiet}
//               className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {isGeneratingDiet ? (
//                 <span className="flex items-center gap-2">
//                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//                   </svg>
//                   Synthesizing Plan...
//                 </span>
//               ) : (
//                 <><Sparkles size={20} /> Generate Weekly Plan</>
//               )}
//             </button>
//           </div>
//         ) : (
//           <div className="text-center opacity-50">
//             <BrainCircuit size={64} className="mx-auto mb-4 text-green-500" />
//             <p className="uppercase font-bold tracking-widest text-xs">Awaiting Biometric Encoding</p>
//           </div>
//         )}
//       </div>
//     </div>

//     {/* Diet Plan Grid */}
//     {dietPlan && <DietPlanGrid dietPlan={dietPlan} dietPreference={dietPreference} />}
//   </div>
// );

// // ─── ScannerTab ───────────────────────────────────────────────────────────────
// const ScannerTab = ({ analyzeMealImage, isMealAnalyzing, mealAnalysis }) => (
//   <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm text-center">
//     <h2 className="text-3xl font-black text-slate-900 mb-4 flex items-center justify-center gap-3 italic uppercase">
//       <Camera className="text-green-500" /> Vision Intake
//     </h2>
//     <p className="text-slate-400 text-sm mb-12">Extracting nutritional tensors from raw image data.</p>
//     <label className="block w-full cursor-pointer bg-slate-50 p-24 rounded-[40px] border-4 border-dashed border-slate-100 hover:border-green-500 transition-all group">
//       <input type="file" accept="image/*" onChange={analyzeMealImage} className="hidden" />
//       <div className="flex flex-col items-center">
//         <Camera size={64} className="text-slate-200 group-hover:text-green-500 transition-colors mb-6" />
//         <p className="font-black text-slate-400 group-hover:text-green-600 uppercase text-xs tracking-widest">
//           {isMealAnalyzing ? 'Analyzing Neural Tensors...' : 'Upload Image for Computer Vision Extraction'}
//         </p>
//       </div>
//     </label>
//     {mealAnalysis && (
//       <div className="mt-12 grid grid-cols-3 gap-6 text-center">
//         <div className="bg-green-50 p-8 rounded-[30px] border border-green-100">
//           <p className="text-4xl font-black text-green-600">{mealAnalysis.calories || 0}</p>
//           <p className="text-[10px] font-black uppercase text-green-400 tracking-widest mt-1">Calories</p>
//         </div>
//         <div className="bg-blue-50 p-8 rounded-[30px] border border-blue-100">
//           <p className="text-4xl font-black text-blue-600">{mealAnalysis.protein || 0}g</p>
//           <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mt-1">Protein</p>
//         </div>
//         <div className="bg-slate-50 p-8 rounded-[30px] border border-slate-100">
//           <p className="text-lg font-bold text-slate-900 truncate uppercase">{mealAnalysis.dish || 'Unknown'}</p>
//           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Classification</p>
//         </div>
//       </div>
//     )}
//   </div>
// );

// // ─── RehabTab ─────────────────────────────────────────────────────────────────
// const RehabTab = ({ analyzeFormVision, isFormAnalyzing, formFeedback }) => (
//   <div className="max-w-4xl mx-auto px-4">
//     <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm">
//       <h2 className="text-3xl font-black text-slate-900 mb-4 flex items-center gap-3 italic uppercase">
//         <Stethoscope className="text-green-500" /> AI Form Expert
//       </h2>
//       <p className="text-slate-400 text-sm mb-12">Biomechanical analysis using multi-modal visual reasoning.</p>
//       <label className="block w-full cursor-pointer bg-slate-50 p-24 rounded-[40px] border-4 border-dashed border-slate-100 hover:border-green-500 transition-all group mb-12">
//         <input type="file" accept="image/*" onChange={analyzeFormVision} className="hidden" />
//         <div className="flex flex-col items-center">
//           <Activity size={64} className="text-slate-200 group-hover:text-green-500 mb-6 transition-colors" />
//           <p className="font-black text-slate-400 group-hover:text-green-600 uppercase text-xs tracking-widest">
//             {isFormAnalyzing ? 'Analyzing Biomechanics...' : 'Upload Form Snapshot'}
//           </p>
//         </div>
//       </label>
//       {formFeedback && (
//         <div className="bg-blue-50 p-10 rounded-[35px] text-sm text-blue-800 border border-blue-100 leading-relaxed shadow-inner">
//           <h4 className="font-black uppercase tracking-widest mb-4 flex items-center gap-2">
//             <Zap size={16} className="text-yellow-500" /> Kinesiological Insight
//           </h4>
//           <div className="whitespace-pre-wrap">{formFeedback}</div>
//         </div>
//       )}
//     </div>
//   </div>
// );

// // ─── WorkoutTab ───────────────────────────────────────────────────────────────
// const WorkoutTab = ({
//   handleWorkoutSubmit, exerciseName, setExerciseName,
//   bodyPart, setBodyPart, weight, setWeight, reps, setReps, sets, setSets, workouts,
// }) => (
//   <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm">
//     <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-3 italic uppercase">
//       <Dumbbell className="text-green-500" /> Record Session
//     </h2>
//     <form onSubmit={handleWorkoutSubmit} className="space-y-6">
//       <div className="grid md:grid-cols-2 gap-6">
//         <select
//           value={bodyPart}
//           onChange={e => setBodyPart(e.target.value)}
//           className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none font-bold focus:ring-2 focus:ring-green-500"
//         >
//           <option value="">Muscle Target</option>
//           {['Chest','Back','Legs','Shoulders','Arms','Core'].map(p => (
//             <option key={p} value={p}>{p}</option>
//           ))}
//         </select>
//         <input
//           required
//           value={exerciseName}
//           onChange={e => setExerciseName(e.target.value)}
//           placeholder="Exercise Name"
//           className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none font-bold focus:ring-2 focus:ring-green-500"
//         />
//       </div>
//       <div className="grid grid-cols-3 gap-6">
//         {[
//           { label: 'Kg',   val: weight, set: setWeight },
//           { label: 'Reps', val: reps,   set: setReps   },
//           { label: 'Sets', val: sets,   set: setSets   },
//         ].map(({ label, val, set }) => (
//           <div key={label}>
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">{label}</label>
//             <input
//               type="number"
//               value={val}
//               onChange={e => set(e.target.value)}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center font-black text-xl outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//         ))}
//       </div>
//       <button
//         type="submit"
//         className="w-full py-6 bg-green-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
//       >
//         Synchronize Session
//       </button>
//     </form>

//     <div className="mt-16 space-y-4">
//       <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.5em] mb-6">Recent Lift Data</h3>
//       {workouts.slice(0, 4).map(w => (
//         <div
//           key={w.id}
//           className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-green-300 transition-all"
//         >
//           <div>
//             <p className="font-black text-slate-900 uppercase text-sm tracking-tighter">{w.exercise || 'Unnamed Exercise'}</p>
//             <p className="text-[10px] text-slate-400 font-bold uppercase">{w.bodyPart || 'Unspecified'}</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <span className="bg-white px-4 py-2 rounded-xl text-xs font-black text-slate-900 border border-slate-100">
//               {w.weight || 0} KG
//             </span>
//             <span className="bg-green-500 px-4 py-2 rounded-xl text-xs font-black text-white">
//               {w.reps || 0} R
//             </span>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// // ─── Main App ─────────────────────────────────────────────────────────────────
// const App = () => {
//   const [activeTab, setActiveTab] = useState('home');
//   const [loading, setLoading]     = useState(true);
//   const [user, setUser]           = useState(null);
//   const [db, setDb]               = useState(null);
//   const [auth, setAuth]           = useState(null);
//   const [workouts, setWorkouts]   = useState([]);
//   const [initError, setInitError] = useState('');

//   // Auth
//   const [authView, setAuthView]   = useState('login');
//   const [email, setEmail]         = useState('');
//   const [password, setPassword]   = useState('');
//   const [authError, setAuthError] = useState('');

//   // Dietetics
//   const [bmiHeight, setBmiHeight]           = useState('180');
//   const [bmiWeight, setBmiWeight]           = useState('78');
//   const [age, setAge]                       = useState('22');
//   const [pal, setPal]                       = useState('1.55');
//   const [conditions, setConditions]         = useState([]);
//   const [dietPreference, setDietPreference] = useState('veg');
//   const [bmiResult, setBmiResult]           = useState(null);
//   const [weeklyDietPlan, setWeeklyDietPlan] = useState(null);
//   const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
//   const [dietError, setDietError]           = useState('');

//   // Workout
//   const [exerciseName, setExerciseName] = useState('');
//   const [bodyPart, setBodyPart]         = useState('');
//   const [weight, setWeight]             = useState('');
//   const [reps, setReps]                 = useState('');
//   const [sets, setSets]                 = useState('');

//   // Rehab
//   const [formFeedback, setFormFeedback]     = useState('');
//   const [isFormAnalyzing, setIsFormAnalyzing] = useState(false);

//   // Scanner
//   const [isMealAnalyzing, setIsMealAnalyzing] = useState(false);
//   const [mealAnalysis, setMealAnalysis]       = useState(null);

//   // ── Firebase init ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     let unsubscribeAuth = () => {};

//     const initApp = async () => {
//       try {
//         // Prevent duplicate Firebase app init
//         const isFirstInit = getApps().length === 0;
//         const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

//         const firebaseAuth = getAuth(app);
//         // Use new persistent cache API (replaces deprecated enableIndexedDbPersistence)
//         const firestore = isFirstInit
//           ? initializeFirestore(app, {
//               localCache: persistentLocalCache({
//                 tabManager: persistentMultipleTabManager(),
//               }),
//             })
//           : getFirestore(app);

//         setDb(firestore);
//         setAuth(firebaseAuth);

//         // Sign in with custom token if available, else anonymous
//         if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
//           await signInWithCustomToken(firebaseAuth, __initial_auth_token);
//         } else {
//           // Don't auto-sign-in here — let user choose email or guest
//           // Remove this block if you DON'T want auto-anonymous on load:
//           // await signInAnonymously(firebaseAuth);
//         }

//         unsubscribeAuth = onAuthStateChanged(firebaseAuth, u => {
//           setUser(u);
//           setLoading(false);
//         });
//       } catch (err) {
//         console.error('Firebase Init Error:', err);
//         setInitError(err.message);
//         setLoading(false);
//       }
//     };

//     initApp();
//     return () => unsubscribeAuth();
//   }, []);

//   // ── Firestore listener ─────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!db || !user) return;

//     const q = collection(db, 'artifacts', appId, 'users', user.uid, 'workouts');
//     const unsubscribe = onSnapshot(
//       q,
//       snapshot => {
//         const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
//         setWorkouts(list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
//       },
//       err => {
//         // Only log — don't crash the UI for network errors
//         console.warn('Firestore snapshot error:', err.code, err.message);
//       }
//     );
//     return () => unsubscribe();
//   }, [db, user]);

//   // ── Auth handlers ──────────────────────────────────────────────────────────
//   const handleAuth = async e => {
//     e.preventDefault();
//     setAuthError('');
//     if (!auth) return;
//     try {
//       if (authView === 'login') {
//         await signInWithEmailAndPassword(auth, email, password);
//       } else {
//         await createUserWithEmailAndPassword(auth, email, password);
//       }
//     } catch (err) {
//       if (err.code === 'auth/operation-not-allowed') {
//         setAuthError("Enable 'Email/Password' auth in Firebase Console.");
//       } else if (err.code === 'auth/network-request-failed') {
//         setAuthError('Network error. Check your internet connection.');
//       } else {
//         setAuthError(err.message);
//       }
//     }
//   };

//   const handleGuestLogin = async () => {
//     if (!auth) return;
//     setAuthError('');
//     try {
//       await signInAnonymously(auth);
//     } catch (err) {
//       if (err.code === 'auth/operation-not-allowed') {
//         setAuthError("Enable 'Anonymous' sign-in in Firebase Console.");
//       } else if (err.code === 'auth/network-request-failed') {
//         setAuthError('Network error. Check your internet connection.');
//       } else {
//         setAuthError('Guest login failed.');
//       }
//     }
//   };

//   // ── BMI / TDEE ─────────────────────────────────────────────────────────────
//   const calculateBMI = useCallback(() => {
//     const h = Number(bmiHeight) / 100;
//     const w = Number(bmiWeight);
//     const a = Number(age);
//     if (!h || !w || !a) return;
//     const bmiVal     = (w / (h * h)).toFixed(1);
//     const bmrVal     = Math.round(10 * w + 6.25 * Number(bmiHeight) - 5 * a + 5);
//     const tdeeVal    = Math.round(bmrVal * Number(pal));
//     let categoryVal  = bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese';
//     setBmiResult({ bmi: bmiVal, category: categoryVal, bmr: bmrVal, tdee: tdeeVal });
//   }, [bmiHeight, bmiWeight, age, pal]);

//   // ── Diet generation ────────────────────────────────────────────────────────
//   const generateWeeklyDiet = async () => {
//     if (!bmiResult) return;
//     setIsGeneratingDiet(true);
//     setWeeklyDietPlan(null);
//     setDietError('');
//     try {
//       const condStr = conditions.length ? conditions.join(', ') : 'None';
//       const prompt = `
// You are a certified Indian dietitian.
// Generate a STRICTLY ${dietPreference === 'veg' ? 'VEGETARIAN (no meat, no eggs, no fish)' : 'NON-VEGETARIAN'} 7-day Indian meal plan.

// User stats:
// - Weight: ${bmiWeight} kg
// - Height: ${bmiHeight} cm
// - Age: ${age} years
// - Activity Level (PAL): ${pal}
// - Target TDEE: ${bmiResult.tdee} kcal/day
// - BMI: ${bmiResult.bmi} (${bmiResult.category})
// - Medical conditions: ${condStr}

// Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
// {
//   "Monday": {
//     "Breakfast": "...",
//     "Morning Snack": "...",
//     "Lunch": "...",
//     "Afternoon Snack": "...",
//     "Dinner": "...",
//     "Supper": "..."
//   },
//   "Tuesday": { ... },
//   "Wednesday": { ... },
//   "Thursday": { ... },
//   "Friday": { ... },
//   "Saturday": { ... },
//   "Sunday": { ... }
// }

// Each meal value should be a short 1–2 sentence description including approximate calories.
// `.trim();

//       const raw      = await callGemini(prompt, '', null, true);
//       const cleaned  = raw.replace(/```json|```/g, '').trim();
//       const parsed   = JSON.parse(cleaned);
//       setWeeklyDietPlan(parsed);
//     } catch (err) {
//       console.error('Diet generation error:', err);
//       setDietError(`Failed: ${err.message}. Please retry.`);
//     } finally {
//       setIsGeneratingDiet(false);
//     }
//   };

//   // ── Form vision ────────────────────────────────────────────────────────────
//   const analyzeFormVision = async e => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setIsFormAnalyzing(true);
//     setFormFeedback('');
//     const reader = new FileReader();
//     reader.onloadend = async () => {
//       try {
//         const base64Data = reader.result.split(',')[1];
//         const result = await callGemini(
//           'Analyze this exercise form image. Identify the exercise, evaluate posture, joint alignment, and give specific correction tips.',
//           'You are an expert kinesiologist and personal trainer.',
//           { mimeType: file.type, data: base64Data }
//         );
//         setFormFeedback(result);
//       } catch (err) {
//         setFormFeedback(`Analysis failed: ${err.message}`);
//       } finally {
//         setIsFormAnalyzing(false);
//       }
//     };
//     reader.readAsDataURL(file);
//   };

//   // ── Workout submit ─────────────────────────────────────────────────────────
//   const handleWorkoutSubmit = async e => {
//     e.preventDefault();
//     if (!user || !db || !exerciseName) return;
//     try {
//       await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workouts'), {
//         exercise: String(exerciseName),
//         bodyPart: String(bodyPart),
//         weight:   Number(weight),
//         reps:     Number(reps),
//         sets:     Number(sets),
//         timestamp: serverTimestamp(),
//       });
//       setExerciseName('');
//       setWeight('');
//       setReps('');
//       setSets('');
//     } catch (err) {
//       console.error('Firestore write error:', err);
//     }
//   };

//   // ── Meal scanner ───────────────────────────────────────────────────────────
//   const analyzeMealImage = async e => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setIsMealAnalyzing(true);
//     setMealAnalysis(null);
//     const reader = new FileReader();
//     reader.onloadend = async () => {
//       try {
//         const base64Data = reader.result.split(',')[1];
//         const prompt = `
// Analyze this meal image and return ONLY a valid JSON object (no markdown) with:
// {
//   "dish": "Name of the dish",
//   "calories": estimated_integer_calories,
//   "protein": estimated_grams_protein_integer,
//   "carbs": estimated_grams_carbs_integer,
//   "fat": estimated_grams_fat_integer
// }
// `.trim();
//         const raw     = await callGemini(prompt, 'You are a professional nutritionist.', { mimeType: file.type, data: base64Data }, true);
//         const cleaned = raw.replace(/```json|```/g, '').trim();
//         setMealAnalysis(JSON.parse(cleaned));
//       } catch (err) {
//         console.error('Meal analysis error:', err);
//         setMealAnalysis({ dish: 'Error', calories: 0, protein: 0 });
//       } finally {
//         setIsMealAnalyzing(false);
//       }
//     };
//     reader.readAsDataURL(file);
//   };

//   // ── Render ─────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="text-center">
//           <BrainCircuit size={48} className="text-green-500 animate-pulse mx-auto mb-4" />
//           <p className="text-green-500 font-black animate-pulse uppercase tracking-widest">GYM BUDDY NEURAL</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
//         <div className="w-full max-w-md bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100">
//           <div className="flex flex-col items-center mb-10">
//             <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-100">
//               <BrainCircuit className="text-white w-10 h-10" />
//             </div>
//             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Gym Buddy</h1>
//             <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Next-Gen AI Partner</p>
//           </div>

//           {initError && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
//               <p className="text-xs text-red-500 font-bold">⚠ Init Error: {initError}</p>
//             </div>
//           )}

//           <form onSubmit={handleAuth} className="space-y-4">
//             <input
//               type="email"
//               placeholder="Email Address"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
//             />
//             <input
//               type="password"
//               placeholder="Access Key"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
//             />
//             {authError && (
//               <p className="text-[10px] text-red-500 text-center font-bold px-2 uppercase">{authError}</p>
//             )}
//             <button
//               type="submit"
//               className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
//             >
//               {authView === 'login' ? 'Proceed to System' : 'Create Profile'}
//             </button>
//           </form>

//           <div className="mt-8 text-center">
//             <button
//               onClick={() => { setAuthView(v => v === 'login' ? 'signup' : 'login'); setAuthError(''); }}
//               className="text-xs text-slate-400 hover:text-green-500 font-bold transition-all"
//             >
//               {authView === 'login' ? 'New here? Register Profile' : 'Have account? Sign In'}
//             </button>
//             <div className="flex items-center gap-4 py-6">
//               <div className="flex-1 h-[1px] bg-slate-100" />
//               <span className="text-[10px] text-slate-300 font-bold">OR</span>
//               <div className="flex-1 h-[1px] bg-slate-100" />
//             </div>
//             <button
//               onClick={handleGuestLogin}
//               className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-green-600 transition-all"
//             >
//               Explore in Guest Mode
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
//       <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => signOut(auth)} />
//       <main className="pb-20">
//         {activeTab === 'home' && (
//           <div className="max-w-7xl mx-auto px-4 py-32 text-center">
//             <h1 className="text-8xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
//               Hyper-Fitness <span className="text-green-500">by Intelligence</span>
//             </h1>
//             <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
//               Harnessing cutting‑edge ML logic to transform nutrition insights into peak performance outcomes..
//             </p>
//             <div className="flex justify-center gap-6">
//               <button
//                 onClick={() => setActiveTab('workout')}
//                 className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
//               >
//                 Start Session <ChevronRight size={20} />
//               </button>
//               <button
//                 onClick={() => setActiveTab('dietetics')}
//                 className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
//               >
//                 <Activity size={20} /> Build  Diet
//               </button>
//             </div>
//           </div>
//         )}

//         {activeTab === 'dietetics' && (
//           <HealthTab
//             bmiHeight={bmiHeight} setBmiHeight={setBmiHeight}
//             bmiWeight={bmiWeight} setBmiWeight={setBmiWeight}
//             age={age} setAge={setAge}
//             pal={pal} setPal={setPal}
//             conditions={conditions} setConditions={setConditions}
//             dietPreference={dietPreference} setDietPreference={setDietPreference}
//             calculateBMI={calculateBMI} bmiResult={bmiResult}
//             generateWeeklyDiet={generateWeeklyDiet}
//             isGeneratingDiet={isGeneratingDiet}
//             dietPlan={weeklyDietPlan}
//             dietError={dietError}
//           />
//         )}

//         {activeTab === 'dashboard' && (
//           <DashboardTab workouts={workouts} userIsAnonymous={user.isAnonymous} />
//         )}

//         {activeTab === 'workout' && (
//           <div className="max-w-4xl mx-auto px-4 py-12">
//             <WorkoutTab
//               handleWorkoutSubmit={handleWorkoutSubmit}
//               exerciseName={exerciseName} setExerciseName={setExerciseName}
//               bodyPart={bodyPart} setBodyPart={setBodyPart}
//               weight={weight} setWeight={setWeight}
//               reps={reps} setReps={setReps}
//               sets={sets} setSets={setSets}
//               workouts={workouts}
//             />
//           </div>
//         )}

//         {activeTab === 'scanner' && (
//           <div className="max-w-4xl mx-auto px-4 py-12">
//             <ScannerTab analyzeMealImage={analyzeMealImage} isMealAnalyzing={isMealAnalyzing} mealAnalysis={mealAnalysis} />
//           </div>
//         )}

//         {activeTab === 'rehab' && (
//           <div className="max-w-4xl mx-auto px-4 py-12">
//             <RehabTab analyzeFormVision={analyzeFormVision} isFormAnalyzing={isFormAnalyzing} formFeedback={formFeedback} />
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default App;











// import React, { useState, useEffect, useCallback } from 'react';
// import { initializeApp, getApps } from 'firebase/app';
// import {
//   getAuth,
//   signInWithCustomToken,
//   signInAnonymously,
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut
// } from 'firebase/auth';
// import {
//   getFirestore,
//   initializeFirestore,
//   persistentLocalCache,
//   persistentMultipleTabManager,
//   collection,
//   onSnapshot,
//   addDoc,
//   serverTimestamp,
// } from 'firebase/firestore';
// import {
//   Home,
//   Calculator,
//   Camera,
//   Activity,
//   Dumbbell,
//   HeartPulse,
//   ClipboardList,
//   LayoutDashboard,
//   LogOut,
//   User,
//   CheckCircle2,
//   ChevronRight,
//   Sparkles,
//   Zap,
//   BrainCircuit,
//   Stethoscope,
//   Calendar,
//   AlertCircle,
//   Leaf,
//   Beef,
//   Flame,
//   TrendingDown,
//   TrendingUp,
//   Shield,
//   Target,
//   Swords,
// } from 'lucide-react';

// // ─── Firebase Config from .env (Vite) ────────────────────────────────────────
// const firebaseConfig = {
//   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId:             import.meta.env.VITE_FIREBASE_APP_ID,
// };

// const rawAppId =
//   typeof __app_id !== 'undefined' ? __app_id : (import.meta.env.VITE_APP_ID || 'gym-buddy-neural');
// const appId = rawAppId.replace(/\//g, '_');

// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
// const GEN_MODEL = 'gemini-2.0-flash';

// // ─── FITNESS OBJECTIVES CONFIG ────────────────────────────────────────────────
// const FITNESS_OBJECTIVES = [
//   {
//     id: 'lose_weight',
//     label: 'Lose Weight',
//     tagline: 'Burn fat, reveal definition',
//     icon: TrendingDown,
//     color: 'orange',
//     colorClass: 'bg-orange-500',
//     softClass: 'bg-orange-50 border-orange-200 text-orange-700',
//     activeClass: 'bg-orange-500 border-orange-500 text-white shadow-orange-200',
//     kcalModifier: -400,       // deficit from TDEE
//     proteinMultiplier: 2.2,   // g per kg bodyweight
//     exerciseFocus: 'HIIT + Moderate Cardio + Compound Lifts',
//   },
//   {
//     id: 'gain_muscle',
//     label: 'Gain Muscle',
//     tagline: 'Build mass, maximise hypertrophy',
//     icon: TrendingUp,
//     color: 'green',
//     colorClass: 'bg-green-500',
//     softClass: 'bg-green-50 border-green-200 text-green-700',
//     activeClass: 'bg-green-500 border-green-500 text-white shadow-green-200',
//     kcalModifier: +300,
//     proteinMultiplier: 2.4,
//     exerciseFocus: 'Progressive Overload Strength + Accessory Hypertrophy',
//   },
//   {
//     id: 'maintain',
//     label: 'Maintain',
//     tagline: 'Sustain performance & health',
//     icon: Shield,
//     color: 'blue',
//     colorClass: 'bg-blue-500',
//     softClass: 'bg-blue-50 border-blue-200 text-blue-700',
//     activeClass: 'bg-blue-500 border-blue-500 text-white shadow-blue-200',
//     kcalModifier: 0,
//     proteinMultiplier: 1.8,
//     exerciseFocus: 'Mixed Modality: Strength + Cardio + Mobility',
//   },
// ];

// // ─── Robust JSON Extractor ────────────────────────────────────────────────────
// // Handles: ```json ... ```, ``` ... ```, plain JSON, JSON buried in prose
// function extractJson(raw) {
//   if (!raw) throw new Error('Empty response');

//   // 1. Try stripping any markdown code fence (```json, ```JSON, ```, etc.)
//   const fenceMatch = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
//   if (fenceMatch) {
//     const candidate = fenceMatch[1].trim();
//     try { return JSON.parse(candidate); } catch (_) { /* fall through */ }
//   }

//   // 2. Try parsing the whole string directly (model returned clean JSON)
//   try { return JSON.parse(raw.trim()); } catch (_) { /* fall through */ }

//   // 3. Find the first { ... } or [ ... ] block in the string
//   const firstBrace  = raw.indexOf('{');
//   const firstBracket = raw.indexOf('[');
//   let start = -1;
//   if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) start = firstBrace;
//   else if (firstBracket !== -1) start = firstBracket;

//   if (start !== -1) {
//     const lastBrace  = raw.lastIndexOf('}');
//     const lastBracket = raw.lastIndexOf(']');
//     const end = Math.max(lastBrace, lastBracket);
//     if (end > start) {
//       try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) { /* fall through */ }
//     }
//   }

//   throw new Error(`Could not extract valid JSON from response:\n${raw.slice(0, 200)}…`);
// }

// // ─── OpenRouter Helper ────────────────────────────────────────────────────────
// async function callOpenRouter(prompt, systemInstruction = '') {
//   if (!OPENROUTER_KEY) throw new Error('OpenRouter API Key is missing in .env');
//   const messages = [];
//   if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
//   messages.push({ role: 'user', content: prompt });
//   const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${OPENROUTER_KEY}`,
//       'HTTP-Referer': 'http://localhost:5173',
//       'X-Title': 'Nutri Track AI',
//     },
//     body: JSON.stringify({ model: 'google/gemini-2.0-flash-001', messages }),
//   });
//   if (!res.ok) throw new Error(`OpenRouter Error: ${res.status}`);
//   const data = await res.json();
//   return data.choices?.[0]?.message?.content || '';
// }

// // ─── Gemini Helper ────────────────────────────────────────────────────────────
// async function callGemini(prompt, systemInstruction = '', imageData = null, isJson = false) {
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
//   const parts = [{ text: prompt }];
//   if (imageData) {
//     parts.unshift({ inline_data: { mime_type: imageData.mimeType, data: imageData.data } });
//   }
//   const payload = {
//     contents: [{ parts }],
//     ...(systemInstruction && { system_instruction: { parts: [{ text: systemInstruction }] } }),
//     generationConfig: {
//       ...(isJson && { response_mime_type: 'application/json' }),
//       temperature: 0.4,
//     },
//   };

//   const fetchWithRetry = async (retries = 0) => {
//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       if (response.status === 429) {
//         console.warn('Gemini limit reached. Switching to OpenRouter...');
//         const fallback = await callOpenRouter(prompt, systemInstruction);
//         return isJson ? extractJson(fallback) : fallback;
//       }
//       if (!response.ok) {
//         const errText = await response.text();
//         throw new Error(`Gemini API Error ${response.status}: ${errText}`);
//       }
//       const data = await response.json();
//       const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
//       if (!text) throw new Error('Empty response from Gemini');
//       // For JSON mode: return the already-parsed object so callers don't re-parse
//       if (isJson) return extractJson(text);
//       return text;
//     } catch (err) {
//       if (retries < 2 && !err.message.includes('429')) {
//         await new Promise(r => setTimeout(r, 2000));
//         return fetchWithRetry(retries + 1);
//       }
//       throw err;
//     }
//   };
//   return fetchWithRetry();
// }


// // ─── Image Resize Helper ──────────────────────────────────────────────────────
// function resizeImageToBase64(file, maxPx = 1024) {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     const url = URL.createObjectURL(file);
//     img.onload = () => {
//       URL.revokeObjectURL(url);
//       let { width: w, height: h } = img;
//       if (w > maxPx || h > maxPx) {
//         const ratio = Math.min(maxPx / w, maxPx / h);
//         w = Math.round(w * ratio);
//         h = Math.round(h * ratio);
//       }
//       const canvas = document.createElement('canvas');
//       canvas.width = w; canvas.height = h;
//       canvas.getContext('2d').drawImage(img, 0, 0, w, h);
//       const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
//       resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
//     };
//     img.onerror = () => reject(new Error('Image load failed'));
//     img.src = url;
//   });
// }

// // ─── Extract Video Frame Helper ───────────────────────────────────────────────
// function extractVideoFrame(file, timeSec = 2) {
//   return new Promise((resolve, reject) => {
//     const video = document.createElement('video');
//     const url = URL.createObjectURL(file);
//     video.preload = 'metadata';
//     video.onloadeddata = () => {
//       video.currentTime = Math.min(timeSec, video.duration * 0.3);
//     };
//     video.onseeked = () => {
//       const canvas = document.createElement('canvas');
//       canvas.width = Math.min(video.videoWidth, 1024);
//       canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
//       canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
//       URL.revokeObjectURL(url);
//       const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
//       resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
//     };
//     video.onerror = () => reject(new Error('Video load failed'));
//     video.src = url;
//   });
// }

// // ─── Gemini Vision Helper ─────────────────────────────────────────────────────
// async function callGeminiVision(prompt, systemInstruction = '', imageData = null, isJson = false) {
//   return callGemini(prompt, systemInstruction, imageData, isJson);
// }

// // ─── NavBar ───────────────────────────────────────────────────────────────────
// const NavBar = ({ activeTab, setActiveTab, onLogout }) => {
//   const navItems = [
//     { id: 'home',      icon: Home,            label: 'Home'       },
//     { id: 'dietetics', icon: Calculator,      label: 'Dietetics'  },
//     { id: 'scanner',   icon: Camera,          label: 'Food Vision'},
//     { id: 'workout',   icon: Dumbbell,        label: 'Workouts'   },
//     { id: 'rehab',     icon: Stethoscope,     label: 'Rehab'      },
//     { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
//   ];
//   return (
//     <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
//             <BrainCircuit className="text-white w-5 h-5" />
//           </div>
//           <span className="text-xl font-bold text-slate-900 tracking-tight italic">
//             Nutri Track{' '}
//             <span className="text-[10px] bg-green-100 text-red-600 px-2 py-0.5 rounded-full align-top ml-1 uppercase font-bold tracking-widest italic">
//               AI
//             </span>
//           </span>
//         </div>
//         <div className="hidden md:flex items-center gap-1">
//           {navItems.map(({ id, icon: Icon, label }) => (
//             <button
//               key={id}
//               onClick={() => setActiveTab(id)}
//               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                 activeTab === id ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'
//               }`}
//             >
//               <Icon size={16} />
//               {label}
//             </button>
//           ))}
//         </div>
//         <button
//           onClick={onLogout}
//           className="text-slate-400 hover:text-red-500 text-xs font-bold px-4 py-2 flex items-center gap-2 transition-colors"
//         >
//           <LogOut size={16} /> LOGOUT
//         </button>
//       </div>
//     </nav>
//   );
// };

// // ─── Objective Selector Component ─────────────────────────────────────────────
// const ObjectiveSelector = ({ fitnessObjective, setFitnessObjective }) => (
//   <div className="mb-6">
//     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
//       <Target size={12} className="text-green-500" /> Fitness Objective
//     </label>
//     <div className="grid grid-cols-3 gap-3">
//       {FITNESS_OBJECTIVES.map(({ id, label, tagline, icon: Icon, activeClass, softClass }) => (
//         <button
//           key={id}
//           onClick={() => setFitnessObjective(id)}
//           className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl font-bold border-2 transition-all shadow-md ${
//             fitnessObjective === id ? activeClass : `${softClass} border-transparent hover:shadow-lg`
//           }`}
//         >
//           <Icon size={20} />
//           <span className="text-xs font-black uppercase tracking-wide">{label}</span>
//           <span className={`text-[9px] font-medium ${fitnessObjective === id ? 'opacity-80' : 'opacity-60'}`}>
//             {tagline}
//           </span>
//         </button>
//       ))}
//     </div>
//   </div>
// );

// // ─── Exercise Protocol Display ────────────────────────────────────────────────
// const ExerciseProtocolCard = ({ workoutPlan, objectiveId }) => {
//   const obj = FITNESS_OBJECTIVES.find(o => o.id === objectiveId) || FITNESS_OBJECTIVES[2];
//   const { colorClass } = obj;

//   if (!workoutPlan) return null;

//   return (
//     <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl mt-8">
//       <div className="flex items-center gap-3 mb-2">
//         <div className={`w-8 h-8 ${colorClass} rounded-xl flex items-center justify-center`}>
//           <Swords size={16} className="text-white" />
//         </div>
//         <h3 className="text-2xl font-black text-white uppercase tracking-tight">Exercise Protocol</h3>
//       </div>
//       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
//         {workoutPlan.focus}
//       </p>
//       <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
//         {(workoutPlan.weeklyRoutine || []).map((day, i) => (
//           <div
//             key={i}
//             className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all"
//           >
//             <p className={`text-[9px] font-black uppercase tracking-widest mb-2 text-${obj.color}-400`}>
//               {day.day}
//             </p>
//             <p className="text-[11px] text-slate-300 leading-snug font-medium">{day.activity}</p>
//             {day.sets && (
//               <p className="text-[9px] text-slate-500 mt-2 font-bold">
//                 {day.sets}
//               </p>
//             )}
//           </div>
//         ))}
//       </div>
//       {workoutPlan.notes && (
//         <div className="mt-6 bg-white/5 rounded-2xl p-5 border border-white/10">
//           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Notes</p>
//           <p className="text-sm text-slate-300 leading-relaxed">{workoutPlan.notes}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// // ─── DietPlan Display ─────────────────────────────────────────────────────────
// const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
// const MEALS = ['Breakfast','Morning Snack','Lunch','Afternoon Snack','Dinner','Supper'];

// const DietPlanGrid = ({ dietPlan, dietPreference, fitnessObjective }) => {
//   const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
//   return (
//     <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm overflow-x-auto mt-8">
//       <div className="flex items-center gap-3 mb-2">
//         <div className={`w-8 h-8 ${obj.colorClass} rounded-xl flex items-center justify-center`}>
//           <Calendar size={16} className="text-white" />
//         </div>
//         <h3 className="text-2xl font-black text-slate-900">Weekly Meal Plan</h3>
//       </div>
//       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
//         {dietPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} · {obj.label} Protocol
//       </p>
//       <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
//         {DAYS.map(day => {
//           const dayData = dietPlan[day] || {};
//           return (
//             <div key={day} className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
//               <p className={`text-xs font-black text-${obj.color}-600 uppercase mb-4 border-b border-${obj.color}-100 pb-1`}>{day}</p>
//               {MEALS.map(meal => {
//                 const value =
//                   dayData[meal] ||
//                   dayData[meal.toLowerCase()] ||
//                   dayData[meal.replace(' ', '_')] ||
//                   dayData[meal.toLowerCase().replace(' ', '_')] ||
//                   dayData[meal.replace(' ', '')] || '';
//                 if (!value) return null;
//                 const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
//                 return (
//                   <div key={meal} className="mb-3">
//                     <p className="text-[9px] font-black text-slate-400 uppercase">{meal}</p>
//                     <p className="text-[11px] text-slate-700 leading-tight">{text}</p>
//                   </div>
//                 );
//               })}
//               {Object.entries(dayData)
//                 .filter(([k]) =>
//                   !MEALS.some(m =>
//                     k === m || k === m.toLowerCase() ||
//                     k === m.replace(' ', '_') || k === m.toLowerCase().replace(' ', '_') ||
//                     k === m.replace(' ', '')
//                   )
//                 )
//                 .map(([k, v]) => (
//                   <div key={k} className="mb-3">
//                     <p className="text-[9px] font-black text-slate-400 uppercase">{k}</p>
//                     <p className="text-[11px] text-slate-700 leading-tight">
//                       {typeof v === 'object' ? JSON.stringify(v) : String(v)}
//                     </p>
//                   </div>
//                 ))}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// // ─── Protocol Summary Banner ──────────────────────────────────────────────────
// const ProtocolSummaryBanner = ({ bmiResult, fitnessObjective, targetKcal, targetProtein }) => {
//   const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
//   const Icon = obj.icon;
//   return (
//     <div className={`rounded-3xl p-6 border-2 mb-6 flex flex-wrap gap-6 items-center ${obj.softClass}`}>
//       <div className="flex items-center gap-3">
//         <div className={`w-10 h-10 ${obj.colorClass} rounded-xl flex items-center justify-center shadow-md`}>
//           <Icon size={20} className="text-white" />
//         </div>
//         <div>
//           <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Objective</p>
//           <p className="font-black text-lg">{obj.label}</p>
//         </div>
//       </div>
//       <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
//       <div>
//         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Calories</p>
//         <p className="font-black text-lg">{targetKcal} kcal/day</p>
//       </div>
//       <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
//       <div>
//         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Protein</p>
//         <p className="font-black text-lg">{targetProtein}g/day</p>
//       </div>
//       <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
//       <div>
//         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Exercise Focus</p>
//         <p className="font-black text-sm">{obj.exerciseFocus}</p>
//       </div>
//     </div>
//   );
// };

// // ─── DashboardTab ─────────────────────────────────────────────────────────────
// const DashboardTab = ({ workouts, userIsAnonymous }) => {
//   const weeklyIntensity = workouts.reduce(
//     (acc, curr) => acc + (Number(curr.weight) || 0) * (Number(curr.reps) || 0), 0
//   );
//   const calculate1RM = () => {
//     if (!workouts.length) return '--';
//     const { weight: w, reps: r } = workouts[0];
//     const wn = Number(w) || 0;
//     const rn = Number(r) || 0;
//     if (rn === 0) return wn;
//     return Math.round(wn * (1 + rn / 30));
//   };
//   const formatDate = ts => {
//     if (!ts?.seconds) return 'N/A';
//     return new Date(ts.seconds * 1000).toLocaleDateString();
//   };
//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       <div className="bg-white rounded-[40px] p-10 border border-slate-100 mb-8 shadow-sm flex items-center justify-between">
//         <div className="flex items-center gap-6">
//           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
//             <User size={48} className="text-green-500" />
//           </div>
//           <div>
//             <h2 className="text-4xl font-extrabold text-slate-900 mb-1">
//               Welcome, {userIsAnonymous ? 'Guest' : 'Athlete'}! 👋
//             </h2>
//             <p className="text-slate-500 font-medium">Your next level starts today.</p>
//           </div>
//         </div>
//         <div className="hidden lg:block bg-slate-50 p-6 rounded-3xl border border-slate-100">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Predicted 1RM</p>
//           <p className="text-2xl font-black text-slate-900">{calculate1RM()} kg</p>
//         </div>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         {[
//           { label: 'Total Volume',   value: `${weeklyIntensity} kg` },
//           { label: 'Total Lifts',    value: workouts.length },
//           { label: 'Status',         value: userIsAnonymous ? 'Guest' : 'Member', green: true },
//           { label: 'Last Activity',  value: formatDate(workouts[0]?.timestamp) },
//         ].map(({ label, value, green }) => (
//           <div key={label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
//             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
//             <p className={`text-2xl font-black ${green ? 'text-green-500' : 'text-slate-900'}`}>{value}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// // ─── HealthTab ────────────────────────────────────────────────────────────────
// const HealthTab = ({
//   bmiHeight, setBmiHeight, bmiWeight, setBmiWeight,
//   age, setAge, pal, setPal,
//   conditions, setConditions,
//   dietPreference, setDietPreference,
//   fitnessObjective, setFitnessObjective,
//   calculateBMI, bmiResult,
//   generateProtocol, isGeneratingDiet,
//   dietPlan, workoutPlan,
//   dietError,
//   targetKcal, targetProtein,
// }) => (
//   <div className="max-w-6xl mx-auto px-4 py-12">
//     <div className="text-center mb-12">
//       <h2 className="text-4xl font-extrabold text-slate-900 mb-4 uppercase italic">Protocol Synthesis</h2>
//       <p className="text-slate-500">Biometric mapping → coordinated diet & exercise protocol.</p>
//     </div>

//     <div className="grid md:grid-cols-2 gap-8 mb-4">
//       {/* Left Card */}
//       <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
//         <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
//           <User size={20} className="text-green-500" /> Profile Input
//         </h3>

//         {/* Fitness Objective */}
//         <ObjectiveSelector fitnessObjective={fitnessObjective} setFitnessObjective={setFitnessObjective} />

//         {/* Diet preference */}
//         <div className="mb-6">
//           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
//             Dietary Preference
//           </label>
//           <div className="grid grid-cols-2 gap-4">
//             {[
//               { val: 'veg',     label: 'Vegetarian',     Icon: Leaf, active: 'bg-green-500 border-green-500' },
//               { val: 'non-veg', label: 'Non-Vegetarian', Icon: Beef, active: 'bg-red-500 border-red-500'   },
//             ].map(({ val, label, Icon, active }) => (
//               <button
//                 key={val}
//                 onClick={() => setDietPreference(val)}
//                 className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition-all ${
//                   dietPreference === val ? `${active} text-white shadow-lg` : 'bg-slate-50 text-slate-400 border-slate-100'
//                 }`}
//               >
//                 <Icon size={18} /> {label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Numeric inputs */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           {[
//             { label: 'Height (cm)', val: bmiHeight, set: setBmiHeight },
//             { label: 'Weight (kg)', val: bmiWeight, set: setBmiWeight },
//             { label: 'Age',         val: age,       set: setAge       },
//           ].map(({ label, val, set }) => (
//             <div key={label}>
//               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</label>
//               <input
//                 type="number"
//                 value={val}
//                 onChange={e => set(e.target.value)}
//                 className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 outline-none focus:ring-2 focus:ring-green-500"
//               />
//             </div>
//           ))}
//           <div>
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Activity (PAL)</label>
//             <select
//               value={pal}
//               onChange={e => setPal(e.target.value)}
//               className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 outline-none focus:ring-2 focus:ring-green-500"
//             >
//               <option value="1.2">Sedentary (1.2)</option>
//               <option value="1.375">Light (1.375)</option>
//               <option value="1.55">Moderate (1.55)</option>
//               <option value="1.725">Very Active (1.725)</option>
//             </select>
//           </div>
//         </div>

//         {/* Clinical conditions */}
//         <div className="mb-6">
//           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Clinical Conditions</label>
//           <div className="flex flex-wrap gap-2">
//             {['CVD', 'T2D', 'Iron Deficiency', 'Hyperthyroid'].map(c => (
//               <button
//                 key={c}
//                 onClick={() =>
//                   setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
//                 }
//                 className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
//                   conditions.includes(c) ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'
//                 }`}
//               >
//                 {c}
//               </button>
//             ))}
//           </div>
//         </div>

//         <button
//           onClick={calculateBMI}
//           className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-green-600 transition-all"
//         >
//           Calculate Metrics
//         </button>
//       </div>

//       {/* Right Card */}
//       <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl flex flex-col justify-center">
//         {bmiResult ? (
//           <div className="text-center">
//             {/* Objective Badge */}
//             {(() => {
//               const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective);
//               const ObjIcon = obj?.icon;
//               return (
//                 <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 ${obj?.colorClass} text-white`}>
//                   {ObjIcon && <ObjIcon size={14} />} {obj?.label}
//                 </div>
//               );
//             })()}

//             <div className="flex justify-center gap-6 mb-6 flex-wrap">
//               <div>
//                 <p className="text-5xl font-black text-green-400">{bmiResult.bmi}</p>
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">BMI Index</p>
//               </div>
//               <div>
//                 <p className="text-5xl font-black text-blue-400">{targetKcal || bmiResult.tdee}</p>
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Target kcal</p>
//               </div>
//               <div>
//                 <p className="text-5xl font-black text-purple-400">{targetProtein || '--'}g</p>
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Protein / day</p>
//               </div>
//             </div>

//             <p className="text-xl font-bold mb-1 text-slate-300">
//               Status: <span className="text-white">{bmiResult.category}</span>
//             </p>
//             <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">
//               {dietPreference.toUpperCase()} · {FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective)?.label.toUpperCase()}
//             </p>

//             {dietError && (
//               <p className="text-red-400 text-xs font-bold mb-4 bg-red-900/30 p-3 rounded-xl">
//                 ⚠ {dietError}
//               </p>
//             )}

//             <button
//               onClick={generateProtocol}
//               disabled={isGeneratingDiet}
//               className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {isGeneratingDiet ? (
//                 <span className="flex items-center gap-2">
//                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//                   </svg>
//                   Synthesizing Protocol...
//                 </span>
//               ) : (
//                 <><Sparkles size={20} /> Generate Full Protocol</>
//               )}
//             </button>
//           </div>
//         ) : (
//           <div className="text-center opacity-50">
//             <BrainCircuit size={64} className="mx-auto mb-4 text-green-500" />
//             <p className="uppercase font-bold tracking-widest text-xs">Awaiting Biometric Encoding</p>
//             <p className="text-slate-600 text-xs mt-2">Fill profile → Calculate → Generate</p>
//           </div>
//         )}
//       </div>
//     </div>

//     {/* Protocol outputs */}
//     {bmiResult && dietPlan && (
//       <ProtocolSummaryBanner
//         bmiResult={bmiResult}
//         fitnessObjective={fitnessObjective}
//         targetKcal={targetKcal}
//         targetProtein={targetProtein}
//       />
//     )}
//     {dietPlan && (
//       <DietPlanGrid dietPlan={dietPlan} dietPreference={dietPreference} fitnessObjective={fitnessObjective} />
//     )}
//     {workoutPlan && (
//       <ExerciseProtocolCard workoutPlan={workoutPlan} objectiveId={fitnessObjective} />
//     )}
//   </div>
// );

// // ─── ScannerTab ───────────────────────────────────────────────────────────────
// const ScannerTab = ({ analyzeMealImage, isMealAnalyzing, mealAnalysis, previewUrl }) => {
//   return (
//     <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
//       {/* Header */}
//       <div className="flex items-center gap-3 mb-2">
//         <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
//           <Camera size={20} className="text-white" />
//         </div>
//         <div>
//           <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Food Vision</h2>
//           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Nutritional Scanner</p>
//         </div>
//       </div>
//       <p className="text-slate-400 text-sm mb-8 ml-1">Scan any meal — get instant macros with Indian food precision.</p>

//       {/* Upload Zone */}
//       <label className="block w-full cursor-pointer bg-slate-50 rounded-[30px] border-4 border-dashed border-slate-200 hover:border-green-500 transition-all group mb-8 overflow-hidden">
//         <input type="file" accept="image/*" onChange={analyzeMealImage} className="hidden" />
//         {previewUrl ? (
//           <div className="relative">
//             <img src={previewUrl} alt="Food preview" className="w-full max-h-72 object-cover rounded-[26px]" />
//             <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[26px] opacity-0 group-hover:opacity-100 transition-all">
//               <p className="text-white font-black uppercase text-xs tracking-widest">Tap to Change Image</p>
//             </div>
//           </div>
//         ) : (
//           <div className="p-16 flex flex-col items-center">
//             <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-all">
//               <Camera size={32} className="text-green-400 group-hover:text-green-600 transition-colors" />
//             </div>
//             <p className="font-black text-slate-500 group-hover:text-green-600 uppercase text-xs tracking-widest mb-2">
//               {isMealAnalyzing ? '🔍 Scanning food...' : 'Upload Food Photo'}
//             </p>
//             <p className="text-[10px] text-slate-300 font-medium">Works best with roti, rice, dal, curry, salad, protein bowls & more</p>
//           </div>
//         )}
//       </label>

//       {/* Analyzing State */}
//       {isMealAnalyzing && (
//         <div className="flex items-center justify-center gap-3 py-6 bg-green-50 rounded-2xl border border-green-100 mb-6">
//           <svg className="animate-spin h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//           </svg>
//           <span className="text-green-700 font-black text-sm uppercase tracking-widest">Identifying dish & calculating macros...</span>
//         </div>
//       )}

//       {/* Results — Rich Table View */}
//       {mealAnalysis && !isMealAnalyzing && (
//         <div className="space-y-6">
//           {/* Banner */}
//           <div className="bg-slate-900 rounded-[30px] p-6 flex items-center gap-4">
//             <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
//               <Sparkles size={24} className="text-white" />
//             </div>
//             <div>
//               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Food Vision Identified</p>
//               <p className="text-xl font-black text-white capitalize">{mealAnalysis.dish || 'Unknown Dish'}</p>
//               {mealAnalysis.serving && (
//                 <p className="text-xs text-green-400 font-bold mt-0.5">{mealAnalysis.serving}</p>
//               )}
//             </div>
//           </div>

//           {/* Macro Cards */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {[
//               { label: 'Calories', value: `${mealAnalysis.calories || 0}`, unit: 'kcal', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', sub: 'text-orange-400' },
//               { label: 'Protein',  value: `${mealAnalysis.protein || 0}`,  unit: 'g',    color: 'blue',   bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   sub: 'text-blue-400' },
//               { label: 'Carbs',    value: `${mealAnalysis.carbs || 0}`,    unit: 'g',    color: 'purple', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', sub: 'text-purple-400' },
//               { label: 'Fat',      value: `${mealAnalysis.fat || 0}`,      unit: 'g',    color: 'green',  bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600',  sub: 'text-green-400' },
//             ].map(({ label, value, unit, bg, border, text, sub }) => (
//               <div key={label} className={`${bg} ${border} border rounded-[20px] p-5 text-center`}>
//                 <p className={`text-3xl font-black ${text}`}>{value}</p>
//                 <p className={`text-[9px] font-black uppercase tracking-widest ${sub} mt-0.5`}>{unit}</p>
//                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
//               </div>
//             ))}
//           </div>

//           {/* Detailed Nutrition Table */}
//           <div className="bg-white border border-slate-100 rounded-[25px] overflow-hidden shadow-sm">
//             <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
//               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutritional Breakdown</p>
//             </div>
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-slate-50">
//                   <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Item</th>
//                   <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Serving</th>
//                   <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-400">Calories</th>
//                   <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-400">Protein</th>
//                   <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-purple-400">Carbs</th>
//                   <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-green-400">Fat</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(mealAnalysis.items || [{ name: mealAnalysis.dish, serving: mealAnalysis.serving || '1 serving', calories: mealAnalysis.calories, protein: mealAnalysis.protein, carbs: mealAnalysis.carbs, fat: mealAnalysis.fat }]).map((item, i) => (
//                   <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
//                     <td className="px-6 py-4 font-bold text-slate-800 capitalize">{item.name || item.dish || mealAnalysis.dish}</td>
//                     <td className="px-4 py-4 text-center text-slate-500 font-medium text-xs">{item.serving || '1 serving'}</td>
//                     <td className="px-4 py-4 text-center font-black text-orange-600">{item.calories || 0} <span className="text-[9px] font-bold text-slate-400">kcal</span></td>
//                     <td className="px-4 py-4 text-center font-black text-blue-600">{item.protein || 0}<span className="text-[9px] font-bold text-slate-400">g</span></td>
//                     <td className="px-4 py-4 text-center font-black text-purple-600">{item.carbs || 0}<span className="text-[9px] font-bold text-slate-400">g</span></td>
//                     <td className="px-4 py-4 text-center font-black text-green-600">{item.fat || 0}<span className="text-[9px] font-bold text-slate-400">g</span></td>
//                   </tr>
//                 ))}
//                 {/* Total row */}
//                 <tr className="border-t-2 border-slate-200 bg-slate-900">
//                   <td className="px-6 py-4 font-black text-white uppercase text-xs tracking-widest" colSpan={2}>Total Estimate</td>
//                   <td className="px-4 py-4 text-center font-black text-orange-400">{mealAnalysis.calories || 0} <span className="text-[9px] font-bold text-orange-600">kcal</span></td>
//                   <td className="px-4 py-4 text-center font-black text-blue-400">{mealAnalysis.protein || 0}<span className="text-[9px] font-bold text-blue-600">g</span></td>
//                   <td className="px-4 py-4 text-center font-black text-purple-400">{mealAnalysis.carbs || 0}<span className="text-[9px] font-bold text-purple-600">g</span></td>
//                   <td className="px-4 py-4 text-center font-black text-green-400">{mealAnalysis.fat || 0}<span className="text-[9px] font-bold text-green-600">g</span></td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           {/* Health Tips */}
//           {mealAnalysis.tips && (
//             <div className="bg-green-50 border border-green-100 rounded-[20px] p-5">
//               <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">💡 Dietitian Note</p>
//               <p className="text-sm text-green-800 font-medium leading-relaxed">{mealAnalysis.tips}</p>
//             </div>
//           )}

//           {/* Scan again button */}
//           <label className="block w-full cursor-pointer">
//             <input type="file" accept="image/*" onChange={analyzeMealImage} className="hidden" />
//             <div className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-center text-sm transition-all cursor-pointer">
//               📷 Scan Another Meal
//             </div>
//           </label>
//         </div>
//       )}
//     </div>
//   );
// };

// // ─── RehabTab ─────────────────────────────────────────────────────────────────
// const RehabTab = ({ analyzeFormVision, isFormAnalyzing, formFeedback, rehabPreviewUrl, rehabFileType }) => {
//   return (
//     <div className="max-w-4xl mx-auto px-4">
//       <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
//         {/* Header */}
//         <div className="flex items-center gap-3 mb-2">
//           <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
//             <Stethoscope size={20} className="text-white" />
//           </div>
//           <div>
//             <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">AI Form Expert</h2>
//             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Biomechanical Analysis · Rehab Coach</p>
//           </div>
//         </div>
//         <p className="text-slate-400 text-sm mb-8 ml-1">Upload a photo or video of your exercise — get expert form analysis + YouTube suggestions.</p>

//         {/* Upload Zone — accepts image AND video */}
//         <label className="block w-full cursor-pointer bg-slate-50 rounded-[30px] border-4 border-dashed border-slate-200 hover:border-blue-500 transition-all group mb-8 overflow-hidden">
//           <input type="file" accept="image/*,video/*" onChange={analyzeFormVision} className="hidden" />
//           {rehabPreviewUrl ? (
//             <div className="relative">
//               {rehabFileType === 'video' ? (
//                 <video src={rehabPreviewUrl} className="w-full max-h-64 object-cover rounded-[26px]" muted playsInline />
//               ) : (
//                 <img src={rehabPreviewUrl} alt="Exercise preview" className="w-full max-h-64 object-cover rounded-[26px]" />
//               )}
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[26px] opacity-0 group-hover:opacity-100 transition-all">
//                 <p className="text-white font-black uppercase text-xs tracking-widest">Tap to Change</p>
//               </div>
//               {rehabFileType === 'video' && (
//                 <div className="absolute top-3 left-3 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
//                   📹 Video — Frame Extracted
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="p-16 flex flex-col items-center">
//               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-all">
//                 <Activity size={32} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
//               </div>
//               <p className="font-black text-slate-500 group-hover:text-blue-600 uppercase text-xs tracking-widest mb-2">
//                 {isFormAnalyzing ? '🔬 Analyzing form...' : 'Upload Image or Video'}
//               </p>
//               <p className="text-[10px] text-slate-300 font-medium">Push-ups · Squats · Deadlifts · Planks · Any exercise</p>
//               <div className="flex gap-2 mt-3">
//                 <span className="bg-blue-100 text-blue-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">📷 Photo</span>
//                 <span className="bg-purple-100 text-purple-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">🎬 Video</span>
//               </div>
//             </div>
//           )}
//         </label>

//         {/* Analyzing State */}
//         {isFormAnalyzing && (
//           <div className="flex items-center justify-center gap-3 py-6 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
//             <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//             </svg>
//             <span className="text-blue-700 font-black text-sm uppercase tracking-widest">Analyzing biomechanics...</span>
//           </div>
//         )}

//         {/* Structured Form Feedback */}
//         {formFeedback && !isFormAnalyzing && (
//           <div className="space-y-5">
//             {/* Exercise ID Banner */}
//             {formFeedback.exercise && (
//               <div className="bg-slate-900 rounded-[25px] p-6 flex items-center gap-4">
//                 <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
//                   <Dumbbell size={24} className="text-white" />
//                 </div>
//                 <div>
//                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exercise Identified</p>
//                   <p className="text-xl font-black text-white capitalize">{formFeedback.exercise}</p>
//                   {formFeedback.muscles && (
//                     <p className="text-xs text-blue-400 font-bold mt-0.5">{formFeedback.muscles}</p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* What is Happening */}
//             {formFeedback.summary && (
//               <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100">
//                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
//                   <BrainCircuit size={10} /> What&apos;s Happening
//                 </p>
//                 <p className="text-sm text-slate-700 font-medium leading-relaxed">{formFeedback.summary}</p>
//               </div>
//             )}

//             {/* Good & Watch-Outs */}
//             <div className="grid md:grid-cols-2 gap-4">
//               {formFeedback.good && formFeedback.good.length > 0 && (
//                 <div className="bg-green-50 rounded-[20px] p-5 border border-green-100">
//                   <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-3 flex items-center gap-1">
//                     <CheckCircle2 size={10} /> The Good
//                   </p>
//                   <ul className="space-y-2">
//                     {formFeedback.good.map((g, i) => (
//                       <li key={i} className="text-xs text-green-700 font-medium flex items-start gap-2">
//                         <span className="text-green-400 mt-0.5">✓</span> {g}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//               {formFeedback.watchouts && formFeedback.watchouts.length > 0 && (
//                 <div className="bg-red-50 rounded-[20px] p-5 border border-red-100">
//                   <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-1">
//                     <AlertCircle size={10} /> Watch-Outs
//                   </p>
//                   <ul className="space-y-2">
//                     {formFeedback.watchouts.map((w, i) => (
//                       <li key={i} className="text-xs text-red-700 font-medium flex items-start gap-2">
//                         <span className="text-red-400 mt-0.5">⚠</span> {w}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>

//             {/* Quick Fixes */}
//             {formFeedback.fixes && formFeedback.fixes.length > 0 && (
//               <div className="bg-yellow-50 rounded-[20px] p-5 border border-yellow-100">
//                 <p className="text-[9px] font-black uppercase tracking-widest text-yellow-600 mb-3 flex items-center gap-1">
//                   <Zap size={10} /> Quick Fixes
//                 </p>
//                 <ol className="space-y-2">
//                   {formFeedback.fixes.map((f, i) => (
//                     <li key={i} className="text-xs text-yellow-800 font-medium flex items-start gap-2">
//                       <span className="text-yellow-500 font-black">{i+1}.</span> {f}
//                     </li>
//                   ))}
//                 </ol>
//               </div>
//             )}

//             {/* Injury Risks */}
//             {formFeedback.injuryRisks && formFeedback.injuryRisks.length > 0 && (
//               <div className="bg-orange-50 rounded-[20px] p-5 border border-orange-100">
//                 <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-3 flex items-center gap-1">
//                   <Shield size={10} /> Injury Risk Flags
//                 </p>
//                 <ul className="space-y-2">
//                   {formFeedback.injuryRisks.map((r, i) => (
//                     <li key={i} className="text-xs text-orange-700 font-medium flex items-start gap-2">
//                       <span className="text-orange-400 mt-0.5">🔴</span> {r}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* YouTube Video Suggestions */}
//             {formFeedback.ytSuggestions && formFeedback.ytSuggestions.length > 0 && (
//               <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm">
//                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1">
//                   <Activity size={10} className="text-red-500" /> Recommended Tutorial Videos
//                 </p>
//                 <div className="space-y-3">
//                   {formFeedback.ytSuggestions.map((v, i) => (
//                     <a
//                       key={i}
//                       href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-200 rounded-2xl transition-all group"
//                     >
//                       <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-all">
//                         <span className="text-white text-sm font-black">▶</span>
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-black text-slate-800 group-hover:text-red-600 transition-colors capitalize">{v.title}</p>
//                         <p className="text-[10px] text-slate-400 font-medium truncate">{v.reason}</p>
//                       </div>
//                       <ChevronRight size={14} className="text-slate-300 group-hover:text-red-400 flex-shrink-0 transition-colors" />
//                     </a>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Plain text fallback */}
//             {typeof formFeedback === 'string' && (
//               <div className="bg-blue-50 p-8 rounded-[25px] text-sm text-blue-800 border border-blue-100 leading-relaxed">
//                 <div className="whitespace-pre-wrap">{formFeedback}</div>
//               </div>
//             )}

//             {/* Scan again */}
//             <label className="block w-full cursor-pointer">
//               <input type="file" accept="image/*,video/*" onChange={analyzeFormVision} className="hidden" />
//               <div className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-center text-sm transition-all cursor-pointer">
//                 🎬 Analyze Another Exercise
//               </div>
//             </label>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ─── WorkoutTab ───────────────────────────────────────────────────────────────
// const WorkoutTab = ({
//   handleWorkoutSubmit, exerciseName, setExerciseName,
//   bodyPart, setBodyPart, weight, setWeight, reps, setReps, sets, setSets, workouts,
// }) => (
//   <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm">
//     <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-3 italic uppercase">
//       <Dumbbell className="text-green-500" /> Record Session
//     </h2>
//     <form onSubmit={handleWorkoutSubmit} className="space-y-6">
//       <div className="grid md:grid-cols-2 gap-6">
//         <select
//           value={bodyPart}
//           onChange={e => setBodyPart(e.target.value)}
//           className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none font-bold focus:ring-2 focus:ring-green-500"
//         >
//           <option value="">Muscle Target</option>
//           {['Chest','Back','Legs','Shoulders','Arms','Core'].map(p => (
//             <option key={p} value={p}>{p}</option>
//           ))}
//         </select>
//         <input
//           required
//           value={exerciseName}
//           onChange={e => setExerciseName(e.target.value)}
//           placeholder="Exercise Name"
//           className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 outline-none font-bold focus:ring-2 focus:ring-green-500"
//         />
//       </div>
//       <div className="grid grid-cols-3 gap-6">
//         {[
//           { label: 'Kg',   val: weight, set: setWeight },
//           { label: 'Reps', val: reps,   set: setReps   },
//           { label: 'Sets', val: sets,   set: setSets   },
//         ].map(({ label, val, set }) => (
//           <div key={label}>
//             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">{label}</label>
//             <input
//               type="number"
//               value={val}
//               onChange={e => set(e.target.value)}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center font-black text-xl outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//         ))}
//       </div>
//       <button
//         type="submit"
//         className="w-full py-6 bg-green-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all"
//       >
//         Synchronize Session
//       </button>
//     </form>
//     <div className="mt-16 space-y-4">
//       <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.5em] mb-6">Recent Lift Data</h3>
//       {workouts.slice(0, 4).map(w => (
//         <div
//           key={w.id}
//           className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-green-300 transition-all"
//         >
//           <div>
//             <p className="font-black text-slate-900 uppercase text-sm tracking-tighter">{w.exercise || 'Unnamed Exercise'}</p>
//             <p className="text-[10px] text-slate-400 font-bold uppercase">{w.bodyPart || 'Unspecified'}</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <span className="bg-white px-4 py-2 rounded-xl text-xs font-black text-slate-900 border border-slate-100">
//               {w.weight || 0} KG
//             </span>
//             <span className="bg-green-500 px-4 py-2 rounded-xl text-xs font-black text-white">
//               {w.reps || 0} R
//             </span>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// // ─── Main App ─────────────────────────────────────────────────────────────────
// const App = () => {
//   const [activeTab, setActiveTab] = useState('home');
//   const [loading, setLoading]     = useState(true);
//   const [user, setUser]           = useState(null);
//   const [db, setDb]               = useState(null);
//   const [auth, setAuth]           = useState(null);
//   const [workouts, setWorkouts]   = useState([]);
//   const [initError, setInitError] = useState('');

//   // Auth
//   const [authView, setAuthView]   = useState('login');
//   const [email, setEmail]         = useState('');
//   const [password, setPassword]   = useState('');
//   const [authError, setAuthError] = useState('');

//   // Dietetics
//   const [bmiHeight, setBmiHeight]               = useState('180');
//   const [bmiWeight, setBmiWeight]               = useState('78');
//   const [age, setAge]                           = useState('22');
//   const [pal, setPal]                           = useState('1.55');
//   const [conditions, setConditions]             = useState([]);
//   const [dietPreference, setDietPreference]     = useState('veg');
//   const [fitnessObjective, setFitnessObjective] = useState('maintain');
//   const [bmiResult, setBmiResult]               = useState(null);
//   const [weeklyDietPlan, setWeeklyDietPlan]     = useState(null);
//   const [weeklyWorkoutPlan, setWeeklyWorkoutPlan] = useState(null);
//   const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
//   const [dietError, setDietError]               = useState('');
//   const [targetKcal, setTargetKcal]             = useState(null);
//   const [targetProtein, setTargetProtein]       = useState(null);

//   // Workout form
//   const [exerciseName, setExerciseName] = useState('');
//   const [bodyPart, setBodyPart]         = useState('');
//   const [weight, setWeight]             = useState('');
//   const [reps, setReps]                 = useState('');
//   const [sets, setSets]                 = useState('');

//   // Rehab
//   const [formFeedback, setFormFeedback]       = useState('');
//   const [isFormAnalyzing, setIsFormAnalyzing] = useState(false);

//   // Scanner
//   const [isMealAnalyzing, setIsMealAnalyzing] = useState(false);
//   const [mealAnalysis, setMealAnalysis]       = useState(null);
//   const [mealPreviewUrl, setMealPreviewUrl]   = useState(null);

//   // Rehab extra state
//   const [rehabPreviewUrl, setRehabPreviewUrl] = useState(null);
//   const [rehabFileType, setRehabFileType]     = useState('image');

//   // ── Firebase init ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     let unsubscribeAuth = () => {};
//     const initApp = async () => {
//       try {
//         const isFirstInit = getApps().length === 0;
//         const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];
//         const firebaseAuth = getAuth(app);
//         const firestore = isFirstInit
//           ? initializeFirestore(app, {
//               localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
//             })
//           : getFirestore(app);
//         setDb(firestore);
//         setAuth(firebaseAuth);
//         if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
//           await signInWithCustomToken(firebaseAuth, __initial_auth_token);
//         }
//         unsubscribeAuth = onAuthStateChanged(firebaseAuth, u => {
//           setUser(u);
//           setLoading(false);
//         });
//       } catch (err) {
//         console.error('Firebase Init Error:', err);
//         setInitError(err.message);
//         setLoading(false);
//       }
//     };
//     initApp();
//     return () => unsubscribeAuth();
//   }, []);

//   // ── Firestore listener ─────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!db || !user) return;
//     const q = collection(db, 'artifacts', appId, 'users', user.uid, 'workouts');
//     const unsubscribe = onSnapshot(
//       q,
//       snapshot => {
//         const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
//         setWorkouts(list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
//       },
//       err => console.warn('Firestore snapshot error:', err.code, err.message)
//     );
//     return () => unsubscribe();
//   }, [db, user]);

//   // ── Auth handlers ──────────────────────────────────────────────────────────
//   const handleAuth = async e => {
//     e.preventDefault();
//     setAuthError('');
//     if (!auth) return;
//     try {
//       if (authView === 'login') {
//         await signInWithEmailAndPassword(auth, email, password);
//       } else {
//         await createUserWithEmailAndPassword(auth, email, password);
//       }
//     } catch (err) {
//       if (err.code === 'auth/operation-not-allowed') setAuthError("Enable 'Email/Password' auth in Firebase Console.");
//       else if (err.code === 'auth/network-request-failed') setAuthError('Network error. Check your internet connection.');
//       else setAuthError(err.message);
//     }
//   };

//   const handleGuestLogin = async () => {
//     if (!auth) return;
//     setAuthError('');
//     try {
//       await signInAnonymously(auth);
//     } catch (err) {
//       if (err.code === 'auth/operation-not-allowed') setAuthError("Enable 'Anonymous' sign-in in Firebase Console.");
//       else if (err.code === 'auth/network-request-failed') setAuthError('Network error. Check your internet connection.');
//       else setAuthError('Guest login failed.');
//     }
//   };

//   // ── BMI / TDEE ─────────────────────────────────────────────────────────────
//   const calculateBMI = useCallback(() => {
//     const h = Number(bmiHeight) / 100;
//     const w = Number(bmiWeight);
//     const a = Number(age);
//     if (!h || !w || !a) return;

//     const bmiVal    = (w / (h * h)).toFixed(1);
//     const bmrVal    = Math.round(10 * w + 6.25 * Number(bmiHeight) - 5 * a + 5);
//     const tdeeVal   = Math.round(bmrVal * Number(pal));
//     const category  = bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese';

//     setBmiResult({ bmi: bmiVal, category, bmr: bmrVal, tdee: tdeeVal });

//     // Compute objective-adjusted targets
//     const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
//     const adjKcal    = Math.max(1200, tdeeVal + obj.kcalModifier);
//     const adjProtein = Math.round(w * obj.proteinMultiplier);
//     setTargetKcal(adjKcal);
//     setTargetProtein(adjProtein);
//   }, [bmiHeight, bmiWeight, age, pal, fitnessObjective]);

//   // Recalculate targets when objective changes (if BMI already calculated)
//   useEffect(() => {
//     if (!bmiResult) return;
//     const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
//     const adjKcal    = Math.max(1200, bmiResult.tdee + obj.kcalModifier);
//     const adjProtein = Math.round(Number(bmiWeight) * obj.proteinMultiplier);
//     setTargetKcal(adjKcal);
//     setTargetProtein(adjProtein);
//   }, [fitnessObjective, bmiResult, bmiWeight]);

//   // ── Protocol generation (Diet + Exercise) ─────────────────────────────────
//   const generateProtocol = async () => {
//     if (!bmiResult) return;
//     setIsGeneratingDiet(true);
//     setWeeklyDietPlan(null);
//     setWeeklyWorkoutPlan(null);
//     setDietError('');

//     const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];

//     try {
//       const condStr = conditions.length ? conditions.join(', ') : 'None';
//       const prompt = `
// You are an elite Indian certified dietitian AND strength & conditioning coach.
// Generate a STRICTLY ${dietPreference === 'veg' ? 'VEGETARIAN' : 'NON-VEGETARIAN'} 7-day Indian meal plan AND a matching weekly exercise protocol, both SPECIFICALLY designed for the fitness objective: "${obj.label.toUpperCase()}".

// User Profile:
// - Fitness Objective: ${obj.label} (${obj.tagline})
// - BMI Status: ${bmiResult.category} (BMI: ${bmiResult.bmi})
// - Target Calories: ${targetKcal} kcal/day (TDEE ${bmiResult.tdee} ${obj.kcalModifier >= 0 ? '+' : ''}${obj.kcalModifier})
// - Target Protein: ${targetProtein}g/day
// - Clinical Conditions: ${condStr}
// - Exercise Focus: ${obj.exerciseFocus}

// DIET RULES based on objective:
// ${fitnessObjective === 'lose_weight' ? '- Caloric deficit meals, high fiber, low GI foods, lean proteins, avoid fried/sugary items' : ''}
// ${fitnessObjective === 'gain_muscle' ? '- Caloric surplus meals, high protein at every meal, complex carbs pre/post workout, healthy fats' : ''}
// ${fitnessObjective === 'maintain' ? '- Balanced macros, nutrient-dense whole foods, adequate protein, variety across days' : ''}

// EXERCISE RULES based on objective:
// ${fitnessObjective === 'lose_weight' ? '- Mix HIIT 3x/week with compound lifts 2x/week, active recovery days, progressive cardio' : ''}
// ${fitnessObjective === 'gain_muscle' ? '- Progressive overload 4-5x/week, split by muscle groups, 8-12 rep hypertrophy ranges, 1-2 rest days' : ''}
// ${fitnessObjective === 'maintain' ? '- 3 strength days, 2 cardio/mobility days, 2 rest/active days, balanced load' : ''}

// Return ONLY a valid JSON object with this exact structure:
// {
//   "dietPlan": {
//     "Monday":    { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
//     "Tuesday":   { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
//     "Wednesday": { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
//     "Thursday":  { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
//     "Friday":    { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
//     "Saturday":  { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
//     "Sunday":    { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." }
//   },
//   "workoutPlan": {
//     "focus": "One sentence describing the overall exercise strategy for ${obj.label}",
//     "notes": "2-3 sentences of key protocol notes (rest periods, progressive overload tips, recovery advice)",
//     "weeklyRoutine": [
//       { "day": "Day 1 – Monday",    "activity": "Specific workout name + exercises with sets/reps if applicable", "sets": "e.g. 4x8-12 each" },
//       { "day": "Day 2 – Tuesday",   "activity": "...", "sets": "..." },
//       { "day": "Day 3 – Wednesday", "activity": "...", "sets": "..." },
//       { "day": "Day 4 – Thursday",  "activity": "...", "sets": "..." },
//       { "day": "Day 5 – Friday",    "activity": "...", "sets": "..." },
//       { "day": "Day 6 – Saturday",  "activity": "...", "sets": "..." },
//       { "day": "Day 7 – Sunday",    "activity": "...", "sets": "..." }
//     ]
//   }
// }
// `.trim();

//       // callGemini with isJson=true now returns an already-parsed object via extractJson()
//       const parsed = await callGemini(prompt, '', null, true);

//       setWeeklyDietPlan(parsed.dietPlan || null);
//       setWeeklyWorkoutPlan(parsed.workoutPlan || null);
//     } catch (err) {
//       console.error('Synthesis error:', err);
//       setDietError(`Synthesis failed: ${err.message}. Please retry.`);
//     } finally {
//       setIsGeneratingDiet(false);
//     }
//   };

//   // ── Form vision ────────────────────────────────────────────────────────────
// const analyzeFormVision = async e => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setIsFormAnalyzing(true);
//     setFormFeedback('');
//     // Generate preview URL
//     const objectUrl = URL.createObjectURL(file);
//     setRehabPreviewUrl(objectUrl);
//     const isVideo = file.type.startsWith('video/');
//     setRehabFileType(isVideo ? 'video' : 'image');
//     try {
//       // For video: extract a representative frame; for images: resize normally
//       const imageData = isVideo
//         ? await extractVideoFrame(file, 2)
//         : await resizeImageToBase64(file, 1024);

// //       const prompt = `Analyze this exercise image/frame. Return ONLY a valid JSON object with this exact structure, no markdown:
// // {
// //   "exercise": "exact exercise name e.g. Push-up, Barbell Squat, Plank",
// //   "muscles": "Primary: chest, triceps — Secondary: core, shoulders",
// //   "summary": "One sentence describing what the person is doing and the goal of this movement.",
// //   "good": ["Point 1 about what looks correct", "Point 2"],
// //   "watchouts": ["Issue 1 observed e.g. head too high can strain neck", "Issue 2"],
// //   "fixes": ["Fix 1 e.g. Look slightly down not forward", "Fix 2", "Fix 3"],
// //   "injuryRisks": ["Risk 1 e.g. Lower back dropping increases lumbar strain", "Risk 2"],
// //   "ytSuggestions": [
// //     { "title": "Perfect Push-up Form Tutorial", "query": "perfect push-up form tutorial beginner", "reason": "Master the correct technique step by step" },
// //     { "title": "Push-up Progressions for Beginners", "query": "push-up progressions beginner intermediate", "reason": "Build strength safely to improve your form" },
// //     { "title": "Fix Your Push-up Common Mistakes", "query": "fix push-up common mistakes corrections", "reason": "Directly addresses the issues seen in your form" }
// //   ]
// // }

// // Adapt the ytSuggestions to the actual exercise identified. Be specific to THIS image only.`;
// // Replace the existing prompt inside analyzeFormVision
// const prompt = `
//   You are an AI Biomechanics Engine.

//   PHASE 1: HUMAN DETECTION
//   - Analyze the image. Is there a person performing a workout? 
//   - If no person/exercise is found (e.g., it is a screenshot of a chart or app), return:
//     {"error": "Invalid Content", "message": "No exercise detected. Upload a photo/video of your form."}

//   PHASE 2: FORM ANALYSIS
//   - Identify exercise and muscles used.
//   - Provide "good", "watchouts", "fixes", and "injuryRisks".
//   - Return ytSuggestions matching the exercise.

//   Return ONLY valid JSON. No markdown.
// `;

//       const result = await callGeminiVision(
//         prompt,
//         'You are an elite kinesiologist and NSCA-certified personal trainer. Analyze the image directly. Return ONLY valid JSON, no markdown, no extra text. The ytSuggestions should match the identified exercise.',
//         imageData,
//         true
//       );
//       setFormFeedback(result);
//     } catch (err) {
//       setFormFeedback(`Analysis failed: ${err.message}`);
//     } finally {
//       setIsFormAnalyzing(false);
//     }
//   };
//   // ── Workout submit ─────────────────────────────────────────────────────────
//   const handleWorkoutSubmit = async e => {
//     e.preventDefault();
//     if (!user || !db || !exerciseName) return;
//     try {
//       await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workouts'), {
//         exercise:  String(exerciseName),
//         bodyPart:  String(bodyPart),
//         weight:    Number(weight),
//         reps:      Number(reps),
//         sets:      Number(sets),
//         timestamp: serverTimestamp(),
//       });
//       setExerciseName(''); setWeight(''); setReps(''); setSets('');
//     } catch (err) {
//       console.error('Firestore write error:', err);
//     }
//   };

//   // ── Meal scanner ───────────────────────────────────────────────────────────
//   const analyzeMealImage = async e => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setIsMealAnalyzing(true);
//     setMealAnalysis(null);
//     try {
//       // Resize to 1024px max — larger images don't improve accuracy but slow the call
//       const imageData = await resizeImageToBase64(file, 1024);

//       // Step 1: identify the dish first in plain text (more reliable than one-shot JSON)
//       // Set preview
//       const objectUrl = URL.createObjectURL(file);
//       setMealPreviewUrl(objectUrl);

// //       const nutritionPrompt = `You are an expert Indian and global food nutritionist with deep knowledge of South Asian cuisines.
// // Analyze this food image precisely. Identify EVERY food item visible.

// // Return ONLY this valid JSON object (no markdown, no extra text):
// // {
// //   "dish": "Main dish name, specific (e.g. Whole Wheat Roti with Dal Tadka)",
// //   "serving": "Estimated serving size (e.g. 2 rotis + 1 katori dal)",
// //   "calories": 320,
// //   "protein": 11,
// //   "carbs": 52,
// //   "fat": 7,
// //   "items": [
// //     { "name": "Whole Wheat Roti", "serving": "2 pieces (60g)", "calories": 180, "protein": 6, "carbs": 36, "fat": 3 },
// //     { "name": "Dal Tadka", "serving": "1 katori (150ml)", "calories": 140, "protein": 5, "carbs": 16, "fat": 4 }
// //   ],
// //   "tips": "A short dietitian tip about this meal (e.g. high fiber, add protein source, etc.)"
// // }

// // If only one item is visible, the items array should have one entry. Be accurate for Indian foods like roti, rice, dal, sabzi, paneer, chicken, biryani, etc.`;
// // const nutritionPrompt = `You are an expert Indian and global food nutritionist.
// // CRITICAL: If the image does NOT contain food or drink, return only: {"error": "Invalid Image", "message": "Please upload a clear photo of your meal for nutritional analysis."}

// // Identify EVERY food item visible. Return ONLY this valid JSON object (no markdown):
// // {
// //   "dish": "Main dish name (e.g. Paneer Butter Masala with Garlic Naan)",
// //   "serving": "Estimated serving size (e.g. 1 bowl + 2 naans)",
// //   "calories": 0,
// //   "protein": 0,
// //   "carbs": 0,
// //   "fat": 0,
// //   "items": [
// //     { "name": "Item Name", "serving": "size", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
// //   ],
// //   "tips": "A short dietitian tip regarding balance or portion control."
// // }
// // Be highly accurate for Indian staples like Roti, Dal, Sabzi, and Biryani.`;
// // Replace the existing nutritionPrompt inside analyzeMealImage
//       const nutritionPrompt = `
// You are a highly strict Food Vision AI.

// Your PRIMARY goal is NOT nutrition.
// Your PRIMARY goal is CORRECT CLASSIFICATION.

// -----------------------------------
// PHASE 1: HARD CLASSIFICATION (CRITICAL)
// -----------------------------------
// Carefully analyze the image step-by-step:

// Step 1: Check if actual edible food is clearly visible.

// Food MUST satisfy ALL:
// - Recognizable edible texture (solid/liquid food)
// - Clear shape (not abstract or blurry)
// - Context of food (plate, bowl, hand holding food, etc.)

// If ANY of these fail → classify as NOT FOOD.

// -----------------------------------
// STRICT REJECTION RULES
// -----------------------------------
// Immediately return NOT FOOD if:
// - Image is blurry / dark / unclear
// - Looks like background, floor, wall, object
// - Screenshot / UI / text
// - Gym / person / body / exercise
// - Packaged item without visible food
// - Ambiguous shapes

// ⚠️ IMPORTANT:
// If unsure → ALWAYS reject (DO NOT GUESS)

// -----------------------------------
// PHASE 2: CONFIDENCE CHECK
// -----------------------------------
// Before proceeding, assign confidence:

// - HIGH → clearly visible food
// - MEDIUM → somewhat visible but not perfect
// - LOW → unclear / ambiguous

// If confidence is LOW → RETURN ERROR

// Return:
// {
//   "error": "Low Confidence",
//   "message": "Image is unclear. Cannot reliably detect food."
// }

// -----------------------------------
// PHASE 3: FOOD DETECTION (ONLY IF HIGH/MEDIUM)
// -----------------------------------
// Now identify ONLY visible food:

// STRICT RULES:
// - DO NOT assume full meals
// - DO NOT add items not visible
// - DO NOT default to "roti" or common foods
// - Identify based on:
//    shape + texture + color

// Examples:
// - Round flat brown → Roti
// - White grains → Rice
// - Yellow liquid → Dal
// - Mixed rice + spices → Biryani

// If shape does NOT match clearly → DO NOT NAME IT

// -----------------------------------
// PHASE 4: OUTPUT JSON ONLY
// -----------------------------------

// If NOT FOOD:
// {
//   "error": "Invalid Content",
//   "message": "No food detected in the image."
// }

// If FOOD:
// {
//   "dish": "ONLY if confidently identifiable, else 'Unknown Food Item'",
//   "confidence": "high / medium",

//   "items": [
//     {
//       "name": "ONLY clearly visible item",
//       "serving": "estimated portion",
//       "calories": integer,
//       "protein": integer,
//       "carbs": integer,
//       "fat": integer
//     }
//   ],

//   "totalNutrition": {
//     "calories": integer,
//     "protein": integer,
//     "carbs": integer,
//     "fat": integer
//   },

//   "tips": "Short realistic advice"
// }

// -----------------------------------
// FINAL RULES (VERY IMPORTANT)
// -----------------------------------
// - When in doubt → REJECT
// - NEVER guess food name
// - NEVER default to roti
// - NEVER hallucinate unseen items
// - Accuracy > completeness
// `;


//       const parsed = await callGeminiVision(
//         nutritionPrompt,
//         'You are a registered dietitian specializing in Indian cuisine. Identify food items precisely. Return ONLY valid JSON.',
//         imageData,
//         true
//       );
//       setMealAnalysis(parsed);
//     } catch (err) {
//       console.error('Meal analysis error:', err);
//       setMealAnalysis({ dish: 'Analysis failed — please retry', calories: 0, protein: 0, carbs: 0, fat: 0 });
//     } finally {
//       setIsMealAnalyzing(false);
//     }
//   };
//   // ── Render ─────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
//         <div className="text-center">
//           <BrainCircuit size={48} className="text-green-500 animate-pulse mx-auto mb-4" />
//           <p className="text-green-500 font-black animate-pulse uppercase tracking-widest">NUTRI TRACK AI</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
//         <div className="w-full max-w-md bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100">
//           <div className="flex flex-col items-center mb-10">
//             <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-100">
//               <BrainCircuit className="text-white w-10 h-10" />
//             </div>
//             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Nutri Track</h1>
//             <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-1">Next-Gen AI Partner</p>
//           </div>
//           {initError && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
//               <p className="text-xs text-red-500 font-bold">⚠ Init Error: {initError}</p>
//             </div>
//           )}
//           <form onSubmit={handleAuth} className="space-y-4">
//             <input
//               type="email"
//               placeholder="Email Address"
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
//             />
//             <input
//               type="password"
//               placeholder="Access Key"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
//             />
//             {authError && (
//               <p className="text-[10px] text-red-500 text-center font-bold px-2 uppercase">{authError}</p>
//             )}
//             <button
//               type="submit"
//               className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
//             >
//               {authView === 'login' ? 'Proceed to System' : 'Create Profile'}
//             </button>
//           </form>
//           <div className="mt-8 text-center">
//             <button
//               onClick={() => { setAuthView(v => v === 'login' ? 'signup' : 'login'); setAuthError(''); }}
//               className="text-xs text-slate-400 hover:text-green-500 font-bold transition-all"
//             >
//               {authView === 'login' ? 'New here? Register Profile' : 'Have account? Sign In'}
//             </button>
//             <div className="flex items-center gap-4 py-6">
//               <div className="flex-1 h-[1px] bg-slate-100" />
//               <span className="text-[10px] text-slate-300 font-bold">OR</span>
//               <div className="flex-1 h-[1px] bg-slate-100" />
//             </div>
//             <button
//               onClick={handleGuestLogin}
//               className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-green-600 transition-all"
//             >
//               Explore in Guest Mode
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
//       <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => signOut(auth)} />
//       <main className="pb-20">
//         {activeTab === 'home' && (
//           <div className="max-w-7xl mx-auto px-4 py-32 text-center">
//             <h1 className="text-8xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
//               Hyper-Fitness <span className="text-green-500">by Intelligence</span>
//             </h1>
//             <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
//               Harnessing cutting-edge ML logic to transform nutrition insights into peak performance outcomes.
//             </p>
//             {/* Objective preview on home */}
//             <div className="flex justify-center gap-4 mb-10">
//               {FITNESS_OBJECTIVES.map(({ id, label, icon: Icon, colorClass }) => (
//                 <button
//                   key={id}
//                   onClick={() => { setFitnessObjective(id); setActiveTab('dietetics'); }}
//                   className={`${colorClass} text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-all text-sm`}
//                 >
//                   <Icon size={16} /> {label}
//                 </button>
//               ))}
//             </div>
//             <div className="flex justify-center gap-6">
//               <button
//                 onClick={() => setActiveTab('workout')}
//                 className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
//               >
//                 Start Session <ChevronRight size={20} />
//               </button>
//               <button
//                 onClick={() => setActiveTab('dietetics')}
//                 className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-all"
//               >
//                 <Activity size={20} /> Build Protocol
//               </button>
//             </div>
//           </div>
//         )}

//         {activeTab === 'dietetics' && (
//           <HealthTab
//             bmiHeight={bmiHeight} setBmiHeight={setBmiHeight}
//             bmiWeight={bmiWeight} setBmiWeight={setBmiWeight}
//             age={age} setAge={setAge}
//             pal={pal} setPal={setPal}
//             conditions={conditions} setConditions={setConditions}
//             dietPreference={dietPreference} setDietPreference={setDietPreference}
//             fitnessObjective={fitnessObjective} setFitnessObjective={setFitnessObjective}
//             calculateBMI={calculateBMI} bmiResult={bmiResult}
//             generateProtocol={generateProtocol}
//             isGeneratingDiet={isGeneratingDiet}
//             dietPlan={weeklyDietPlan}
//             workoutPlan={weeklyWorkoutPlan}
//             dietError={dietError}
//             targetKcal={targetKcal}
//             targetProtein={targetProtein}
//           />
//         )}

//         {activeTab === 'dashboard' && (
//           <DashboardTab workouts={workouts} userIsAnonymous={user.isAnonymous} />
//         )}

//         {activeTab === 'workout' && (
//           <div className="max-w-4xl mx-auto px-4 py-12">
//             <WorkoutTab
//               handleWorkoutSubmit={handleWorkoutSubmit}
//               exerciseName={exerciseName} setExerciseName={setExerciseName}
//               bodyPart={bodyPart} setBodyPart={setBodyPart}
//               weight={weight} setWeight={setWeight}
//               reps={reps} setReps={setReps}
//               sets={sets} setSets={setSets}
//               workouts={workouts}
//             />
//           </div>
//         )}

//         {activeTab === 'scanner' && (
//           <div className="max-w-4xl mx-auto px-4 py-12">
//             <ScannerTab analyzeMealImage={analyzeMealImage} isMealAnalyzing={isMealAnalyzing} mealAnalysis={mealAnalysis} previewUrl={mealPreviewUrl} />
//           </div>
//         )}

//         {activeTab === 'rehab' && (
//           <div className="max-w-4xl mx-auto px-4 py-12">
//             <RehabTab analyzeFormVision={analyzeFormVision} isFormAnalyzing={isFormAnalyzing} formFeedback={formFeedback} rehabPreviewUrl={rehabPreviewUrl} rehabFileType={rehabFileType} />
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default App;




//  cluade production level code
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
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
  Home, Calculator, Camera, Activity, Dumbbell,
  LayoutDashboard, LogOut, User, CheckCircle2,
  ChevronRight, Sparkles, Zap, BrainCircuit, Stethoscope,
  Calendar, AlertCircle, Leaf, Beef,
  TrendingDown, TrendingUp, Shield, Target, Swords,
} from 'lucide-react';


// ─── Firebase Config ──────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const rawAppId =
  typeof __app_id !== 'undefined'
    ? __app_id
    : (import.meta.env.VITE_APP_ID || 'nutri-track-ai');
const appId = rawAppId.replace(/\//g, '_');
const GEMINI_API_KEY  = import.meta.env.VITE_GEMINI_API_KEY  || '';
const OPENROUTER_KEY  = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const GEN_MODEL       = 'gemini-2.0-flash';

// ─── Fitness Objectives ───────────────────────────────────────
const FITNESS_OBJECTIVES = [
  {
    id: 'lose_weight',
    label: 'Lose Weight',
    tagline: 'Burn fat, reveal definition',
    icon: TrendingDown,
    color: 'orange',
    colorClass: 'bg-orange-500',
    softClass: 'bg-orange-50 border-orange-200 text-orange-700',
    activeClass: 'bg-orange-500 border-orange-500 text-white shadow-orange-200',
    kcalModifier: -400,
    proteinMultiplier: 2.2,
    exerciseFocus: 'HIIT + Moderate Cardio + Compound Lifts',
  },
  {
    id: 'gain_muscle',
    label: 'Gain Muscle',
    tagline: 'Build mass, maximise hypertrophy',
    icon: TrendingUp,
    color: 'green',
    colorClass: 'bg-green-500',
    softClass: 'bg-green-50 border-green-200 text-green-700',
    activeClass: 'bg-green-500 border-green-500 text-white shadow-green-200',
    kcalModifier: +300,
    proteinMultiplier: 2.4,
    exerciseFocus: 'Progressive Overload Strength + Accessory Hypertrophy',
  },
  {
    id: 'maintain',
    label: 'Maintain',
    tagline: 'Sustain performance & health',
    icon: Shield,
    color: 'blue',
    colorClass: 'bg-blue-500',
    softClass: 'bg-blue-50 border-blue-200 text-blue-700',
    activeClass: 'bg-blue-500 border-blue-500 text-white shadow-blue-200',
    kcalModifier: 0,
    proteinMultiplier: 1.8,
    exerciseFocus: 'Mixed Modality: Strength + Cardio + Mobility',
  },
];

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────

/** Extract a valid JSON object/array from any raw LLM string. */
function extractJson(raw) {
  if (!raw) throw new Error('Empty AI response');

  // Strip markdown code fences
  const fenceMatch = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) { /* continue */ }
  }

  // Try whole string
  try { return JSON.parse(raw.trim()); } catch (_) { /* continue */ }

  // Find first { or [
  const fb = raw.indexOf('{');
  const fa = raw.indexOf('[');
  let start = -1;
  if (fb !== -1 && (fa === -1 || fb < fa)) start = fb;
  else if (fa !== -1) start = fa;

  if (start !== -1) {
    const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
    if (end > start) {
      try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) { /* continue */ }
    }
  }

  throw new Error(`Cannot extract JSON from: ${raw.slice(0, 200)}…`);
}

/**
 * FIX #1 — Normalise Food Vision response.
 * The Gemini prompt returns either:
 *   { totalNutrition: { calories, protein, carbs, fat }, items: [...] }
 * or the flat legacy format:
 *   { calories, protein, carbs, fat }
 * This function ensures the component always gets flat top-level numbers.
 */
function normalizeMealAnalysis(parsed) {
  if (!parsed || parsed.error) return parsed;

  const tn = parsed.totalNutrition || {};
  return {
    dish:       parsed.dish     || 'Unknown Food Item',
    serving:    parsed.serving  || '',
    confidence: parsed.confidence || 'medium',
    // Prefer totalNutrition values, fall back to flat, then 0
    calories:   Number(tn.calories  ?? parsed.calories  ?? 0),
    protein:    Number(tn.protein   ?? parsed.protein   ?? 0),
    carbs:      Number(tn.carbs     ?? parsed.carbs     ?? 0),
    fat:        Number(tn.fat       ?? parsed.fat       ?? 0),
    // items: ensure each item also has flat numbers (some models nest them)
    items: (parsed.items || []).map(item => ({
      name:     item.name     || item.dish  || 'Item',
      serving:  item.serving  || '1 serving',
      calories: Number(item.calories ?? 0),
      protein:  Number(item.protein  ?? 0),
      carbs:    Number(item.carbs    ?? 0),
      fat:      Number(item.fat      ?? 0),
    })),
    tips: parsed.tips || '',
  };
}

/**
 * FIX #2 — Build a guaranteed exercise-specific YouTube search URL.
 * Appends hard-coded suffixes so the result is always a tutorial video,
 * never a music video or unrelated content.
 */
function buildYtUrl(exerciseName, queryFromGemini) {
  // Use model query only as the exercise-name hint; enforce tutorial context
  const base = queryFromGemini || exerciseName || 'exercise';
  // Strip any accidental non-exercise words
  const safe = base.replace(/(music|song|lyrics|vevo|official video)/gi, '').trim();
  const forced = `${safe} proper form tutorial exercise correction`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(forced)}`;
}

// Resize an image File to base64 (≤ maxPx on longest side)
function resizeImageToBase64(file, maxPx = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        const ratio = Math.min(maxPx / w, maxPx / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });
}

// Extract a representative frame from a video File
function extractVideoFrame(file, timeSec = 2) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url   = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadeddata = () => {
      video.currentTime = Math.min(timeSec, video.duration * 0.3);
    };
    video.onseeked = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = Math.min(video.videoWidth, 1024);
      canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    video.onerror = () => reject(new Error('Video failed to load'));
    video.src = url;
  });
}

// ─────────────────────────────────────────────────────────────
//  AI CALLERS
//  → In production: replace these with fetch('/api/gemini', ...)
//    so the real API key stays on the server.
// ─────────────────────────────────────────────────────────────

async function callOpenRouter(prompt, systemInstruction = '') {
  if (!OPENROUTER_KEY) throw new Error('OpenRouter key missing in .env');
  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer':  window.location.origin,
      'X-Title':       'Nutri Track AI',
    },
    body: JSON.stringify({ model: 'google/gemini-2.0-flash-001', messages }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt, systemInstruction = '', imageData = null, isJson = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEN_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const parts = [{ text: prompt }];
  if (imageData) {
    // Vision: image must come BEFORE the text prompt
    parts.unshift({ inline_data: { mime_type: imageData.mimeType, data: imageData.data } });
  }

  const payload = {
    contents: [{ parts }],
    ...(systemInstruction && { system_instruction: { parts: [{ text: systemInstruction }] } }),
    generationConfig: {
      ...(isJson && { response_mime_type: 'application/json' }),
      temperature: 0.3,   // lower = more deterministic / accurate
    },
  };

  const attempt = async (retries = 0) => {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (response.status === 429) {
      console.warn('Gemini rate-limit → falling back to OpenRouter');
      const fallback = await callOpenRouter(prompt, systemInstruction);
      return isJson ? extractJson(fallback) : fallback;
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return isJson ? extractJson(text) : text;
  };

  // Retry up to 2× on transient failures (not rate-limit)
  for (let i = 0; i < 3; i++) {
    try {
      return await attempt(i);
    } catch (err) {
      if (i === 2 || err.message.includes('429')) throw err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTS
// ─────────────────────────────────────────────────────────────

const NavBar = ({ activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'home',      icon: Home,            label: 'Home'        },
    { id: 'dietetics', icon: Calculator,      label: 'Dietetics'   },
    { id: 'scanner',   icon: Camera,          label: 'Food Vision' },
    { id: 'workout',   icon: Dumbbell,        label: 'Workouts'    },
    { id: 'rehab',     icon: Stethoscope,     label: 'Rehab'       },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard'   },
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
              AI
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
              <Icon size={16} /> {label}
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

const ObjectiveSelector = ({ fitnessObjective, setFitnessObjective }) => (
  <div className="mb-6">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
      <Target size={12} className="text-green-500" /> Fitness Objective
    </label>
    <div className="grid grid-cols-3 gap-3">
      {FITNESS_OBJECTIVES.map(({ id, label, tagline, icon: Icon, activeClass, softClass }) => (
        <button
          key={id}
          onClick={() => setFitnessObjective(id)}
          className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl font-bold border-2 transition-all shadow-md ${
            fitnessObjective === id ? activeClass : `${softClass} border-transparent hover:shadow-lg`
          }`}
        >
          <Icon size={20} />
          <span className="text-xs font-black uppercase tracking-wide">{label}</span>
          <span className={`text-[9px] font-medium ${fitnessObjective === id ? 'opacity-80' : 'opacity-60'}`}>
            {tagline}
          </span>
        </button>
      ))}
    </div>
  </div>
);

const ExerciseProtocolCard = ({ workoutPlan, objectiveId }) => {
  const obj = FITNESS_OBJECTIVES.find(o => o.id === objectiveId) || FITNESS_OBJECTIVES[2];
  if (!workoutPlan) return null;
  return (
    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl mt-8">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 ${obj.colorClass} rounded-xl flex items-center justify-center`}>
          <Swords size={16} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Exercise Protocol</h3>
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">{workoutPlan.focus}</p>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {(workoutPlan.weeklyRoutine || []).map((day, i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all">
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 text-${obj.color}-400`}>{day.day}</p>
            <p className="text-[11px] text-slate-300 leading-snug font-medium">{day.activity}</p>
            {day.sets && <p className="text-[9px] text-slate-500 mt-2 font-bold">{day.sets}</p>}
          </div>
        ))}
      </div>
      {workoutPlan.notes && (
        <div className="mt-6 bg-white/5 rounded-2xl p-5 border border-white/10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Notes</p>
          <p className="text-sm text-slate-300 leading-relaxed">{workoutPlan.notes}</p>
        </div>
      )}
    </div>
  );
};

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['Breakfast','Morning Snack','Lunch','Afternoon Snack','Dinner','Supper'];

const DietPlanGrid = ({ dietPlan, dietPreference, fitnessObjective }) => {
  const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm overflow-x-auto mt-8">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 ${obj.colorClass} rounded-xl flex items-center justify-center`}>
          <Calendar size={16} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Weekly Meal Plan</h3>
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
        {dietPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'} · {obj.label} Protocol
      </p>
      <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
        {DAYS.map(day => {
          const dayData = dietPlan[day] || {};
          return (
            <div key={day} className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
              <p className={`text-xs font-black text-${obj.color}-600 uppercase mb-4 border-b border-${obj.color}-100 pb-1`}>{day}</p>
              {MEALS.map(meal => {
                const value =
                  dayData[meal] ||
                  dayData[meal.toLowerCase()] ||
                  dayData[meal.replace(' ', '_')] ||
                  dayData[meal.toLowerCase().replace(' ', '_')] ||
                  dayData[meal.replace(' ', '')] || '';
                if (!value) return null;
                return (
                  <div key={meal} className="mb-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase">{meal}</p>
                    <p className="text-[11px] text-slate-700 leading-tight">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProtocolSummaryBanner = ({ bmiResult, fitnessObjective, targetKcal, targetProtein }) => {
  const obj  = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
  const Icon = obj.icon;
  return (
    <div className={`rounded-3xl p-6 border-2 mb-6 flex flex-wrap gap-6 items-center ${obj.softClass}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${obj.colorClass} rounded-xl flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Objective</p>
          <p className="font-black text-lg">{obj.label}</p>
        </div>
      </div>
      <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Calories</p>
        <p className="font-black text-lg">{targetKcal} kcal/day</p>
      </div>
      <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Protein</p>
        <p className="font-black text-lg">{targetProtein}g/day</p>
      </div>
      <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Exercise Focus</p>
        <p className="font-black text-sm">{obj.exerciseFocus}</p>
      </div>
    </div>
  );
};

const DashboardTab = ({ workouts, userIsAnonymous }) => {
  const weeklyIntensity = workouts.reduce(
    (acc, w) => acc + (Number(w.weight) || 0) * (Number(w.reps) || 0), 0
  );
  const calculate1RM = () => {
    if (!workouts.length) return '--';
    const { weight: wt, reps: r } = workouts[0];
    const wn = Number(wt) || 0, rn = Number(r) || 0;
    return rn === 0 ? wn : Math.round(wn * (1 + rn / 30));
  };
  const formatDate = ts => ts?.seconds
    ? new Date(ts.seconds * 1000).toLocaleDateString() : 'N/A';

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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Predicted 1RM</p>
          <p className="text-2xl font-black text-slate-900">{calculate1RM()} kg</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Volume',  value: `${weeklyIntensity} kg` },
          { label: 'Total Lifts',   value: workouts.length },
          { label: 'Status',        value: userIsAnonymous ? 'Guest' : 'Member', green: true },
          { label: 'Last Activity', value: formatDate(workouts[0]?.timestamp) },
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

const HealthTab = ({
  bmiHeight, setBmiHeight, bmiWeight, setBmiWeight, age, setAge, pal, setPal,
  conditions, setConditions, dietPreference, setDietPreference,
  fitnessObjective, setFitnessObjective, calculateBMI, bmiResult,
  generateProtocol, isGeneratingDiet, dietPlan, workoutPlan,
  dietError, targetKcal, targetProtein,
}) => (
  <div className="max-w-6xl mx-auto px-4 py-12">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-extrabold text-slate-900 mb-4 uppercase italic">Protocol Synthesis</h2>
      <p className="text-slate-500">Biometric mapping → coordinated diet & exercise protocol.</p>
    </div>
    <div className="grid md:grid-cols-2 gap-8 mb-4">
      {/* Left — inputs */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <User size={20} className="text-green-500" /> Profile Input
        </h3>
        <ObjectiveSelector fitnessObjective={fitnessObjective} setFitnessObjective={setFitnessObjective} />
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Dietary Preference</label>
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Height (cm)', val: bmiHeight, set: setBmiHeight },
            { label: 'Weight (kg)', val: bmiWeight, set: setBmiWeight },
            { label: 'Age',         val: age,       set: setAge       },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{label}</label>
              <input
                type="number"
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
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Clinical Conditions</label>
          <div className="flex flex-wrap gap-2">
            {['CVD', 'T2D', 'Iron Deficiency', 'Hyperthyroid'].map(c => (
              <button
                key={c}
                onClick={() => setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  conditions.includes(c) ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'
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
          Calculate Metrics
        </button>
      </div>

      {/* Right — results */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl flex flex-col justify-center">
        {bmiResult ? (
          <div className="text-center">
            {(() => {
              const obj = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective);
              const ObjIcon = obj?.icon;
              return (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 ${obj?.colorClass} text-white`}>
                  {ObjIcon && <ObjIcon size={14} />} {obj?.label}
                </div>
              );
            })()}
            <div className="flex justify-center gap-6 mb-6 flex-wrap">
              <div>
                <p className="text-5xl font-black text-green-400">{bmiResult.bmi}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">BMI Index</p>
              </div>
              <div>
                <p className="text-5xl font-black text-blue-400">{targetKcal || bmiResult.tdee}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Target kcal</p>
              </div>
              <div>
                <p className="text-5xl font-black text-purple-400">{targetProtein || '--'}g</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Protein / day</p>
              </div>
            </div>
            <p className="text-xl font-bold mb-1 text-slate-300">
              Status: <span className="text-white">{bmiResult.category}</span>
            </p>
            <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-6">
              {dietPreference.toUpperCase()} · {FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective)?.label.toUpperCase()}
            </p>
            {dietError && (
              <p className="text-red-400 text-xs font-bold mb-4 bg-red-900/30 p-3 rounded-xl">⚠ {dietError}</p>
            )}
            <button
              onClick={generateProtocol}
              disabled={isGeneratingDiet}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingDiet ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Synthesizing Protocol...
                </span>
              ) : (
                <><Sparkles size={20} /> Generate Full Protocol</>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center opacity-50">
            <BrainCircuit size={64} className="mx-auto mb-4 text-green-500" />
            <p className="uppercase font-bold tracking-widest text-xs">Awaiting Biometric Encoding</p>
            <p className="text-slate-600 text-xs mt-2">Fill profile → Calculate → Generate</p>
          </div>
        )}
      </div>
    </div>

    {bmiResult && dietPlan && (
      <ProtocolSummaryBanner
        bmiResult={bmiResult}
        fitnessObjective={fitnessObjective}
        targetKcal={targetKcal}
        targetProtein={targetProtein}
      />
    )}
    {dietPlan    && <DietPlanGrid dietPlan={dietPlan} dietPreference={dietPreference} fitnessObjective={fitnessObjective} />}
    {workoutPlan && <ExerciseProtocolCard workoutPlan={workoutPlan} objectiveId={fitnessObjective} />}
  </div>
);

// ─── ScannerTab ───────────────────────────────────────────────
const ScannerTab = ({ analyzeMealImage, isMealAnalyzing, mealAnalysis, previewUrl }) => (
  <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
        <Camera size={20} className="text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Food Vision</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Nutritional Scanner</p>
      </div>
    </div>
    <p className="text-slate-400 text-sm mb-8 ml-1">Scan any meal — get instant macros with Indian food precision.</p>

    {/* Upload zone */}
    <label className="block w-full cursor-pointer bg-slate-50 rounded-[30px] border-4 border-dashed border-slate-200 hover:border-green-500 transition-all group mb-8 overflow-hidden">
      <input type="file" accept="image/*" onChange={analyzeMealImage} className="hidden" />
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Food preview" className="w-full max-h-72 object-cover rounded-[26px]" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[26px] opacity-0 group-hover:opacity-100 transition-all">
            <p className="text-white font-black uppercase text-xs tracking-widest">Tap to Change Image</p>
          </div>
        </div>
      ) : (
        <div className="p-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-all">
            <Camera size={32} className="text-green-400 group-hover:text-green-600 transition-colors" />
          </div>
          <p className="font-black text-slate-500 group-hover:text-green-600 uppercase text-xs tracking-widest mb-2">
            {isMealAnalyzing ? '🔍 Scanning food...' : 'Upload Food Photo'}
          </p>
          <p className="text-[10px] text-slate-300 font-medium">Roti · Rice · Dal · Curry · Salad · Protein Bowls</p>
        </div>
      )}
    </label>

    {/* Loader */}
    {isMealAnalyzing && (
      <div className="flex items-center justify-center gap-3 py-6 bg-green-50 rounded-2xl border border-green-100 mb-6">
        <svg className="animate-spin h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-green-700 font-black text-sm uppercase tracking-widest">Identifying dish & calculating macros…</span>
      </div>
    )}

    {/* Error state */}
    {mealAnalysis?.error && !isMealAnalyzing && (
      <div className="bg-red-50 border border-red-100 rounded-[20px] p-6 text-center">
        <p className="text-red-500 font-black text-sm uppercase tracking-widest mb-1">⚠ {mealAnalysis.error}</p>
        <p className="text-red-400 text-xs font-medium">{mealAnalysis.message}</p>
      </div>
    )}

    {/* Results */}
    {mealAnalysis && !mealAnalysis.error && !isMealAnalyzing && (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-slate-900 rounded-[30px] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Food Vision Identified</p>
            <p className="text-xl font-black text-white capitalize">{mealAnalysis.dish}</p>
            {mealAnalysis.serving && (
              <p className="text-xs text-green-400 font-bold mt-0.5">{mealAnalysis.serving}</p>
            )}
          </div>
        </div>

        {/* Macro cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Calories', value: mealAnalysis.calories, unit: 'kcal', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', sub: 'text-orange-400' },
            { label: 'Protein',  value: mealAnalysis.protein,  unit: 'g',    bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   sub: 'text-blue-400' },
            { label: 'Carbs',    value: mealAnalysis.carbs,    unit: 'g',    bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', sub: 'text-purple-400' },
            { label: 'Fat',      value: mealAnalysis.fat,      unit: 'g',    bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600',  sub: 'text-green-400' },
          ].map(({ label, value, unit, bg, border, text, sub }) => (
            <div key={label} className={`${bg} ${border} border rounded-[20px] p-5 text-center`}>
              <p className={`text-3xl font-black ${text}`}>{value}</p>
              <p className={`text-[9px] font-black uppercase tracking-widest ${sub} mt-0.5`}>{unit}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Breakdown table */}
        {mealAnalysis.items && mealAnalysis.items.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-[25px] overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutritional Breakdown</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Item</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Serving</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-400">Calories</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-400">Protein</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-purple-400">Carbs</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-green-400">Fat</th>
                </tr>
              </thead>
              <tbody>
                {mealAnalysis.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-6 py-4 font-bold text-slate-800 capitalize">{item.name}</td>
                    <td className="px-4 py-4 text-center text-slate-500 font-medium text-xs">{item.serving}</td>
                    <td className="px-4 py-4 text-center font-black text-orange-600">{item.calories} <span className="text-[9px] font-bold text-slate-400">kcal</span></td>
                    <td className="px-4 py-4 text-center font-black text-blue-600">{item.protein}<span className="text-[9px] font-bold text-slate-400">g</span></td>
                    <td className="px-4 py-4 text-center font-black text-purple-600">{item.carbs}<span className="text-[9px] font-bold text-slate-400">g</span></td>
                    <td className="px-4 py-4 text-center font-black text-green-600">{item.fat}<span className="text-[9px] font-bold text-slate-400">g</span></td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2 border-slate-200 bg-slate-900">
                  <td className="px-6 py-4 font-black text-white uppercase text-xs tracking-widest" colSpan={2}>Total Estimate</td>
                  <td className="px-4 py-4 text-center font-black text-orange-400">{mealAnalysis.calories} <span className="text-[9px] font-bold text-orange-600">kcal</span></td>
                  <td className="px-4 py-4 text-center font-black text-blue-400">{mealAnalysis.protein}<span className="text-[9px] font-bold text-blue-600">g</span></td>
                  <td className="px-4 py-4 text-center font-black text-purple-400">{mealAnalysis.carbs}<span className="text-[9px] font-bold text-purple-600">g</span></td>
                  <td className="px-4 py-4 text-center font-black text-green-400">{mealAnalysis.fat}<span className="text-[9px] font-bold text-green-600">g</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tips */}
        {mealAnalysis.tips && (
          <div className="bg-green-50 border border-green-100 rounded-[20px] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">💡 Dietitian Note</p>
            <p className="text-sm text-green-800 font-medium leading-relaxed">{mealAnalysis.tips}</p>
          </div>
        )}

        {/* Scan again */}
        <label className="block w-full cursor-pointer">
          <input type="file" accept="image/*" onChange={analyzeMealImage} className="hidden" />
          <div className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-center text-sm transition-all cursor-pointer">
            📷 Scan Another Meal
          </div>
        </label>
      </div>
    )}
  </div>
);

// ─── RehabTab ─────────────────────────────────────────────────
const RehabTab = ({ analyzeFormVision, isFormAnalyzing, formFeedback, rehabPreviewUrl, rehabFileType }) => (
  <div className="max-w-4xl mx-auto px-4">
    <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
          <Stethoscope size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">AI Form Expert</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Biomechanical Analysis · Rehab Coach</p>
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-8 ml-1">
        Upload a photo or video of your exercise — get expert form analysis + exercise tutorial links.
      </p>

      {/* Upload zone */}
      <label className="block w-full cursor-pointer bg-slate-50 rounded-[30px] border-4 border-dashed border-slate-200 hover:border-blue-500 transition-all group mb-8 overflow-hidden">
        <input type="file" accept="image/*,video/*" onChange={analyzeFormVision} className="hidden" />
        {rehabPreviewUrl ? (
          <div className="relative">
            {rehabFileType === 'video' ? (
              <video src={rehabPreviewUrl} className="w-full max-h-64 object-cover rounded-[26px]" muted playsInline />
            ) : (
              <img src={rehabPreviewUrl} alt="Exercise preview" className="w-full max-h-64 object-cover rounded-[26px]" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[26px] opacity-0 group-hover:opacity-100 transition-all">
              <p className="text-white font-black uppercase text-xs tracking-widest">Tap to Change</p>
            </div>
            {rehabFileType === 'video' && (
              <div className="absolute top-3 left-3 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                📹 Video — Frame Extracted
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-all">
              <Activity size={32} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="font-black text-slate-500 group-hover:text-blue-600 uppercase text-xs tracking-widest mb-2">
              {isFormAnalyzing ? '🔬 Analyzing form…' : 'Upload Image or Video'}
            </p>
            <p className="text-[10px] text-slate-300 font-medium">Push-ups · Squats · Deadlifts · Planks · Any exercise</p>
            <div className="flex gap-2 mt-3">
              <span className="bg-blue-100 text-blue-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">📷 Photo</span>
              <span className="bg-purple-100 text-purple-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">🎬 Video</span>
            </div>
          </div>
        )}
      </label>

      {/* Loader */}
      {isFormAnalyzing && (
        <div className="flex items-center justify-center gap-3 py-6 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-blue-700 font-black text-sm uppercase tracking-widest">Analyzing biomechanics…</span>
        </div>
      )}

      {/* Error / invalid content */}
      {formFeedback?.error && !isFormAnalyzing && (
        <div className="bg-red-50 border border-red-100 rounded-[20px] p-6 text-center">
          <p className="text-red-500 font-black text-sm uppercase tracking-widest mb-1">⚠ {formFeedback.error}</p>
          <p className="text-red-400 text-xs font-medium">{formFeedback.message}</p>
        </div>
      )}

      {/* Structured feedback */}
      {formFeedback && !formFeedback.error && !isFormAnalyzing && (
        <div className="space-y-5">
          {/* Exercise banner */}
          {formFeedback.exercise && (
            <div className="bg-slate-900 rounded-[25px] p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Dumbbell size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exercise Identified</p>
                <p className="text-xl font-black text-white capitalize">{formFeedback.exercise}</p>
                {formFeedback.muscles && (
                  <p className="text-xs text-blue-400 font-bold mt-0.5">{formFeedback.muscles}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {formFeedback.summary && (
            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <BrainCircuit size={10} /> What&apos;s Happening
              </p>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">{formFeedback.summary}</p>
            </div>
          )}

          {/* Good & Watch-outs */}
          <div className="grid md:grid-cols-2 gap-4">
            {formFeedback.good?.length > 0 && (
              <div className="bg-green-50 rounded-[20px] p-5 border border-green-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-3 flex items-center gap-1">
                  <CheckCircle2 size={10} /> The Good
                </p>
                <ul className="space-y-2">
                  {formFeedback.good.map((g, i) => (
                    <li key={i} className="text-xs text-green-700 font-medium flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {formFeedback.watchouts?.length > 0 && (
              <div className="bg-red-50 rounded-[20px] p-5 border border-red-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-1">
                  <AlertCircle size={10} /> Watch-Outs
                </p>
                <ul className="space-y-2">
                  {formFeedback.watchouts.map((w, i) => (
                    <li key={i} className="text-xs text-red-700 font-medium flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">⚠</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quick fixes */}
          {formFeedback.fixes?.length > 0 && (
            <div className="bg-yellow-50 rounded-[20px] p-5 border border-yellow-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-yellow-600 mb-3 flex items-center gap-1">
                <Zap size={10} /> Quick Fixes
              </p>
              <ol className="space-y-2">
                {formFeedback.fixes.map((f, i) => (
                  <li key={i} className="text-xs text-yellow-800 font-medium flex items-start gap-2">
                    <span className="text-yellow-500 font-black">{i + 1}.</span> {f}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Injury risks */}
          {formFeedback.injuryRisks?.length > 0 && (
            <div className="bg-orange-50 rounded-[20px] p-5 border border-orange-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-3 flex items-center gap-1">
                <Shield size={10} /> Injury Risk Flags
              </p>
              <ul className="space-y-2">
                {formFeedback.injuryRisks.map((r, i) => (
                  <li key={i} className="text-xs text-orange-700 font-medium flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">🔴</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* YouTube tutorial links — FIX #2: buildYtUrl forces exercise context */}
          {formFeedback.ytSuggestions?.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1">
                <Activity size={10} className="text-red-500" /> Recommended Tutorial Videos
              </p>
              <div className="space-y-3">
                {formFeedback.ytSuggestions.map((v, i) => (
                  <a
                    key={i}
                    href={buildYtUrl(formFeedback.exercise, v.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-200 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-all">
                      <span className="text-white text-sm font-black">▶</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 group-hover:text-red-600 transition-colors capitalize">{v.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{v.reason}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-red-400 flex-shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Fallback plain-text */}
          {typeof formFeedback === 'string' && (
            <div className="bg-blue-50 p-8 rounded-[25px] text-sm text-blue-800 border border-blue-100 leading-relaxed">
              <div className="whitespace-pre-wrap">{formFeedback}</div>
            </div>
          )}

          {/* Analyse again */}
          <label className="block w-full cursor-pointer">
            <input type="file" accept="image/*,video/*" onChange={analyzeFormVision} className="hidden" />
            <div className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-center text-sm transition-all cursor-pointer">
              🎬 Analyze Another Exercise
            </div>
          </label>
        </div>
      )}
    </div>
  </div>
);

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
        <div key={w.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-green-300 transition-all">
          <div>
            <p className="font-black text-slate-900 uppercase text-sm tracking-tighter">{w.exercise || 'Unnamed'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{w.bodyPart || 'Unspecified'}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-white px-4 py-2 rounded-xl text-xs font-black text-slate-900 border border-slate-100">{w.weight || 0} KG</span>
            <span className="bg-green-500 px-4 py-2 rounded-xl text-xs font-black text-white">{w.reps || 0} R</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────
const App = () => {
  const [activeTab,   setActiveTab]   = useState('home');
  const [loading,     setLoading]     = useState(true);
  const [user,        setUser]        = useState(null);
  const [db,          setDb]          = useState(null);
  const [auth,        setAuth]        = useState(null);
  const [workouts,    setWorkouts]    = useState([]);
  const [initError,   setInitError]   = useState('');

  // Auth
  const [authView,  setAuthView]  = useState('login');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [authError, setAuthError] = useState('');

  // Dietetics
  const [bmiHeight,         setBmiHeight]         = useState('180');
  const [bmiWeight,         setBmiWeight]         = useState('78');
  const [age,               setAge]               = useState('22');
  const [pal,               setPal]               = useState('1.55');
  const [conditions,        setConditions]        = useState([]);
  const [dietPreference,    setDietPreference]    = useState('veg');
  const [fitnessObjective,  setFitnessObjective]  = useState('maintain');
  const [bmiResult,         setBmiResult]         = useState(null);
  const [weeklyDietPlan,    setWeeklyDietPlan]    = useState(null);
  const [weeklyWorkoutPlan, setWeeklyWorkoutPlan] = useState(null);
  const [isGeneratingDiet,  setIsGeneratingDiet]  = useState(false);
  const [dietError,         setDietError]         = useState('');
  const [targetKcal,        setTargetKcal]        = useState(null);
  const [targetProtein,     setTargetProtein]     = useState(null);

  // Workout
  const [exerciseName, setExerciseName] = useState('');
  const [bodyPart,     setBodyPart]     = useState('');
  const [weight,       setWeight]       = useState('');
  const [reps,         setReps]         = useState('');
  const [sets,         setSets]         = useState('');

  // Rehab
  const [formFeedback,     setFormFeedback]     = useState(null);
  const [isFormAnalyzing,  setIsFormAnalyzing]  = useState(false);
  const [rehabPreviewUrl,  setRehabPreviewUrl]  = useState(null);
  const [rehabFileType,    setRehabFileType]    = useState('image');

  // Scanner
  const [isMealAnalyzing, setIsMealAnalyzing] = useState(false);
  const [mealAnalysis,    setMealAnalysis]    = useState(null);
  const [mealPreviewUrl,  setMealPreviewUrl]  = useState(null);

  // ── Firebase init ────────────────────────────────────────
  useEffect(() => {
    let unsubscribeAuth = () => {};
    const initApp = async () => {
      try {
        const isFirst = getApps().length === 0;
        const app     = isFirst ? initializeApp(firebaseConfig) : getApps()[0];
        const firebaseAuth = getAuth(app);
        const firestore = isFirst
          ? initializeFirestore(app, {
              localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
            })
          : getFirestore(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        }

        unsubscribeAuth = onAuthStateChanged(firebaseAuth, u => {
          setUser(u);
          setLoading(false);
        });
      } catch (err) {
        console.error('Firebase init error:', err);
        setInitError(err.message);
        setLoading(false);
      }
    };
    initApp();
    return () => unsubscribeAuth();
  }, []);

  // ── Firestore workouts listener ──────────────────────────
  useEffect(() => {
    if (!db || !user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'workouts');
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWorkouts(list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      },
      err => console.warn('Firestore error:', err.code, err.message)
    );
    return () => unsub();
  }, [db, user]);

  // ── Auth handlers ────────────────────────────────────────
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
      if      (err.code === 'auth/operation-not-allowed')    setAuthError("Enable Email/Password auth in Firebase Console.");
      else if (err.code === 'auth/invalid-credential')       setAuthError('Invalid email or password.');
      else if (err.code === 'auth/user-not-found')           setAuthError('No account found with this email.');
      else if (err.code === 'auth/wrong-password')           setAuthError('Incorrect password.');
      else if (err.code === 'auth/email-already-in-use')     setAuthError('Email already registered. Sign in instead.');
      else if (err.code === 'auth/weak-password')            setAuthError('Password must be at least 6 characters.');
      else if (err.code === 'auth/network-request-failed')   setAuthError('Network error. Check your connection.');
      else setAuthError(err.message);
    }
  };

  const handleGuestLogin = async () => {
    if (!auth) return;
    setAuthError('');
    try {
      await signInAnonymously(auth);
    } catch (err) {
      if      (err.code === 'auth/operation-not-allowed')    setAuthError("Enable Anonymous sign-in in Firebase Console.");
      else if (err.code === 'auth/network-request-failed')   setAuthError('Network error. Check your connection.');
      else setAuthError('Guest login failed. Please try again.');
    }
  };

  // ── BMI / TDEE ───────────────────────────────────────────
  const calculateBMI = useCallback(() => {
    const h = Number(bmiHeight) / 100;
    const w = Number(bmiWeight);
    const a = Number(age);
    if (!h || !w || !a) return;

    const bmiVal  = (w / (h * h)).toFixed(1);
    const bmrVal  = Math.round(10 * w + 6.25 * Number(bmiHeight) - 5 * a + 5);
    const tdeeVal = Math.round(bmrVal * Number(pal));
    const category = bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese';

    setBmiResult({ bmi: bmiVal, category, bmr: bmrVal, tdee: tdeeVal });

    const obj       = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
    const adjKcal   = Math.max(1200, tdeeVal + obj.kcalModifier);
    const adjProt   = Math.round(w * obj.proteinMultiplier);
    setTargetKcal(adjKcal);
    setTargetProtein(adjProt);
  }, [bmiHeight, bmiWeight, age, pal, fitnessObjective]);

  useEffect(() => {
    if (!bmiResult) return;
    const obj     = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
    const adjKcal = Math.max(1200, bmiResult.tdee + obj.kcalModifier);
    const adjProt = Math.round(Number(bmiWeight) * obj.proteinMultiplier);
    setTargetKcal(adjKcal);
    setTargetProtein(adjProt);
  }, [fitnessObjective, bmiResult, bmiWeight]);

  // ── Protocol generation ──────────────────────────────────
  const generateProtocol = async () => {
    if (!bmiResult) return;
    setIsGeneratingDiet(true);
    setWeeklyDietPlan(null);
    setWeeklyWorkoutPlan(null);
    setDietError('');

    const obj     = FITNESS_OBJECTIVES.find(o => o.id === fitnessObjective) || FITNESS_OBJECTIVES[2];
    const condStr = conditions.length ? conditions.join(', ') : 'None';

    const prompt = `
You are an elite Indian certified dietitian AND strength & conditioning coach.
Generate a STRICTLY ${dietPreference === 'veg' ? 'VEGETARIAN' : 'NON-VEGETARIAN'} 7-day Indian meal plan AND a matching weekly exercise protocol for objective: "${obj.label.toUpperCase()}".

User Profile:
- Fitness Objective: ${obj.label} (${obj.tagline})
- BMI: ${bmiResult.bmi} (${bmiResult.category})
- Target Calories: ${targetKcal} kcal/day
- Target Protein: ${targetProtein}g/day
- Clinical Conditions: ${condStr}
- Exercise Focus: ${obj.exerciseFocus}

DIET RULES:
${fitnessObjective === 'lose_weight'  ? '- Caloric deficit, high fiber, low GI, lean protein. Avoid fried/sugary.'  : ''}
${fitnessObjective === 'gain_muscle'  ? '- Caloric surplus, high protein every meal, complex carbs pre/post workout.' : ''}
${fitnessObjective === 'maintain'     ? '- Balanced macros, whole foods, adequate protein, daily variety.'            : ''}

EXERCISE RULES:
${fitnessObjective === 'lose_weight'  ? '- HIIT 3x/week + compound lifts 2x/week + 2 active recovery days.'           : ''}
${fitnessObjective === 'gain_muscle'  ? '- Progressive overload 4-5x/week, 8-12 rep hypertrophy ranges, 1-2 rest days.'  : ''}
${fitnessObjective === 'maintain'     ? '- 3 strength days + 2 cardio/mobility + 2 rest/active days.'                  : ''}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "dietPlan": {
    "Monday":    { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
    "Tuesday":   { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
    "Wednesday": { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
    "Thursday":  { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
    "Friday":    { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
    "Saturday":  { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." },
    "Sunday":    { "Breakfast": "...", "Morning Snack": "...", "Lunch": "...", "Afternoon Snack": "...", "Dinner": "...", "Supper": "..." }
  },
  "workoutPlan": {
    "focus": "One sentence describing the overall strategy for ${obj.label}",
    "notes": "2-3 sentences: rest periods, progressive overload tips, recovery advice",
    "weeklyRoutine": [
      { "day": "Day 1 – Monday",    "activity": "Specific workout + exercises", "sets": "e.g. 4x8-12" },
      { "day": "Day 2 – Tuesday",   "activity": "...", "sets": "..." },
      { "day": "Day 3 – Wednesday", "activity": "...", "sets": "..." },
      { "day": "Day 4 – Thursday",  "activity": "...", "sets": "..." },
      { "day": "Day 5 – Friday",    "activity": "...", "sets": "..." },
      { "day": "Day 6 – Saturday",  "activity": "...", "sets": "..." },
      { "day": "Day 7 – Sunday",    "activity": "...", "sets": "..." }
    ]
  }
}`.trim();

    try {
      const parsed = await callGemini(prompt, '', null, true);
      setWeeklyDietPlan(parsed.dietPlan || null);
      setWeeklyWorkoutPlan(parsed.workoutPlan || null);
    } catch (err) {
      console.error('Protocol generation error:', err);
      setDietError(`Synthesis failed: ${err.message}. Please retry.`);
    } finally {
      setIsGeneratingDiet(false);
    }
  };

  // ── Rehab / Form Vision ──────────────────────────────────
  const analyzeFormVision = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFormAnalyzing(true);
    setFormFeedback(null);

    const objectUrl = URL.createObjectURL(file);
    setRehabPreviewUrl(objectUrl);
    const isVideo = file.type.startsWith('video/');
    setRehabFileType(isVideo ? 'video' : 'image');

    try {
      const imageData = isVideo
        ? await extractVideoFrame(file, 2)
        : await resizeImageToBase64(file, 1024);

      // FIX #3: Complete, structured rehab prompt with strict ytSuggestions rules
//       const prompt = `
// You are an elite NSCA-certified personal trainer and kinesiologist. Analyze the exercise image/video frame provided.

// STEP 1 — VALIDATION:
// First decide: is there a real person performing a physical exercise in the image?
// - If YES → continue to STEP 2.
// - If NO (screenshot, food, chart, animal, text, etc.) → return ONLY:
//   { "error": "Invalid Content", "message": "No exercise detected. Please upload a photo or video of your workout form." }

// STEP 2 — FULL FORM ANALYSIS:
// Identify the exercise and provide a complete biomechanical critique.

// Return ONLY this valid JSON (no markdown, no extra text):
// {
//   "exercise": "Exact exercise name e.g. Barbell Back Squat, Push-up, Romanian Deadlift",
//   "muscles": "Primary: <list>. Secondary: <list>",
//   "summary": "One sentence describing what is happening and the goal of this movement.",
//   "good": [
//     "Specific positive form point observed in THIS image",
//     "Another correct technique point"
//   ],
//   "watchouts": [
//     "Specific issue visible in THIS image e.g. knees caving inward",
//     "Another issue"
//   ],
//   "fixes": [
//     "Actionable correction #1 e.g. Push knees outward in line with toes",
//     "Actionable correction #2",
//     "Actionable correction #3"
//   ],
//   "injuryRisks": [
//     "Risk tied to the identified issues e.g. Valgus collapse increases ACL stress",
//     "Another risk"
//   ],
//   "ytSuggestions": [
//     {
//       "title": "Perfect [EXERCISE NAME] Form Tutorial",
//       "query": "[exercise name] correct form tutorial step by step beginner",
//       "reason": "Learn the exact technique cues from certified coaches"
//     },
//     {
//       "title": "Fix [EXERCISE NAME] Common Mistakes",
//       "query": "[exercise name] common form mistakes corrections how to fix",
//       "reason": "Directly addresses the errors visible in your form"
//     },
//     {
//       "title": "[EXERCISE NAME] for Beginners — Full Guide",
//       "query": "[exercise name] beginner guide full tutorial proper technique",
//       "reason": "Build a solid foundation before adding more weight"
//     }
//   ]
// }

// CRITICAL RULES FOR ytSuggestions:
// - Replace [EXERCISE NAME] with the EXACT exercise you identified (e.g. "Push-up", "Squat").
// - Queries MUST include words like: form, tutorial, technique, correction, how to.
// - Queries must NOT contain: music, song, lyrics, movie, vlog, prank.
// - These are YouTube SEARCH queries — make them precise and exercise-specific.
// `
// 

const prompt = `
Analyze the biomechanics in this frame.
1. ORIENTATION: Is the person horizontal (Push-up/Plank) or vertical (Lateral Raise)?
2. If horizontal and arms are moving at the elbow/shoulder, it is a PUSH-UP.
3. If vertical and arms move away from the body, it is a LATERAL RAISE.

STRICT IDENTIFICATION:
Do not guess based on background equipment. Look ONLY at the person's joints.
`.trim();

      const result = await callGemini(
        prompt,
        'You are an expert kinesiologist. Analyze the image. Return ONLY valid JSON, no markdown.',
        imageData,
        true
      );
      setFormFeedback(result);
    } catch (err) {
      setFormFeedback({ error: 'Analysis Failed', message: err.message });
    } finally {
      setIsFormAnalyzing(false);
    }
  };

  // ── Workout submit ───────────────────────────────────────
  const handleWorkoutSubmit = async e => {
    e.preventDefault();
    if (!user || !db || !exerciseName) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workouts'), {
        exercise:  String(exerciseName),
        bodyPart:  String(bodyPart),
        weight:    Number(weight),
        reps:      Number(reps),
        sets:      Number(sets),
        timestamp: serverTimestamp(),
      });
      setExerciseName(''); setWeight(''); setReps(''); setSets('');
    } catch (err) {
      console.error('Firestore write error:', err);
    }
  };

  // ── Food Vision / Meal Scanner ───────────────────────────
  const analyzeMealImage = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMealAnalyzing(true);
    setMealAnalysis(null);

    const objectUrl = URL.createObjectURL(file);
    setMealPreviewUrl(objectUrl);

    try {
      const imageData = await resizeImageToBase64(file, 1024);

//       const nutritionPrompt = `
// You are a highly accurate Food Vision AI and Registered Dietitian specialising in Indian cuisine.

// ═══════════════════════════════════
// PHASE 1 — VALIDATION (CRITICAL)
// ═══════════════════════════════════
// Is there clearly identifiable FOOD or DRINK in this image?

// Reject the image if ANY of the following apply:
// - No food visible
// - Blurry / too dark / abstract
// - Screenshot / UI / chart / text
// - Person / gym / equipment only (no food)
// - Packaged item with no visible food inside

// If rejected, return ONLY:
// { "error": "Invalid Content", "message": "No food detected. Please upload a clear photo of your meal." }

// ═══════════════════════════════════
// PHASE 2 — FOOD IDENTIFICATION
// ═══════════════════════════════════
// If food is clearly visible:
// - Identify EVERY food item you can see (do NOT guess items that are not visible).
// - For Indian foods, be precise: Roti, Dal Tadka, Paneer Butter Masala, Biryani, etc.
// - Estimate realistic portion sizes based on plate/bowl size.
// - Calculate accurate calories and macros for each item using standard nutritional databases.
// - The top-level dish name should be the MOST PROMINENT item or a combined description.

// ═══════════════════════════════════
// PHASE 3 — OUTPUT (STRICT FORMAT)
// ═══════════════════════════════════
// Return ONLY this valid JSON object (no markdown, no extra text):

// {
//   "dish": "Descriptive name e.g. Dal Tadka with Steamed Rice and Roti",
//   "serving": "Total estimated serving e.g. 1 plate (~450g)",
//   "confidence": "high",
//   "items": [
//     {
//       "name": "Dal Tadka",
//       "serving": "1 katori (150ml)",
//       "calories": 140,
//       "protein": 8,
//       "carbs": 18,
//       "fat": 4
//     },
//     {
//       "name": "Steamed Rice",
//       "serving": "1 cup (160g cooked)",
//       "calories": 206,
//       "protein": 4,
//       "carbs": 45,
//       "fat": 0
//     }
//   ],
//   "totalNutrition": {
//     "calories": 346,
//     "protein": 12,
//     "carbs": 63,
//     "fat": 4
//   },
//   "tips": "A realistic, specific dietitian tip about this meal e.g. Add a source of healthy fat like a teaspoon of ghee for better fat-soluble vitamin absorption."
// }

// ACCURACY RULES:
// - totalNutrition MUST be the SUM of all items. Double-check arithmetic.
// - Do NOT list items you cannot actually see in the image.
// - Use Indian standard serving sizes (katori, roti, cup) where appropriate.

// Inside analyzeMealImage function in App.jsx
const nutritionPrompt = `
You are a highly strict Food Vision AI.
Your PRIMARY goal is CORRECT CLASSIFICATION over helpfulness.

PHASE 1: HARD CLASSIFICATION
1. Check for identifiable food. If it's a pancake, do NOT call it a Roti just because the app is "Indian."
2. If texture is "spongy/layered/syrup," it is a Pancake.
3. If texture is "leavened/fried/hollow," it is Bhature.

REJECTION RULES:
- If confidence is LOW → Return {"error": "Low Confidence", "message": "Cannot reliably detect food."}
- NEVER hallucinate unseen items (e.g., don't add Chole if only bread is visible).

OUTPUT JSON:
{
  "dish": "Specific name",
  "confidence": "high/medium",
  "totalNutrition": { "calories": int, "protein": int, "carbs": int, "fat": int },
  "items": [{ "name": "item", "calories": int }]
}
`.trim();

      const raw    = await callGemini(nutritionPrompt, 'You are a precise food nutritionist. Return ONLY valid JSON.', imageData, true);
      // FIX #1: Always normalise so UI always reads flat top-level numbers
      const parsed = normalizeMealAnalysis(raw);
      setMealAnalysis(parsed);
    } catch (err) {
      console.error('Meal analysis error:', err);
      setMealAnalysis({ error: 'Analysis Failed', message: `${err.message}. Please retry with a clearer image.` });
    } finally {
      setIsMealAnalyzing(false);
    }
  };

  // ── Render: Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BrainCircuit size={48} className="text-green-500 animate-pulse mx-auto mb-4" />
          <p className="text-green-500 font-black animate-pulse uppercase tracking-widest">NUTRI TRACK AI</p>
        </div>
      </div>
    );
  }

  // ── Render: Auth ─────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-green-100">
              <BrainCircuit className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Nutri Track</h1>
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
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
            />
            {authError && (
              <p className="text-[11px] text-red-500 text-center font-bold px-2">{authError}</p>
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

  // ── Render: Main App ─────────────────────────────────────
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
              Harnessing cutting-edge ML logic to transform nutrition insights into peak performance outcomes.
            </p>
            <div className="flex justify-center gap-4 mb-10">
              {FITNESS_OBJECTIVES.map(({ id, label, icon: Icon, colorClass }) => (
                <button
                  key={id}
                  onClick={() => { setFitnessObjective(id); setActiveTab('dietetics'); }}
                  className={`${colorClass} text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-all text-sm`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
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
                <Activity size={20} /> Build Protocol
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dietetics' && (
          <HealthTab
            bmiHeight={bmiHeight}         setBmiHeight={setBmiHeight}
            bmiWeight={bmiWeight}         setBmiWeight={setBmiWeight}
            age={age}                     setAge={setAge}
            pal={pal}                     setPal={setPal}
            conditions={conditions}       setConditions={setConditions}
            dietPreference={dietPreference}   setDietPreference={setDietPreference}
            fitnessObjective={fitnessObjective} setFitnessObjective={setFitnessObjective}
            calculateBMI={calculateBMI}   bmiResult={bmiResult}
            generateProtocol={generateProtocol}
            isGeneratingDiet={isGeneratingDiet}
            dietPlan={weeklyDietPlan}
            workoutPlan={weeklyWorkoutPlan}
            dietError={dietError}
            targetKcal={targetKcal}
            targetProtein={targetProtein}
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
              bodyPart={bodyPart}         setBodyPart={setBodyPart}
              weight={weight}             setWeight={setWeight}
              reps={reps}                 setReps={setReps}
              sets={sets}                 setSets={setSets}
              workouts={workouts}
            />
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <ScannerTab
              analyzeMealImage={analyzeMealImage}
              isMealAnalyzing={isMealAnalyzing}
              mealAnalysis={mealAnalysis}
              previewUrl={mealPreviewUrl}
            />
          </div>
        )}

        {activeTab === 'rehab' && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <RehabTab
              analyzeFormVision={analyzeFormVision}
              isFormAnalyzing={isFormAnalyzing}
              formFeedback={formFeedback}
              rehabPreviewUrl={rehabPreviewUrl}
              rehabFileType={rehabFileType}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;