'use client';

import { useEffect, useRef, useState } from "react";
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import { Camera, CheckCircle2, ShieldAlert, Activity, Power, UserCheck, AlertCircle, PlayCircle, RefreshCw } from "lucide-react";

export default function CameraClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string | null>(null);
  
  // Last detection result card
  const [lastResult, setLastResult] = useState<{
    fullName: string;
    type: 'check_in' | 'check_out';
    time: string;
    photo?: string;
  } | null>(null);

  const faceMatcherRef = useRef<faceapi.FaceMatcher | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString('uz-UZ')}] ${msg}`, ...prev].slice(0, 15));
  };

  // Stop camera immediately and free all resources
  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsDetecting(false);
    addLog("🛑 Kamera o'chirildi (Sayt qotmasligi uchun resurslar bo'shatildi).");
  };

  useEffect(() => {
    mountedRef.current = true;
    
    async function initModels() {
      try {
        const employeesData = await fetch("http://localhost:3001/api/employees")
          .then(res => res.ok ? res.json() : [])
          .catch(() => []);

        if (!mountedRef.current) return;
        setEmployees(employeesData);

        // Load TensorFlow / FaceAPI models
        await tf.ready();
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        const labeledDescriptors = [];
        for (const emp of employeesData) {
          if (emp.faceDescriptor) {
            try {
              const parsed = JSON.parse(emp.faceDescriptor);
              const float32Arr = new Float32Array(parsed);
              labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp.id, [float32Arr]));
            } catch (e) {}
          }
        }

        if (labeledDescriptors.length > 0) {
          faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
          addLog("✅ Face ID modellari va xodimlar yuzlari yuklandi.");
        } else {
          addLog("⚠️ Tizimda xodimlarning Face ID ma'lumotlari topilmadi.");
        }
        if (mountedRef.current) setModelsLoaded(true);
      } catch (e) {
        addLog("❌ Face ID modellarini yuklashda xatolik.");
      }
    }

    initModels();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  const captureImage = () => {
    if (!videoRef.current) return undefined;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth || 640;
    tempCanvas.height = videoRef.current.videoHeight || 480;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(videoRef.current, 0, 0);
      return tempCanvas.toDataURL('image/jpeg', 0.85);
    }
    return undefined;
  };

  // Turn on camera -> auto detect -> auto stop
  const startCameraAndAutoDetect = async (type: 'check_in' | 'check_out') => {
    if (!modelsLoaded) {
      alert("AI modellari hali yuklanmoqda, biroz kuting...");
      return;
    }

    // Stop any existing session
    stopCamera();
    setLastResult(null);

    try {
      addLog(`📷 Kamera yoqilmoqda (${type === 'check_in' ? 'Ishga kelish' : 'Ishdan ketish'})...`);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsDetecting(true);
      setDetectionStatus("⚡ Kameraga qarang, yuzingiz aniqlanmoqda...");
      addLog("🔍 Tezkor yuz aniqlash jarayoni boshlandi...");

      let attempts = 0;
      const maxAttempts = 25; // max 5 seconds (200ms * 25)

      detectionIntervalRef.current = window.setInterval(async () => {
        attempts++;
        if (!videoRef.current || !faceMatcherRef.current) return;

        try {
          const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
          if (detection) {
            const bestMatch = faceMatcherRef.current.findBestMatch(detection.descriptor);
            if (bestMatch.label !== 'unknown') {
              // DETECTED!
              clearInterval(detectionIntervalRef.current!);
              detectionIntervalRef.current = null;

              const empId = bestMatch.label;
              const empName = employees.find(e => e.id === empId)?.fullName || empId;
              const imageBase64 = captureImage();
              const timeString = new Date().toLocaleTimeString('uz-UZ');

              // 1. INSTANTLY STOP CAMERA so browser never lags
              stopCamera();

              // 2. SHOW RESULT ON SCREEN
              setLastResult({
                fullName: empName,
                type: type,
                time: timeString,
                photo: imageBase64
              });

              addLog(`🎉 YUZ ANIQLANDI: ${empName} (${type === 'check_in' ? 'Keldi' : 'Ketdi'}). Kamera o'chirildi!`);

              // 3. SEND TO BACKEND + ADMIN TELEGRAM
              fetch("http://localhost:3001/api/attendance/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employeeId: empId,
                  cameraId: "Bosh kirish (Tezkor Face ID)",
                  image: imageBase64,
                  type: type
                })
              })
                .then(res => res.json())
                .then(data => {
                  if (data.message && data.message.includes('Already')) {
                    addLog(`ℹ️ ${empName} bugun allaqachon ${type === 'check_in' ? 'KELDI' : 'KETDI'} deb qayd etilgan.`);
                  } else {
                    addLog(`📬 Admin Telegram botiga xabar va rasm yuborildi!`);
                  }
                })
                .catch(() => {
                  addLog(`⚠️ Serverga yuborishda xatolik yuz berdi.`);
                });

              return;
            }
          }
        } catch (e) {
          // ignore transient detection errors
        }

        if (attempts >= maxAttempts) {
          clearInterval(detectionIntervalRef.current!);
          detectionIntervalRef.current = null;
          stopCamera();
          setDetectionStatus("❌ Yuz aniqlanmadi (yoki ro'yxatdan o'tmagan). Qayta urinib ko'ring.");
          addLog("❌ Vaqt tugadi, yuz aniqlanmadi. Kamera o'chirildi.");
        }
      }, 200);

    } catch (err: any) {
      stopCamera();
      addLog(`❌ Kamerani yoqib bo'lmadi: ${err.message}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Davomat Kamerasi (Tezkor Face ID)</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Sayt qotmasligi uchun kamera faqat tugma bosilganda yoqiladi, yuzni aniqlagan zahoti avtomat o&apos;chadi.
            </p>
          </div>
          {isCameraActive && (
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow flex items-center gap-2 text-sm transition-all"
            >
              <Power className="h-4 w-4" /> Kamerani darhol o&apos;chirish
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => startCameraAndAutoDetect('check_in')}
            disabled={!modelsLoaded || isCameraActive}
            className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlayCircle className="w-7 h-7" />
            <div className="text-left">
              <div className="font-bold text-lg">Ishga Kelish (Aniqlash)</div>
              <div className="text-xs text-emerald-100">Kamerani yoqadi → Yuzni aniqlaydi → O&apos;chadi</div>
            </div>
          </button>

          <button
            onClick={() => startCameraAndAutoDetect('check_out')}
            disabled={!modelsLoaded || isCameraActive}
            className="p-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlayCircle className="w-7 h-7" />
            <div className="text-left">
              <div className="font-bold text-lg">Ishdan Ketish (Aniqlash)</div>
              <div className="text-xs text-amber-100">Kamerani yoqadi → Yuzni aniqlaydi → O&apos;chadi</div>
            </div>
          </button>
        </div>

        {/* Status Alert */}
        {!modelsLoaded && (
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-xl flex items-center gap-3 text-sm">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500 shrink-0" />
            <span>AI Face ID modellari yuklanmoqda... Tayyor bo&apos;lgach tugmalar faollashadi.</span>
          </div>
        )}

        {/* Camera Display / Result Display */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-800 shadow-2xl">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover absolute inset-0 ${isCameraActive ? 'block' : 'hidden'}`}
          />

          {!isCameraActive && !lastResult && (
            <div className="flex flex-col items-center justify-center text-center p-8 z-10">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400 shadow-inner">
                <Camera className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Kamera hozircha o&apos;chirilgan</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Sayt qotmasligi va resurslar tejalishi uchun kamera faqat &quot;Ishga kelish&quot; yoki &quot;Ishdan ketish&quot; tugmalari bosilganda tezkor ishga tushadi.
              </p>
            </div>
          )}

          {isCameraActive && (
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
              <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {detectionStatus || "Kameraga qarang..."}
              </div>
            </div>
          )}

          {/* Instant Detection Result Card */}
          {lastResult && !isCameraActive && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-emerald-500/30 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-md w-full">
                {lastResult.photo ? (
                  <img src={lastResult.photo} alt="Mijoz rasmi" className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg mb-4" />
                ) : (
                  <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                )}
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-1">MUVAFFAQIYATLI QAYD ETILDI</span>
                <h2 className="text-2xl font-black text-white mb-1">{lastResult.fullName}</h2>
                <div className="text-lg font-semibold text-slate-300 mb-4">
                  Holat: <span className={lastResult.type === 'check_in' ? 'text-emerald-400' : 'text-amber-400'}>
                    {lastResult.type === 'check_in' ? '🟢 ISHGA KELDI' : '🔴 ISHDAN KETDI'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 bg-slate-800/80 px-4 py-2 rounded-xl mb-4">
                  Vaqt: {lastResult.time} | 📱 Adminga Telegram orqali rasm va xabar yuborildi
                </div>
                <button
                  onClick={() => setLastResult(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Yopish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Logs */}
      <div className="w-full lg:w-96 flex flex-col space-y-4">
        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col flex-1 h-[520px]">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Tizim Jurnali
            </h3>
            <span className="text-xs text-muted-foreground">Tezkor jurnal</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">Hozircha hodisalar yo&apos;q</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs font-mono p-2.5 rounded-lg bg-muted/40 text-foreground border border-border/50">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
